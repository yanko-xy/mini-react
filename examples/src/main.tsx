import { Component, Fragment, ReactDOM } from "../which-react";
import "./index.css";

// const fragment1 = (
// 	<>
// 		<>
// 			<h1>omg</h1>
// 			<h2>react</h2>
// 		</>
// 	</>
// );

// const fragment2 = (
// 	<Fragment>
// 		<>
// 			<h1>omg</h1>
// 			<h2>react</h2>
// 		</>
// 	</Fragment>
// );

// class ClassComponent extends Component {
// 	render() {
// 		return (
// 			<div>
// 				<h1 className="border">{this.props.name}</h1>
// 				<h2>react</h2>
// 			</div>
// 		);
// 	}
// }

function FunctionComponent({ name }: { name: string }) {
	return (
		<div>
			<h1 className="border">{name}</h1>
			<h2>react</h2>
		</div>
	);
}

const jsx = (
	<main className="box border">
		<FunctionComponent name="FunctionComponent" />
		{/* <ClassComponent name="ClassComponent" /> */}
		<h1 className="border">omg</h1>
		<h2>react</h2>
		omg
	</main>
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	jsx as any
);

// ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
// 	fragment1 as any
// );

// ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
// 	"omg"
// );
