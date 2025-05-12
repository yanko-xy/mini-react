// Copyright (c) 2025 yanko
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import type { ReactNodeList } from "shared/ReactTypes";
import type {
	FiberRoot,
	Container,
} from "react-reconciler/src/ReactInternalTypes";
import { createFiberRoot } from "react-reconciler/src/ReactFiberRoot";
import { updateContainer } from "react-reconciler/src/ReactFiberReconciler";

type RootType = {
	render: (children: ReactNodeList) => void;
	_internalRoot: FiberRoot;
};

function ReactDOMRoot(_internalRoot: FiberRoot) {
	this._internalRoot = _internalRoot;
}

ReactDOMRoot.prototype.render = function (children: ReactNodeList) {
	updateContainer(children, this._internalRoot);
};

export function createRoot(container: Container): RootType {
	const root: FiberRoot = createFiberRoot(container);
	return new ReactDOMRoot(root);
}

export default {
	createRoot,
};
