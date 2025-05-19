import { Component, Fragment, ReactDOM, useReducer } from "../which-react";
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
	const [count1, setCount1] = useReducer((x: any) => x + 1, 0);
	return (
		<div className="border">
			<button
				onClick={() => {
					setCount1();
				}}
			>
				{count1}
			</button>
		</div>
	);
}

const jsx = (
	<div className="box border">
		<FunctionComponent name="FunctionComponent" />
		{/* <ClassComponent name="ClassComponent" /> */}
		<h1 className="border">omg</h1>
		<h2>react</h2>
		omg
	</div>
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<FunctionComponent name="FunctionComponent" /> as any
);

// ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
// 	fragment1 as any
// );

// ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
// 	"omg"
// );
