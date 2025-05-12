// Copyright (c) 2025 yanko
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { isNum, isStr } from "shared/utils";
import type { Fiber } from "./ReactInternalTypes";
import { HostComponent, HostRoot, HostText } from "./ReactWorkTags";

export function completeWork(
	current: Fiber | null,
	workInProgress: Fiber
): Fiber | null {
	const newProps = workInProgress.pendingProps;
	switch (workInProgress.tag) {
		case HostRoot: {
			return null;
		}
		case HostComponent: {
			// 原声标签, type是标签名
			const { type } = workInProgress;
			// 1. 创建真是DOM
			const instance = document.createElement(type);
			// 2. 初始化DOM属性
			finalizeInitialChildren(instance, newProps);
			// 3. 把子dom节点挂载到父节点上
			appendAllChildren(instance, workInProgress);
			workInProgress.stateNode = instance;
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

// 初始化属性
function finalizeInitialChildren(domElement: Element, props: any) {
	for (const propKey in props) {
		const nextProp = props[propKey];
		if (propKey === "children") {
			if (isStr(nextProp) || isNum(nextProp)) {
				domElement.textContent = nextProp.toString();
			}
		} else {
			// 设置属性
			domElement[propKey] = nextProp;
		}
	}
}

function appendAllChildren(parent: Element, workInProgress: Fiber) {
	let nodeFiber = workInProgress.child;
	while (nodeFiber !== null) {
		parent.appendChild(nodeFiber.stateNode);
		nodeFiber = nodeFiber.sibling;
	}
}
