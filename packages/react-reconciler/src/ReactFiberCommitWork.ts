// Copyright (c) 2025 yanko
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { Placement } from "./ReactFiberFlags";
import type { Fiber, FiberRoot } from "./ReactInternalTypes";
import { HostComponent, HostRoot, HostText } from "./ReactWorkTags";

export function commitMutationEffects(root: FiberRoot, finishedWork: Fiber) {
	// 1. 遍历
	recursivelyTraverseMutationEffects(root, finishedWork);
	commitReconciliationEffects(finishedWork);
}

function recursivelyTraverseMutationEffects(
	root: FiberRoot,
	parentFiber: Fiber
) {
	let child = parentFiber.child;
	while (child !== null) {
		commitMutationEffects(root, child);
		child = child.sibling;
	}
}

// 提交协调的产生的effects, 比如flags， Placement、Update、ChildDeletion
function commitReconciliationEffects(finishedWork: Fiber) {
	const flags = finishedWork.flags;
	if (flags & Placement) {
		// 页面初次渲染 新增插入 appendChild
		// TODO: 页面更新、修改位置 appendChild || insertBefore
		commitPlacement(finishedWork);
		finishedWork.flags &= ~Placement;
	}
}

function commitPlacement(finishedWork: Fiber) {
	// parentDom.appendChild(domNode)
	if (
		finishedWork.stateNode &&
		(finishedWork.tag === HostComponent || finishedWork.tag === HostText)
	) {
		// finishedWork是有dom节点
		const domNode = finishedWork.stateNode;
		// 找domNode的父dom节点对应的fiber
		const parentFiber = getHostParentFiber(finishedWork);
		let parentDom = parentFiber.stateNode;

		if (parentDom.containerInfo) {
			// HostRoot
			parentDom = parentDom.containerInfo;
		}
		parentDom.appendChild(domNode);
	}
}

function getHostParentFiber(finishedWork: Fiber): Fiber {
	let parent = finishedWork.return;
	while (parent !== null) {
		if (isHostParent(parent)) {
			return parent;
		}
		parent = parent.return;
	}

	throw new Error(
		"Expected to find a host parent. This error is likely caused by a bug " +
			"in React. Please file an issue."
	);
}

// 检查fiber是HostParent
function isHostParent(fiber: Fiber): boolean {
	return fiber.tag === HostComponent || fiber.tag === HostRoot;
}
