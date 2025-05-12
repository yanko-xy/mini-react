// Copyright 2025 sheepzhao
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { describe, expect, it } from "vitest";
import { peek, push, pop, type Heap, type Node } from "../src/SchedulerMinHeap";

let idCounter = 0;
function createNode(val: number): Node {
	return { id: idCounter, sortIndex: val };
}

describe("test min heap", () => {
	it("empty heap return null", () => {
		const tasks: Heap<Node> = [];
		expect(peek(tasks)).toBe(null);
	});

	it("heap length === 1", () => {
		const tasks: Heap<Node> = [createNode(1)];
		expect(peek(tasks)?.sortIndex).toEqual(1);
	});

	it("heap length > 1", () => {
		const tasks: Heap<Node> = [createNode(1)];
		push(tasks, createNode(2));
		push(tasks, createNode(3));
		expect(peek(tasks)?.sortIndex).toEqual(1);
		push(tasks, createNode(0));
		expect(peek(tasks)?.sortIndex).toEqual(0);
		pop(tasks);
		expect(peek(tasks)?.sortIndex).toEqual(1);
	});
});
