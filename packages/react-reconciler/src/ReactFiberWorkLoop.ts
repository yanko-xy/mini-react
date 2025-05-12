// Copyright (c) 2025 yanko
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { createWorkInProgress } from "./ReactFiber";
import { beginWork } from "./ReactFiberBeginWork";
import { commitMutationEffects } from "./ReactFiberCommitWork";
import { completeWork } from "./ReactFiberCompleteWork";
import { ensureRootIsScheduled } from "./ReactFiberRootScheduler";
import type { Fiber, FiberRoot } from "./ReactInternalTypes";

type ExecutionContext = number;

export const NoContext = /*                     */ 0b000;
export const BatchedContext = /*                */ 0b001;
export const RenderContext = /*                 */ 0b010;
export const CommitContext = /*         		*/ 0b100;

// 描述当前的执行的阶段
let executionContext: ExecutionContext = NoContext;

let workInProgress: Fiber | null = null;
let workInProgressRoot: FiberRoot | null = null;

export function scheduleUpdateOnFiber(root: FiberRoot, fiber: Fiber) {
	workInProgress = fiber;
	workInProgressRoot = root;

	ensureRootIsScheduled(root);
}

export function performConcurrentWorkOnRoot(root: FiberRoot) {
	// ! 1. render, 构建fiber树VDOM (beginWOrk | completeWork)
	renderRootSync(root);

	console.log(
		"%c [ renderRootSync ]: ",
		"color: #bf2c9f; background: pink; font-size: 13px;",
		"renderRootSync",
		root
	);

	const finishedWork = root.current.alternate;
	root.finishedWork = finishedWork;

	// ! 2. commit, VDOM->DOM
	commitRoot(root);
}

function renderRootSync(root: FiberRoot) {
	// !1. render阶段开始
	const prevExecutionContext = executionContext;
	executionContext |= RenderContext;
	// !2. 初始化
	prepareFreshStack(root);
	// !3. 遍历构建fiber树
	workLoopSync();
	// !4. render结束
	executionContext = prevExecutionContext;
	workInProgressRoot = null;
}

function commitRoot(root: FiberRoot) {
	// !1. commit阶段开始
	const prevExecutionContext = executionContext;
	executionContext |= CommitContext;
	// !2. mutation阶段，渲染DOM树
	commitMutationEffects(root, root.finishedWork);

	// !4. commit结束
	executionContext = prevExecutionContext;
	workInProgressRoot = null;
}

function prepareFreshStack(root: FiberRoot) {
	root.finishedWork = null;

	workInProgressRoot = root; // FiberRoot
	const rootWorkInProgress = createWorkInProgress(root.current, null);
	workInProgress = rootWorkInProgress; // Firber

	return rootWorkInProgress;
}

function workLoopSync() {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress);
	}
}
function performUnitOfWork(unitOfWork: Fiber) {
	const current = unitOfWork.alternate;
	// !1. beginWork
	let next = beginWork(current, unitOfWork);
	// 1.1 执行自己
	// 1.2 (协调、 bailout) 返回子节点
	if (next === null) {
		// 没有产生新的work
		// !2. completeWork
		completeUnitOfWork(unitOfWork);
	} else {
		workInProgress = next;
	}
}

// 深度优先遍历
function completeUnitOfWork(unitOfWork: Fiber) {
	let completedWork = unitOfWork;

	do {
		const current = completedWork.alternate;
		const returnFiber = completedWork.return;
		let next = completeWork(current, completedWork);
		if (next !== null) {
			workInProgress = next;
			return;
		}

		const siblingFiber = completedWork.sibling;
		if (siblingFiber !== null) {
			workInProgress = siblingFiber;
			return;
		}

		completedWork = returnFiber;
		workInProgress = completedWork;
	} while (completedWork != null);
}
