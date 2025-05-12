// Copyright (c) 2025 yanko
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import type { ReactElemnet } from "shared/ReactTypes";
import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import type { Fiber } from "./ReactInternalTypes";
import { craeteFiberFromElement, createFiberFromText } from "./ReactFiber";
import { Placement } from "./ReactFiberFlags";
import { isArray, isNum, isObject, isStr } from "shared/utils";

type ChildReconciler = (
	returnFiber: Fiber,
	currentFirstChild: Fiber | null,
	newChild: any
) => Fiber | null;

export const reconcileChildFibers: ChildReconciler =
	createChildRecondiler(true);
export const mountChildFibers: ChildReconciler = createChildRecondiler(false);

// 协调子节点
function createChildRecondiler(shouldTrackSideEffects: boolean) {
	// 给fiber节点添加flags
	function placeSingleChild(newFiber: Fiber) {
		if (shouldTrackSideEffects && newFiber.alternate === null) {
			newFiber.flags |= Placement;
		}
		return newFiber;
	}

	// 文本
	function reconcileSingleTextNode(
		returnFiber: Fiber,
		currentFirstChild: Fiber | null,
		textContent: string
	) {
		const created = createFiberFromText(textContent);
		created.return = returnFiber;
		return created;
	}

	// 协调单个节点，对于页面初次渲染，创建fiber，不涉及对比复用老节点
	function reconcileSingleElement(
		returnFiber: Fiber,
		currentFirstChild: Fiber | null,
		newChild: ReactElemnet
	): Fiber {
		let createdFiber = craeteFiberFromElement(newChild);
		createdFiber.return = returnFiber;
		return createdFiber;
	}

	function createChild(returnFiber: Fiber, newChild: any): Fiber | null {
		if (isText(newChild)) {
			const created = createFiberFromText(newChild + "");
			created.return = returnFiber;
			return created;
		}

		if (isObject(newChild) && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE: {
					const created = craeteFiberFromElement(newChild);
					created.return = returnFiber;
					return created;
				}
			}
		}

		return null;
	}

	function reconcileChildrenArray(
		returnFiber: Fiber,
		currentFirstChild: Fiber | null,
		newChildren: Array<any>
	): Fiber | null {
		let resultFirstChild: Fiber | null = null;
		let previousNewFiber: Fiber | null = null;
		let oldFiber = currentFirstChild;
		let newIdx = 0;

		if (oldFiber === null) {
			for (; newIdx < newChildren.length; newIdx++) {
				const newFiber = createChild(returnFiber, newChildren[newIdx]);
				if (newFiber === null) {
					continue;
				}

				// 组件更新阶段，判断在更新前后的位置是否一致，如果不一致，需要移动
				newFiber.index = newIdx;

				if (previousNewFiber === null) {
					// 第一个节点，不能用newIdx判断，因为有可能为null，而null不是有效fiber
					resultFirstChild = newFiber;
				} else {
					previousNewFiber.sibling = newFiber;
				}
				previousNewFiber = newFiber;
			}

			return resultFirstChild;
		}

		return resultFirstChild;
	}

	function reconcileChildFibers(
		returnFiber: Fiber,
		currentFirstChild: Fiber | null,
		newChild: any
	): Fiber | null {
		if (isText(newChild)) {
			return placeSingleChild(
				reconcileSingleTextNode(
					returnFiber,
					currentFirstChild,
					newChild + ""
				)
			);
		}

		// 检查newChild类型，单个标签，文本，数组
		if (isObject(newChild) && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE: {
					return placeSingleChild(
						reconcileSingleElement(
							returnFiber,
							currentFirstChild,
							newChild
						)
					);
				}
			}
		}

		// 子节点是数组
		if (isArray(newChild)) {
			return reconcileChildrenArray(
				returnFiber,
				currentFirstChild,
				newChild
			);
		}

		// TODO:
		return null;
	}

	return reconcileChildFibers;
}

function isText(newChild: any) {
	return (isStr(newChild) && newChild !== "") || isNum(newChild);
}
