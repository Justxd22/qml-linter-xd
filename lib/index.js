import { processor } from "./processor.js";


const plugin = {
	meta: {
		name: "@justxd22/qml-lint",
		version: "1.0.0",
	},
	processors: {
		qml: processor,
	}
};

export default plugin;
