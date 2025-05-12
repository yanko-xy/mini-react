// Copyright (c) 2025 yanko
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import type { Flags } from "./ReactFiberFlags";
import type { WorkTag } from "./ReactWorkTags";

export type Fiber = {
	// 标记fiber的类型，即描述的组件类型，如原声标签，函数组件、类组件、Fragment等。参考ReactWorkTags.ts
	tag: WorkTag;

	// 标记组件在当前层级下的唯一性
	key: null | string;

	// 组件类型
	elementType: any;

	// 标记组件类型，如果是原声组件，这里是字符串，如果是函数组件，这里是函数。如果是类组件，这里是类。
	type: any;

	// 如果组件是原声标签，DOM；如果是类组件，是实例；如果是函数组件，是null
	// 如果组件是原声根节点 ，stateNode存的是FiberRoot。HostRoot=3
	stateNode: any;

	// 父fiber
	return: Fiber | null;

	// 单链表结构
	// 第一个子fiber
	child: Fiber | null;

	// 下一个兄弟fiber
	sibling: Fiber | null;

	// 记录了节点在当前层级中的位置下标，用于diff时候判断节点是否需要发生移动
	index: number;

	// 新的props
	pendingProps: any;

	// 上一次渲染时使用的props
	memoizedProps: any;

	// 不同组件的 memoizedState 存储不同
	// 函数组件 hooks
	// 类组件 state
	// HostRoot RootState
	memoizedState: any;

	// Effect
	flags: Flags;

	// 缓存fiber
	alternate: Fiber | null;
};

export type Container = Element | Document | DocumentFragment;

export type FiberRoot = {
	containerInfo: Container;
	current: Fiber;
	// 一个准备提交 work-in-porgress, HostRoot
	finishedWork: Fiber | null;
};
