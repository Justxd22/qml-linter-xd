import { parse } from '@justxd22/qml-parser';

// Project-wide state
class ProjectState {
	constructor() {
		this.imports = new Map(); // file -> imported symbols
		this.exports = new Map(); // file -> exported symbols
		this.functionUsage = new Map(); // functionName -> {defined: filename, usedIn: Set<filename>}
		this.variableUsage = new Map(); // variableName -> {defined: filename, usedIn: Set<filename>}
		this.processedFiles = new Set();
		this.pendingMessages = new Map(); // filename -> messages
		this.filesInProgress = new Set();
	}

	clear() {
		this.imports.clear();
		this.exports.clear();
		this.functionUsage.clear();
		this.variableUsage.clear();
		this.processedFiles.clear();
		this.pendingMessages.clear();
		this.filesInProgress.clear();
	}

	markFunctionUsed(name, definedIn, usedIn, lineNumber) {
		if (!this.functionUsage.has(name)) {
			this.functionUsage.set(name, { defined: definedIn, usedIn: {} });
		}

		if (usedIn) {
			const usage = this.functionUsage.get(name).usedIn;

			if (!usage[usedIn]) {
				usage[usedIn] = [];
			}

			// Avoid duplicate line numbers
			if (!usage[usedIn].includes(lineNumber)) {
				console.log(`line not found adding ${lineNumber}`);
				usage[usedIn].push(lineNumber);
			}
		}
	}

	markFunctionUsed(name, definedIn, usedIn, lineNumber) {
		if (!this.functionUsage.has(name)) {
			this.functionUsage.set(name, { defined: definedIn, usedIn: {} });
		}

		if (usedIn) {
			if (!this.functionUsage.get(name).usedIn[usedIn]) {
				this.functionUsage.get(name).usedIn[usedIn] = [];
			}
			this.functionUsage.get(name).usedIn[usedIn].push(lineNumber);
		}
	}
	markVariableUsed(name, definedIn, usedIn, isProperty) {
		if (!this.variableUsage.has(name)) {
			this.variableUsage.set(name, { defined: definedIn, usedIn: new Set(), property: isProperty });
		}
		if (usedIn) {
			this.variableUsage.get(name).usedIn.add(usedIn);
		}
	}

	isSymbolUsed(name) {
		const funcUsage = this.functionUsage.get(name);
		const varUsage = this.variableUsage.get(name);
		// console.log(funcUsage, varUsage, name,);

		// Check if it's used in any file other than where it's defined
		return (funcUsage && Object.values(funcUsage.usedIn).some(lines => lines.length > 2)) ||
               (varUsage && (varUsage.usedIn.size > 1 || varUsage.property) ) ||
			// Handle QML-specific cases like 'on*' handlers
			name.startsWith('on');
	}

	getLines(name, usedIn) {
		// console.log(`gettinngggg line for: ${name}, ${usedIn}`);
		try {
			return (this.functionUsage.get(name).usedIn[usedIn]) || [];
		} catch (error) {
			return [];
		}

	}

	getAllFunctionNames() {
		return [...this.functionUsage.keys()];
	}

	addPendingMessages(filename, messages) {
		this.pendingMessages.set(filename, messages);
	}

	startFile(filename) {
		this.filesInProgress.add(filename);
	}

	finishFile(filename) {
		this.filesInProgress.delete(filename);
		this.processedFiles.add(filename);
	}

	isProcessingComplete() {
		return this.filesInProgress.size === 0;
	}

	filterMessages(filename) {
		const messages = this.pendingMessages.get(filename) || [];
		const UnsatisfiableRules = ["Unterminated string constant", "'return' outside of function", "semi-var"];
		const filtered = messages.filter(message => {
			if (Object.prototype.toString.call(message) !== "[object Object]" || Object.keys(message).length === 0) return false;
			// console.log(`meeeeeeeeeeesssss ${message}`)
			if (!message.ruleId) {
				return false;
			}
			if (message.ruleId === 'no-unused-vars') {
				// Get the variable name from the message
				const match = message.message.match(/'([^']+)' .* but never used/);

				if (match) {
					const varName = match[1];
					// Check if it's used anywhere in the project
					if (this.isSymbolUsed(varName)) {
						return false;
					}
				}
			}
			// eslint doesn't like some of QML js syntax
			if (UnsatisfiableRules.some(rule => message.message.includes(rule)) || UnsatisfiableRules.some(rule => message.ruleId.includes(rule))) {
				return false; // false alarm disable this warning
			}
			return true;
		});
		// console.log(filtered)

		return filtered;
	}
}

const projectState = new ProjectState();
const blocksCache = new Map();

function getLine(sourceText, lineNumber) {
	// Split the source text by newlines
	const lines = sourceText.split('\n');

	// Line numbers are 1-based, so subtract 1 to access the correct index
	const line = lines[lineNumber - 1];

	// Return the line or null if the line is out of range
	return line.trimStart() || null;
}

