// Copyright (c) 2025 yanko
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT\

import { REACT_FRAGMENT_TYPE } from "shared/ReactSymbols";
import { NoFlags, type Flags } from "./ReactFiberFlags";
import type { Fiber } from "./ReactInternalTypes";
import {
	ClassComponent,
	Fragment,
	FunctionComponent,
	HostComponent,
	HostText,
	IndeterminateComponent,
	type WorkTag,
} from "./ReactWorkTags";
import type { ReactElemnet } from "shared/ReactTypes";
import { isFn, isStr } from "shared/utils";

// 创建一个fiber
export function createFiber(
	tag: WorkTag,
	pendingProps: any,
	key: null | string
): Fiber {
	return new FiberNode(tag, pendingProps, key);
}

function FiberNode(tag: WorkTag, pendingProps: any, key: null | string) {
	// 标记fiber的类型，即描述的组件类型，如原声标签，函数组件、类组件、Fragment等。参考ReactWorkTags.ts
	this.tag = tag;
	// 标记组件在当前层级下的唯一性
	this.key = key;
	// 组件类型
	this.elementType = null;
	// 标记组件类型，如果是原声组件，这里是字符串，如果是函数组件，这里是函数。如果是类组件，这里是类。
	this.type = null;
	// 如果组件是原声标签，DOM；如果是类组件，是实例；如果是函数组件，是null
	// 如果组件是原声根节点点点滴滴，stateNode存的是FiberRoot。HostRoot=3
	this.stateNode = null;

	// 父fiber
	this.return = null;
	// 单链表结构
	// 第一个子fiber
	this.child = null;
	// 下一个兄弟fiber
	this.sibling = null;
	// 记录了节点在当前层级中的位置下标，用于diff时候判断节点是否需要发生移动
	this.index = 0;

	// 新的props
	this.pendingProps = pendingProps;
	// 上一次渲染时使用的props
	this.memoizedProps = null;
	// 不同组件的 memoizedState 存储不同
	// 函数组件 hooks
	// 类组件 state
	// HostRoot RootState
	this.memoizedState = null;

	// Effect
	this.flags = NoFlags;
	// 缓存fiber
	this.alternate = null;
}

// 根据 ReactElement 创建Fiber
export function craeteFiberFromElement(elemnet: ReactElemnet) {
	const { type, key } = elemnet;
	const pendingProps = elemnet.props;
	const fiber = createFiberFromTypeAndProps(type, key, pendingProps);
	return fiber;
}

// 根据 TypeAndProps 创建Fiber
export function createFiberFromTypeAndProps(
	type: any,
	key: null | string,
	pendingProps: any
) {
	let fiberTag: WorkTag = IndeterminateComponent;

	if (isFn(type)) {
		// 函数组件、类组件
		if (type.prototype.isReactComponent) {
			fiberTag = ClassComponent;
		} else {
			fiberTag = FunctionComponent;
		}
	}
	if (isStr(type)) {
		// 原声标签
		fiberTag = HostComponent;
	} else if (type === REACT_FRAGMENT_TYPE) {
		fiberTag = Fragment;
	}

	const fiber = createFiber(fiberTag, pendingProps, key);
	fiber.elementType = type;
	fiber.type = type;
	return fiber;
}

export function createWorkInProgress(current: Fiber, pendingProps: any) {
	let workInProgress = current.alternate;
	if (workInProgress === null) {
		workInProgress = createFiber(current.tag, pendingProps, current.key);
		workInProgress.elementType = current.elementType;
		workInProgress.type = current.type;
		workInProgress.stateNode = current.stateNode;

		workInProgress.alternate = current;
		current.alternate = workInProgress;
	} else {
		workInProgress.pendingProps = pendingProps;
		workInProgress.type = current.type;
		workInProgress.flags = NoFlags;
	}

	workInProgress.flags = current.flags;

	workInProgress.child = current.child;
	workInProgress.memoizedProps = current.memoizedProps;
	workInProgress.memoizedState = current.memoizedState;

	workInProgress.sibling = current.sibling;
	workInProgress.index = current.index;

	return workInProgress;
}

export function createFiberFromText(content: string): Fiber {
	const fiber = createFiber(HostText, content, null);
	return fiber;
}
