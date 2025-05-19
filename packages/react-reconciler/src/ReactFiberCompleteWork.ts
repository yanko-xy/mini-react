// Copyright (c) 2025 yanko
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { isNum, isStr } from "shared/utils";
import type { Fiber } from "./ReactInternalTypes";
import {
	ClassComponent,
	Fragment,
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText,
} from "./ReactWorkTags";

export function completeWork(
	current: Fiber | null,
	workInProgress: Fiber
): Fiber | null {
	const newProps = workInProgress.pendingProps;
	switch (workInProgress.tag) {
		case Fragment:
		case ClassComponent:
		case FunctionComponent:
		case HostRoot: {
			return null;
		}
		case HostComponent: {
			// 原声标签, type是标签名
			const { type } = workInProgress;

			console.log(current, workInProgress.stateNode)
			if (current !== null && workInProgress.stateNode != null) {
				updateHostComponent(current, workInProgress, type, newProps);
			} else {
				// 1. 创建真是DOM
				const instance = document.createElement(type);
				// 2. 初始化DOM属性
				finalizeInitialChildren(instance, null, newProps);
				// 3. 把子dom节点挂载到父节点上
				appendAllChildren(instance, workInProgress);
				workInProgress.stateNode = instance;
			}
			return null;
		}
		case HostText: {
			workInProgress.stateNode = document.createTextNode(newProps);
			return null;
		}
		// TODO:
	}

	throw new Error(
		`Unknown unit of work tag (${workInProgress.tag}). This error is likely caused by a bug in ` +
			"React. Please file an issue."
	);
}

function updateHostComponent(
	current: Fiber,
	workInProgress: Fiber,
	type: string,
	newProps: any
) {
	if (current.memoizedProps === newProps) {
		return;
	}

	finalizeInitialChildren(
		workInProgress.stateNode,
		current.memoizedProps,
		newProps
	);
}

// 初始化、更新属性
function finalizeInitialChildren(
	domElement: Element,
	prevProps: any,
	nextProps: any
) {
	// 遍历旧的props
	for (const propKey in prevProps) {
		const prevProp = prevProps[propKey];
		if (propKey === "children") {
			if (isStr(prevProp) || isNum(prevProp)) {
				domElement.textContent = "";
			}
		} else {
			// 设置属性
			if (propKey === "onClick") {
				document.removeEventListener("click", prevProp);
			} else {
				if (!(prevProp in nextProps)) {
					domElement[propKey] = "";
				}
			}
		}
	}

	// 遍历新的props
	for (const propKey in nextProps) {
		const nextProp = nextProps[propKey];
		if (propKey === "children") {
			if (isStr(nextProp) || isNum(nextProp)) {
				domElement.textContent = nextProp.toString();
			}
		} else {
			// 设置属性
			if (propKey === "onClick") {
				document.addEventListener("click", nextProp);
			} else {
				domElement[propKey] = nextProp;
			}
		}
	}
}

function appendAllChildren(parent: Element, workInProgress: Fiber) {
	let nodeFiber = workInProgress.child;
	while (nodeFiber !== null) {
		if (isHost(nodeFiber)) {
			parent.appendChild(nodeFiber.stateNode); // nodeFiber.stateNode 就是真实的DOM节点
		} else if (nodeFiber.child !== null) {
			nodeFiber = nodeFiber.child;
			continue;
		}

		if (nodeFiber === workInProgress) {
			return;
		}

		while (nodeFiber.sibling === null) {
			if (
				nodeFiber.return === null ||
				nodeFiber.return === workInProgress
			) {
				return;
			}
			nodeFiber = nodeFiber.return;
		}
		nodeFiber = nodeFiber.sibling;
	}
}

// 判断是否是原生标签
// fiber.stateNode 就是真实的DOM节点
export function isHost(fiber: Fiber): boolean {
	return fiber.tag === HostComponent || fiber.tag === HostText;
}
