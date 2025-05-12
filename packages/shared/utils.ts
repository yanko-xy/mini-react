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

export function getCurrentTime(): number {
	return performance.now();
}

export function isArray(sth: any) {
	return Array.isArray(sth);
}

export function isNum(sth: any) {
	return typeof sth === "number";
}

export function isObject(sth: any) {
	return typeof sth === "object";
}

export function isFn(sth: any) {
	return typeof sth === "function";
}

export function isStr(sth: any) {
	return typeof sth === "string";
}
