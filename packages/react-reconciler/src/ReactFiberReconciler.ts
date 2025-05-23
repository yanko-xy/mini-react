// Copyright (c) 2025 yanko
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import type { ReactNodeList } from "shared/ReactTypes";
import type { FiberRoot } from "./ReactInternalTypes";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";

export function updateContainer(element: ReactNodeList, container: FiberRoot) {
	// ! 1.获取current
	const current = container.current;
	current.memoizedState = { element };

	// ! 2.调度更新
	scheduleUpdateOnFiber(container, current);
}
