import { processor } from "./processor.js";
import { pragmaJsProcessor } from "./pragmaJsProcessor.js";


const plugin = {
	meta: {
		name: "@justxd22/qml-lint",
		version: "1.0.0",
	},
	processors: {
		qml: processor,
		"pragma-js": pragmaJsProcessor
	}
};

export default plugin;
