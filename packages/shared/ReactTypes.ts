// Copyright (c) 2025 yanko
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

export type ReactElemnet = {
	$$typeof: any;
	type: any;
	key: any;
	ref: any;
	props: any;
	// ReactFiber
	_owner: any;
};

export type ReactNode = ReactElemnet | ReactText | ReactFragment;

export type ReactEmpty = null | void | boolean;

export type ReactNodeList = ReactEmpty | ReactNode;

export type ReactFragment = ReactEmpty | Iterable<ReactNode>;

export type ReactText = string | number;
