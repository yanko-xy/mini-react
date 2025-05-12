// Copyright (c) 2025 yanko
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { performConcurrentWorkOnRoot } from "./ReactFiberWorkLoop";
import type { FiberRoot } from "./ReactInternalTypes";
import { NormalPriority, Scheduler } from "scheduler";

export function ensureRootIsScheduled(root: FiberRoot) {
	queueMicrotask(() => {
		scheduleTaskForRootDuringMicrotask(root);
	});
}

function scheduleTaskForRootDuringMicrotask(root: FiberRoot) {
	Scheduler.scheduleCallback(
		NormalPriority,
		performConcurrentWorkOnRoot.bind(null, root)
	);
}
