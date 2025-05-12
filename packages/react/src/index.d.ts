// Copyright (c) 2025 yanko
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

declare interface ExoticComponent<P = {}> {
	(props: P): React.ReactNode;
	readonly $$typeof: symbol;
}

declare interface FragmentProps {
	children?: React.ReactNode;
}
