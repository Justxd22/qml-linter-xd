import { parse } from '@oltodo/qml-parser';

const blocksCache = new Map();


function extractJsFromQml(qmlContent) {
	console.log(`GETTTINGGG ASSSST`)
    // Step 1: Parse QML into an AST
    const qmlAst = parse(qmlContent);

    // Step 2: Traverse the AST to find JavaScript blocks
    const jsBlocks = [];
    function traverse(node) {
        let code = null;
        if( node.name){
            console.log(node.name);
        }
        if ((node.kind === 'Property' || node.kind === 'Attribute') &&
            (node.value.kind === 'JavascriptBlock' || node.value.kind === 'JavascriptValue')) {
            code = node.value.value;
        }
        if (node.kind === 'Function') {
            code = node.body;
        }    
        if (code){
            jsBlocks.push(code);
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
	console.log("YOOYOOYOYPreprocessing Input:", filename);
	const jsBlocks = extractJsFromQml(sourceText, filename);
	if (!jsBlocks.js){
		return;
	}
	console.log(typeof(jsBlocks.js), jsBlocks.js.length, jsBlocks.js);
	blocksCache.set(filename, jsBlocks.js);

	// Return JavaScript blocks as individual files for ESLint
	// TO:Do mark used vars/func using  /* eslint-disable no-unused-vars */ 
	return jsBlocks.js.map((js, index) => ({
		text: js,
		filename: `${index}.js`,
	}));
}

function postprocess(messages, filename) {
	const blocks = blocksCache.get(filename);

	blocksCache.delete(filename);
	console.log("Postprocessing Output:", messages, filename);

	return messages.flatMap((group, i) => {
		console.log(i, group)
		if (Array.isArray(group) && group.length === 0) {
			return [];
		}
		// const adjust = adjustBlock(blocks[i]);

		// return group.map(adjust);
		return group;
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