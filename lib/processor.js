import { parse } from '@oltodo/qml-parser';

const blocksCache = new Map();
const func_USED = new Map();
const var_USED = new Map();
const UnsatisfiableRules = ["Unterminated string constant", "'return' outside of function", "semi-var"]


// skip false eslint alarms
export function excludeUnsatisfiableRules(message) {
	if (!message.ruleId){
		return false;
	}
	if (message.ruleId === 'no-unused-vars'){
		// skip qml internal event handler functions like on* false unused-var
		if (/.*'on\w*' is defined but never used.*/i.test(message.message.trim())){
			return false;
		}
		// skip false unused-var alarm
		const exist = [
            ...Array.from(func_USED.entries()),
            ...Array.from(var_USED.entries())
        ]
			// eslint-disable-next-line no-unused-vars
			.filter(([key, value]) => value > 0) // Allow functions/keys that were used atleast 1 time
			.some(([key]) => {  // Check if any of these keys are in the message
				const regex = new RegExp(`\\b${key}\\b`);
				return regex.test(message.message);
			});
		if (exist){
			return false; // false alarm disable this warning 
		}
	}
	// eslint doesn't like some of QML js syntax
	if (UnsatisfiableRules.some(rule => message.message.includes(rule)) || UnsatisfiableRules.some(rule => message.ruleId.includes(rule))){
		return false; // false alarm disable this warning 
	}
	return true
}

function getLine(sourceText, lineNumber) {
    // Split the source text by newlines
    const lines = sourceText.split('\n');
    
    // Line numbers are 1-based, so subtract 1 to access the correct index
    const line = lines[lineNumber - 1];
    
    // Return the line or null if the line is out of range
    return line.trimStart() || null;
}

export function extractJsFromQml(sourceText) {
    // Step 1: Parse QML into an AST
	let qmlAst = null;
	try {
		qmlAst = parse(sourceText);
	} catch (error) {
		throw error;
	}

    // Step 2: Traverse the AST to find JavaScript blocks
    const jsBlocks = [];
    function traverse(node) {
        let code = null;
		let Xcode = null; // modified code to remove func name
		let location = null;
		let type = null; // block type var/function
		let offset_modified = 0;
        if (node.kind === 'Property' && (node.value?.kind === 'JavascriptBlock' || node.value?.kind === 'JavascriptValue')) {
			location = node.loc;

			code = `var ${node.identifier} = ${node.value.value}`;
			// since we removed Qml Property and type replaced with var there's offset difference
			offset_modified = (getLine(sourceText, location.start.line).length - code.length);

			// console.log('OFFFFFFSSSSSSSS\n\n\n\n\n\n\n\n', offset_modified, getLine(sourceText, location.start.line).length, code.length, getLine(sourceText, location.start.line))
			type = 'var';			
			// save var name for unused vars 
			var_USED.set(node.identifier, 0)
			// check if this var was ever used in previous saved code blocks
			const regex = new RegExp(`\\b${node.identifier}\\b`);
			const used = jsBlocks.some(c => regex.test(c.code));
			if (used){
				// console.log("PREV CALL WAS DETECTED", used, node.identifier)
				var_USED.set(node.identifier, 1)
			}
        }
		if (node.kind === 'Attribute' && (node.value.kind === 'JavascriptBlock' || node.value.kind === 'JavascriptValue')){
            code = node.value.value;
			location = node.value.loc;
			type = 'var';
		}
        if (node.kind === 'Function') {
            code = node.body;
			location = node.loc;
			type = 'func';
			// save func name for unused vars detection
			func_USED.set(node.identifier, 0)
			// check if this func was ever called in previous saved code blocks
			const called = jsBlocks.some(c => c.code.includes(node.identifier));
			if (called){
				// console.log("PREV CALL WAS DETECTED", called, node.identifier)
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
					// console.log("FUNCCCC/VAR WAS CALLEDDDDx", word, func_USED.get(word));
				});
			}
			if (reusedVAR){
				reusedVAR.forEach(word => {
					// increment how much times it was called in the code
					if (!(code.includes(`var ${word} =`))){
						var_USED.set(word, var_USED.get(word) + 1)
						// console.log("FUNCCCC/VAR WAS CALLEDDDDx", word, var_USED.get(word));
					}
				});
			}
			jsBlocks.push({code, location, type, offset_modified});

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
	blocksCache.clear();
	func_USED.clear();
	var_USED.clear();

	// console.log("AATTTENNNTIONNNNNNNNN\n\n\n\n", sourceText)
	console.log("Preprocessing Input:", filename);
	const jsBlocks = extractJsFromQml(sourceText);

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
	// console.log("Postprocessing Output:", filename);

	return messages.flatMap((group, i) => {
		// console.log(i, group)
		if (Array.isArray(group) && group.length === 0) {
			return [];
		}

		return group.map((err) => {
			
			const block = blocks[i];
			if (block.type == 'var' && err.ruleId === 'semi'){
				err.ruleId = 'semi-var'
			}
			const adjustedError = {
				...err,
				line: (err.line || 0) + (blocks[i]?.location.start.line - 1 || 0),
			};
			if (err.fix && block) {
				// console.log(adjustedError, err.fix.range || 0);
				// console.log(blocks[i]?.code + ';ll', blocks[i]?.code[err.fix.range[0]]);
				adjustedError.fix.range = [
					err.fix.range[0] + block.location.start.offset + block.offset_modified,
					err.fix.range[1] + block.location.start.offset + block.offset_modified,
					
				]
				// console.log(adjustedError.line, adjustedError.fix.range, err.column, block.location.start.offset);
				// console.log(blocks[i]?.code);

			}
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
	supportsAutofix: true,
};
