// Copyright (c) 2025 yanko
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { createFiber } from "./ReactFiber";
import type { Container, Fiber, FiberRoot } from "./ReactInternalTypes";
import { HostRoot } from "./ReactWorkTags";

export function createFiberRoot(containerInfo: Container): FiberRoot {
	const root: FiberRoot = new FiberRootNode(containerInfo);
	const uninitializedFibe: Fiber = createFiber(HostRoot, null, null);
	root.current = uninitializedFibe;
	uninitializedFibe.stateNode = root;
	return root;
}

export function FiberRootNode(containerInfo: Container) {
	this.containerInfo = containerInfo;
	this.current = null;
	this.finishedWork = null;
}
