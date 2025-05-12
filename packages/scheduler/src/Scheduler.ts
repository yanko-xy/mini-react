// Copyright 2025 sheepzhao
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// !实现一个单线程任务调度器

import {
	type PriorityLevel,
	NoPriority,
	ImmediatePriority,
	NormalPriority,
	UserBlockingPriority,
	LowPriority,
	IdlePriority,
} from "./SchedulerPriorities";
import { peek, pop, push } from "./SchedulerMinHeap";
import { getCurrentTime, isFn, isNum, isObject } from "shared/utils";
import {
	lowPriorityTimeout,
	maxSigned31BitInt,
	normalPriorityTimeout,
	userBlockingPriorityTimeout,
} from "./SchedulerFeatureFlags";

type Callback = (arg: boolean) => Callback | null;

export type Task = {
	id: number;
	callback: Callback | null;
	priorityLevel: PriorityLevel;
	startTime: number;
	expirationTime: number;
	sortIndex: number;
};

// 任务池，最小堆
const taskQueue: Array<Task> = []; // 没有延迟的任务
const timerQueue: Array<Task> = []; // 有延迟的任务

// 标记task的唯一性
let taskIdCounter = 1;
let currentTask: Task | null = null;
let currentPriorityLevel: PriorityLevel = NoPriority;

// 任务的超时id，用于clearTimeou
let taskTimeoutID: NodeJS.Timeout = null;

// 记录时间切片的起始值，时间戳
let startTime = -1;

// 时间切片，这是一个时间段
let frameInterval = 5;

// 是否有 work 在执行
let isPerformingWork = false;

// 主线程是否在调度
let isHostCallbackScheduled = false;

// 消息循环是否在执行
let isMessageLoopRunning = false;

// 是否有任务在倒计时
let isHostTimeoutScheduled = false;

// 把控制器交还给主线程
function shouldYieldToHost() {
	const timeElapsed = getCurrentTime() - currentTask.startTime;

	if (timeElapsed < frameInterval) {
		return false;
	}

	return true;
}

// 任务调度器的入口函数
function scheduleCallback(
	priorityLevel: PriorityLevel,
	callback: Callback,
	options?: { delay: number }
) {
	const currentTime = getCurrentTime();
	let startTime: number; // 任务的开始时间

	if (isObject(options) && options != null) {
		let delay = options.delay;
		if (isNum(delay) && delay > 0) {
			// 有效的延迟时间
			startTime = currentTime + delay;
		} else {
			// 无效的延迟时间
			startTime = currentTime;
		}
	} else {
		// 没有延迟时间
		startTime = currentTime;
	}

	// expirationTime 是任务的过期时间，理论上的任务执行时间
	let timeout: number;
	switch (priorityLevel) {
		case ImmediatePriority:
			// 立即执行
			timeout = -1;
			break;
		case UserBlockingPriority:
			// 用户阻塞优先级
			timeout = userBlockingPriorityTimeout;
			break;
		case LowPriority:
			timeout = lowPriorityTimeout;
			break;
		case IdlePriority:
			// 永不超时
			timeout = maxSigned31BitInt;
			break;
		default:
			// 正常优先级
			timeout = normalPriorityTimeout;
			break;
	}

	const expirationTime = startTime + timeout;
	const newTask: Task = {
		id: taskIdCounter++,
		callback,
		priorityLevel,
		startTime,
		expirationTime,
		sortIndex: -1,
	};

	if (startTime > currentTime) {
		// newTask任务有延迟
		newTask.sortIndex = startTime;
		// 任务在timerQueue到达开始时间之后，就会被推入taskQueue
		push(timerQueue, newTask);

		// 每次只倒计时一个任务
		if (peek(taskQueue) === null && newTask == peek(timerQueue)) {
			if (isHostTimeoutScheduled) {
				// newTask 才是堆顶任务，才应该最先到达执行时间，newTask应该被倒计时
				// 但是其他任务也被倒计时了，说明有问题
				cancelHostTimeout();
			} else {
				isHostTimeoutScheduled = true;
			}

			requestHostTimeout(handleTimeout, expirationTime - currentTime);
		}
	} else {
		newTask.sortIndex = expirationTime;
		push(taskQueue, newTask);

		if (!isHostCallbackScheduled && !isPerformingWork) {
			isHostCallbackScheduled = true;
			requestHostCallback();
		}
	}
}

function requestHostCallback() {
	if (!isMessageLoopRunning) {
		isMessageLoopRunning = true;
		schedulePerformWorkUntilDeadline();
	}
}

