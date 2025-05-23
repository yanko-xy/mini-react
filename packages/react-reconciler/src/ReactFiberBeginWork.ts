// Copyright (c) 2025 yanko
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { isNum, isStr } from "shared/utils";
import { mountChildFibers, reconcileChildFibers } from "./ReactChildFibers";
import type { Fiber } from "./ReactInternalTypes";
import {
	ClassComponent,
	Fragment,
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText,
} from "./ReactWorkTags";
import { renderWithHooks } from "./ReactFiberHooks";

// 1. 处理当前fiber，因为不同组件对应的fiber处理方式不同
// 2. 返回子节点
export function beginWork(
	current: Fiber | null,
	workInProgress: Fiber
): Fiber | null {
	switch (workInProgress.tag) {
		case HostRoot:
			return updateHostRoot(current, workInProgress);
		case HostComponent:
			return updateHostComponent(current, workInProgress);
		case HostText:
			return updateHostText(current, workInProgress);
		case Fragment:
			return updateHostFragment(current, workInProgress);
		case ClassComponent:
			return updateClassComponent(current, workInProgress);
		case FunctionComponent:
			return updateFunctionComponent(current, workInProgress);

		// TODO:
	}

	throw new Error(
		`Unknown unit of work tag (${workInProgress.tag}). This error is likely caused by a bug in ` +
			"React. Please file an issue."
	);
}

// 根fiber
function updateHostRoot(
	current: Fiber | null,
	workInProgress: Fiber
): Fiber | null {
	const nextChildren = workInProgress.memoizedState.element;

	reconcileChildren(current, workInProgress, nextChildren);

	if (current) {
		current.child = workInProgress.child;
	}

	return workInProgress.child;
}

// 原声标签
// 初次渲染： 协调
// TODO: 更新： 协调、bailout
function updateHostComponent(
	current: Fiber | null,
	workInProgress: Fiber
): Fiber | null {
	const { type, pendingProps } = workInProgress;
	// 如果原生标签只有一个文本，这个时候文本不会在生成fiber节点，而是当作这个原生节点标签的属性
	const isDirectTextChild = shouldSetTextContent(type, pendingProps);
	if (isDirectTextChild) {
		// 文本属性
		return null;
	}

	const nextChildren = workInProgress.pendingProps.children;
	reconcileChildren(current, workInProgress, nextChildren);
	return workInProgress.child;
}

// 文本
// 文本节点没有子节点，不需要协调
function updateHostText(current: Fiber | null, workInProgress: Fiber) {
	return null;
}

function updateHostFragment(current: Fiber | null, workInProgress: Fiber) {
	const nextChildren = workInProgress.pendingProps.children;
	reconcileChildren(current, workInProgress, nextChildren);
	return workInProgress.child;
}

function updateClassComponent(current: Fiber | null, workInProgress: Fiber) {
	const { type, pendingProps } = workInProgress;
	const instance = new type(pendingProps);
	const children = instance.render();
	reconcileChildren(current, workInProgress, children);
	return workInProgress.child;
}

function updateFunctionComponent(current: Fiber | null, workInProgress: Fiber) {
	const { type, pendingProps } = workInProgress;
	// const children = type(pendingProps);
	const children = renderWithHooks(
		current,
		workInProgress,
		type,
		pendingProps
	);
	reconcileChildren(current, workInProgress, children);
	return workInProgress.child;
}
// 协调子节点，构建新的fiber树
function reconcileChildren(
	current: Fiber | null,
	workInProgress: Fiber,
	nextChildren: any
) {
	if (current === null) {
		// 初次挂载
		workInProgress.child = mountChildFibers(
			workInProgress,
			null,
			nextChildren
		);

	} else {
		// 更新
		workInProgress.child = reconcileChildFibers(
			workInProgress,
			current.child,
			nextChildren
		);

	}
}

function shouldSetTextContent(type: string, props: any): boolean {
	return (
		type === "textarea" ||
		type === "noscript" ||
		isStr(props.children) ||
		isNum(props.children) ||
		(typeof props.dangerouslySetInnerHTML === "object" &&
			props.dangerouslySetInnerHTML !== null &&
			props.dangerouslySetInnerHTML.__html != null)
	);
}