export function extractJsFromQml(sourceText, filename) {
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
		if (node.kind === 'Property' && (node.value?.kind === 'JavascriptBlock' || node.value?.kind === 'JavascriptValue')) {
			const location = node.loc;
			const code = `var ${node.identifier} = ${node.value.value}`;
			// since we removed Qml Property and type replaced with var there's offset difference

			const offset_modified = (getLine(sourceText, location.start.line).length - code.length);
			const type = 'var';
			// console.log(`igoooooogogid\n`,projectState.isSymbolUsed(node.identifier, filename));
			// save var name for unused vars 
			// as asked to disable unused-var for property qml vars
			projectState.markVariableUsed(node.identifier, null, filename, true);
			jsBlocks.push({ code, location, type, offset_modified });
		}
		if (node.kind === 'Attribute' && (node.value.kind === 'JavascriptBlock' || node.value.kind === 'JavascriptValue')) {
			const code = node.value.value;
			const location = node.value.loc;
			const type = 'var';
			jsBlocks.push({ code, location, type,  offset_modified: 0});
		}
		if (node.kind === 'Function') {
			const code = node.body;
			const location = node.loc;
			const type = 'func';
			projectState.markFunctionUsed(node.identifier, filename);

			jsBlocks.push({ code, location, type, offset_modified: 0 });
			const instances = jsBlocks
				.filter(c => c.code.includes(node.identifier)) // Find matching blocks
				.map(c => c.location.start.line); // Extract line numbers
			const lines = projectState.getLines(node.identifier, filename);
			// console.log(`PROCESSINGGG FUNC: ${node.identifier} ${lines}`);

			if (instances) {
				instances.forEach(line =>{
					if (!lines.includes(line)) {
						// console.log('found on line: ', line, lines.includes(line));
						projectState.markFunctionUsed(node.identifier, null, filename, line);
					}
				});
			}
		}
		// rescan code base for unused-var further detection
		const funs = projectState.getAllFunctionNames();
		// console.log(funs);
		if (funs) {
			funs.forEach(ID => {
				const functionUsageRegex = new RegExp(`\\b${ID}\\s*\\(`, 'g'); // Regex to detect function calls
				// Find all instances where the function is called
				const instances = jsBlocks
					.filter(c => functionUsageRegex.test(c.code)) // Match function calls using regex
					.map(c => c.location.start.line); // Extract line numbers
				const lines = projectState.getLines(ID, filename);
				if (instances) {
					instances.forEach(line => {
						if (lines && !lines.includes(line)) {
							projectState.markFunctionUsed(ID, null, filename, line);
						}
					});
				}
			});
		}
		if (node.children) {
			node.children.forEach(traverse);
		}

	}
	// use recursion to check all childern
	traverse(qmlAst);
	return { js: jsBlocks };
}


function preprocess(sourceText, filename) {
	// console.log("AATTTENNNTIONNNNNNNNN\n\n\n\n", sourceText)
	console.log("Preprocessing Input:", filename);
	projectState.startFile(filename);
	if (!projectState.processedFiles.has(filename)) {
		const jsBlocks = extractJsFromQml(sourceText, filename);
		blocksCache.set(filename, jsBlocks.js);
		// projectState.processedFiles.add(filename);

		return jsBlocks.js.map((js, index) => ({
			text: js.code,
			filename: `${filename}-${index}.js`
		}));
	}
	return [];
}

function postprocess(messages, filename) {
	const blocks = blocksCache.get(filename);
	//blocksCache.delete(filename);
	// console.log("Postprocessing Output:", filename);

	const adjustedMessages = messages.flatMap((group, i) => {
		// console.log(i, group)
		if (!Array.isArray(group) || group.length === 0) return [];

		return group.map((err) => {

			const block = blocks[i];
			if (block.type === 'var' && err.ruleId === 'semi') {
				err.ruleId = 'semi-var';
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

				];
				// console.log(adjustedError.line, adjustedError.fix.range, err.column, block.location.start.offset);
				// console.log(blocks[i]?.code);

			}
			return adjustedError;
		});
	});

	// Store the adjusted messages for later filtering
	projectState.addPendingMessages(filename, adjustedMessages);
	projectState.finishFile(filename);
	// console.log(adjustedMessages, projectState.isProcessingComplete());

	// If this is the last file being processed
	if (projectState.isProcessingComplete()) {
		// Get all the stored messages for this file and filter them
		const finalMessages = projectState.filterMessages(filename);
		console.log("Pushing Final message for ", filename);

		// Clear the state for the next run
		projectState.clear();
		blocksCache.clear();
		// console.log(finalMessages);
		return finalMessages;
	}

	// Return the current file's messages if they exist
	return projectState.filterMessages(filename) || [];
}

export const processor = {
	meta: {
		name: "@justxd22/qml/qml",
		version: "1.0.3",
	},
	preprocess,
	postprocess,
	supportsAutofix: true,
};