function performWorkUntilDeadline() {
	if (isMessageLoopRunning) {
		const currentTime = getCurrentTime();
		// 记录一个work的起始时间，其实就是一个时间切片的起始时间，是一个时间戳
		startTime = currentTime;
		let hasMoreWork = true;
		try {
			hasMoreWork = flushWork(currentTime);
		} finally {
			if (hasMoreWork) {
				schedulePerformWorkUntilDeadline();
			} else {
				isMessageLoopRunning = false;
			}
		}
	}
}

const channel = new MessageChannel();
const port = channel.port2;
(channel.port1 as any).onmessage = performWorkUntilDeadline;
function schedulePerformWorkUntilDeadline() {
	port.postMessage(null);
}

function flushWork(initialTime: number): boolean {
	isHostCallbackScheduled = false;
	isPerformingWork = true;

	let previousPriorityLevel = currentPriorityLevel;
	try {
		return workLoop(initialTime);
	} finally {
		currentTask = null;
		currentPriorityLevel = previousPriorityLevel;
		isPerformingWork = false;
	}
}

// 取消某个任务，由于堆小堆没法直接删除，因此只能初步把 task.callback 设置为 null
// 在任务调度器中， 当这个任务位于堆顶时，删掉
function cancelCallback() {
	currentTask.callback = null;
}

// 获取当前正在执行任务的优先级
function getCurrentPriorityLevel(): PriorityLevel {
	return currentPriorityLevel;
}

// 有很多task，每个task都有一个callback，callback执行完了，就执行下一个task
// 一个work就是一个时间切片内执行的一下task
// 时间切片要循环，就是work要循环(loop)
// 返回为true，表示还有任务没有执行完，需要继续执行
function workLoop(initialTime: number): boolean {
	let currentTime = initialTime;
	advanceTimers(currentTime);
	currentTask = peek(taskQueue);
	while (currentTask != null) {
		if (currentTask.expirationTime > currentTime && shouldYieldToHost()) {
			break;
		}

		// 执行任务
		const callback = currentTask.callback;
		if (isFn(callback)) {
			// 有效任务
			currentTask.callback = null;
			currentPriorityLevel = currentTask.priorityLevel;
			const didUserCallbackTimeout =
				currentTask.expirationTime <= currentTime;
			const continuationCallback = callback(didUserCallbackTimeout);
			currentTime = getCurrentTime();
			if (isFn(continuationCallback)) {
				currentTask.callback = continuationCallback;
				advanceTimers(currentTime);
				return true;
			} else {
				if (currentTask == peek(taskQueue)) {
					pop(taskQueue);
				}
				advanceTimers(currentTime);
			}
		} else {
			// 无效任务
			pop(taskQueue);
		}

		currentTask = peek(taskQueue);
	}

	if (currentTask != null) {
		return true;
	} else {
		const firstTimer = peek(timerQueue);
		if (firstTimer !== null) {
			isHostTimeoutScheduled = true;
			requestHostTimeout(
				handleTimeout,
				firstTimer.startTime - currentTime
			);
		}
		return false;
	}
}

function requestHostTimeout(
	callback: (currentTime: number) => void,
	ms: number
) {
	taskTimeoutID = setTimeout(() => {
		callback(getCurrentTime());
	}, ms);
}

function cancelHostTimeout() {
	clearTimeout(taskTimeoutID);
	taskTimeoutID = null;
}

function advanceTimers(currentTime: number) {
	let timer = peek(timerQueue);
	while (timer != null) {
		if (timer.callback === null) {
			// 无效任务
			pop(timerQueue);
		} else if (timer.startTime <= currentTime) {
			// 有效任务
			// 任务已经到达开始时间，可以推入taskQueue
			pop(timerQueue);
			timer.sortIndex = timer.expirationTime;
			push(taskQueue, timer);
		} else {
			// 还没到开始时间
			return;
		}
		timer = peek(timerQueue);
	}
}

function handleTimeout(currentTime: number) {
	isHostTimeoutScheduled = false;
	// 将延迟任务从timerQueue中移动到taskQueue
	advanceTimers(currentTime);

	if (!isHostCallbackScheduled) {
		if (peek(taskQueue) !== null) {
			isHostCallbackScheduled = true;
			requestHostCallback();
		} else {
			const firstTimer = peek(timerQueue);
			if (firstTimer !== null) {
				isHostTimeoutScheduled = true;
				requestHostTimeout(
					handleTimeout,
					firstTimer.startTime - currentTime
				);
			}
		}
	}
}

export {
	ImmediatePriority,
	NormalPriority,
	UserBlockingPriority,
	LowPriority,
	IdlePriority,
	scheduleCallback, // 某个任务进入调度器，准备调度
	cancelCallback, // 取消某个任务，由于堆小堆没法直接删除，因此只能初步把 task.callback 设置为 null
	getCurrentPriorityLevel, // 获取当前正在执行任务的优先级
	shouldYieldToHost, // 把控制器交还给主线程
};
