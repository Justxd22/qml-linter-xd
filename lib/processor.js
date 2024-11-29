import { parse } from '@oltodo/qml-parser';

const blocksCache = new Map();
const func_USED = new Map();
const var_USED = new Map();
const UnsatisfiableRules = ["Unterminated string constant", "'return' outside of function"]


// skip false eslint alarms
function excludeUnsatisfiableRules(message) {
	if (message.ruleId === 'no-unused-vars'){
		// skip qml internal event handler functions like on*
		if (/.*'on\w*' is defined but never used.*/i.test(message.message.trim())){
			return false;
		}
		// skip false unused-var alarm
		const exist = [
            ...Array.from(func_USED.entries()),
            ...Array.from(var_USED.entries())
        ]
			.filter(([key, value]) => value > 0) // Allow functions that were used atleast 1 time
			.some(([key]) => message.message.includes(key)); // Check if any of these keys are in the message
		if (exist){
			return false; // false alarm disable this warning 
		}
	}
	if (UnsatisfiableRules.some(rule => message.message.includes(rule))){
		return false; // false alarm disable this warning 
	}
	return true
}


function extractJsFromQml(qmlContent) {
    // Step 1: Parse QML into an AST
    const qmlAst = parse(qmlContent);

    // Step 2: Traverse the AST to find JavaScript blocks
    const jsBlocks = [];
    function traverse(node) {
        let code = null;
		let Xcode = null; // modified code to remove func name
		let location = null;
        if (node.kind === 'Property' && node.value.kind === 'JavascriptValue') {
            code = `var ${node.identifier} = ${node.value.value}`;

			location = node.value.loc;
			// save var name for unused vars 
			var_USED.set(node.identifier, 0)
			// check if this var was ever used in previous saved code blocks
			const used = jsBlocks.some(c => c.code.includes(node.identifier));
			if (used){
				console.log("PREV CALL WAS DETECTED", used, node.identifier)
				var_USED.set(node.identifier, 1)
			}
        }
		if (node.kind === 'Attribute' && (node.value.kind === 'JavascriptBlock' || node.value.kind === 'JavascriptValue')){
            code = node.value.value;
			location = node.value.loc;
		}
        if (node.kind === 'Function') {
            code = node.body;
			location = node.loc;
			// save func name for unused vars detection
			func_USED.set(node.identifier, 0)
			// check if this func was ever called in previous saved code blocks
			const called = jsBlocks.some(c => c.code.includes(node.identifier));
			if (called){
				console.log("PREV CALL WAS DETECTED", called, node.identifier)
				func_USED.set(node.identifier, 1)
			}
			// remove func name to avoid double counting it in unused-var system
			const lines = code.split("\n");

			if (lines.length > 0) {
    			lines[0] = lines[0].replace(node.identifier, "").trim();
			}

			// Join the lines back together
			Xcode = lines.join("\n");
        }    
        if (code){
			// validate if any of saved func names is being used through all code blocks
			// to remove false unused-var warning for a function
			const reusedFUNC = Array.from(func_USED.keys()).filter(word => (Xcode ?? code).includes(word));
			const reusedVAR = Array.from(var_USED.keys()).filter(word => (Xcode ?? code).includes(word));
			if (reusedFUNC){
				reusedFUNC.forEach(word => {
					// increment how much times it was called in the code
					func_USED.set(word, func_USED.get(word) + 1)
					console.log("FUNCCCC/VAR WAS CALLEDDDDx", word, func_USED.get(word));
				});
			}
			if (reusedVAR){
				reusedVAR.forEach(word => {
					// increment how much times it was called in the code
					if (!(code.includes(`var ${word} =`))){
						var_USED.set(word, var_USED.get(word) + 1)
						console.log("FUNCCCC/VAR WAS CALLEDDDDx", word, var_USED.get(word));
					}
				});
			}
			console.log(func_USED, var_USED);
			console.log("AAAARRRR", code.includes("args"), code.includes(`var args =`), );
			jsBlocks.push({code, location});

        }
        if (node.children) {
            node.children.forEach(traverse);
        }

    }
    // use recursion to check all childern
    traverse(qmlAst);
    return { js: jsBlocks};
}


function preprocess(sourceText, filename) {
	console.log("Preprocessing Input:", filename);
	const jsBlocks = extractJsFromQml(sourceText, filename);
	if (!jsBlocks.js){
		return;
	}
	blocksCache.set(filename, jsBlocks.js);

	// Return JavaScript blocks as individual files for ESLint
	// TO:Do mark used vars/func using  /* eslint-disable no-unused-vars */ 
	return jsBlocks.js.map((js, index) => ({
		text: js.code,
		filename: `${index}.js`,
	}));
}

function postprocess(messages, filename) {
	const blocks = blocksCache.get(filename);

	blocksCache.delete(filename);
	// console.log("Postprocessing Output:", messages, filename);

	return messages.flatMap((group, i) => {
		console.log(i, group)
		if (Array.isArray(group) && group.length === 0) {
			return [];
		}

		return group.map((err) => {
			const adjustedError = {
				...err,
				line: (err.line || 0) + (blocks[i]?.location.start.line - 1 || 0),
			};
			return adjustedError;
		}).filter(excludeUnsatisfiableRules);
	});
}

export const processor = {
	meta: {
		name: "@justxd22/qml/qml",
		version: "1.0.0",
	},
	preprocess: preprocess,
	postprocess: postprocess,
};