import { parse } from '@oltodo/qml-parser';

const blocksCache = new Map();

/**
 * Extracts `eslint-*` or `global` comments from HTML comments if present.
 * @param {string} html The text content of an HTML AST node.
 * @returns {string} The comment's text without the opening and closing tags or
 *     an empty string if the text is not an ESLint HTML comment.
 */
function getComment(html) {
	const commentStart = "<!--";
	const commentEnd = "-->";
	const regex = /^(eslint\b|global\s)/u;

	if (
		html.slice(0, commentStart.length) !== commentStart ||
		html.slice(-commentEnd.length) !== commentEnd
	) {
		return "";
	}

	const comment = html.slice(commentStart.length, -commentEnd.length);

	if (!regex.test(comment.trim())) {
		return "";
	}

	return comment;
}

// Before a code block, blockquote characters (`>`) are also considered
// "whitespace".
const leadingWhitespaceRegex = /^[>\s]*/u;

/**
 * Gets the offset for the first column of the node's first line in the
 * original source text.
 * @param {Node} node A Markdown code block AST node.
 * @returns {number} The offset for the first column of the node's first line.
 */
function getBeginningOfLineOffset(node) {
	return node.position.start.offset - node.position.start.column + 1;
}

/**
 * Gets the leading text, typically whitespace with possible blockquote chars,
 * used to indent a code block.
 * @param {string} text The text of the file.
 * @param {Node} node A Markdown code block AST node.
 * @returns {string} The text from the start of the first line to the opening
 *     fence of the code block.
 */
function getIndentText(text, node) {
	return leadingWhitespaceRegex.exec(
		text.slice(getBeginningOfLineOffset(node)),
	)[0];
}

/**
 * When applying fixes, the postprocess step needs to know how to map fix ranges
 * from their location in the linted JS to the original offset in the Markdown.
 * Configuration comments and indentation trimming both complicate this process.
 *
 * Configuration comments appear in the linted JS but not in the Markdown code
 * block. Fixes to configuration comments would cause undefined behavior and
 * should be ignored during postprocessing. Fixes to actual code after
 * configuration comments need to be mapped back to the code block after
 * removing any offset due to configuration comments.
 *
 * Fenced code blocks can be indented by up to three spaces at the opening
 * fence. Inside of a list, for example, this indent can be in addition to the
 * indent already required for list item children. Leading whitespace inside
 * indented code blocks is trimmed up to the level of the opening fence and does
 * not appear in the linted code. Further, lines can have less leading
 * whitespace than the opening fence, so not all lines are guaranteed to have
 * the same column offset as the opening fence.
 *
 * The source code of a non-configuration-comment line in the linted JS is a
 * suffix of the corresponding line in the Markdown code block. There are no
 * differences within the line, so the mapping need only provide the offset
 * delta at the beginning of each line.
 * @param {string} text The text of the file.
 * @param {Node} node A Markdown code block AST node.
 * @param {string[]} comments List of configuration comment strings that will be
 *     inserted at the beginning of the code block.
 * @returns {RangeMap[]} A list of offset-based adjustments, where lookups are
 *     done based on the `js` key, which represents the range in the linted JS,
 *     and the `md` key is the offset delta that, when added to the JS range,
 *     returns the corresponding location in the original Markdown source.
 */
function getBlockRangeMap(text, node, comments) {
	/*
	 * The parser sets the fenced code block's start offset to wherever content
	 * should normally begin (typically the first column of the line, but more
	 * inside a list item, for example). The code block's opening fence may be
	 * further indented by up to three characters. If the code block has
	 * additional indenting, the opening fence's first backtick may be up to
	 * three whitespace characters after the start offset.
	 */
	const startOffset = getBeginningOfLineOffset(node);

	/*
	 * Extract the Markdown source to determine the leading whitespace for each
	 * line.
	 */
	const code = text.slice(startOffset, node.position.end.offset);
	const lines = code.split("\n");

	/*
	 * The parser trims leading whitespace from each line of code within the
	 * fenced code block up to the opening fence's first backtick. The first
	 * backtick's column is the AST node's starting column plus any additional
	 * indentation.
	 */
	const baseIndent = getIndentText(text, node).length;

	/*
	 * Track the length of any inserted configuration comments at the beginning
	 * of the linted JS and start the JS offset lookup keys at this index.
	 */
	const commentLength = comments.reduce(
		(len, comment) => len + comment.length + 1,
		0,
	);

	/*
	 * In case there are configuration comments, initialize the map so that the
	 * first lookup index is always 0. If there are no configuration comments,
	 * the lookup index will also be 0, and the lookup should always go to the
	 * last range that matches, skipping this initialization entry.
	 */
	const rangeMap = [
		{
			indent: baseIndent,
			js: 0,
			md: 0,
		},
	];

	// Start the JS offset after any configuration comments.
	let jsOffset = commentLength;

	/*
	 * Start the Markdown offset at the beginning of the block's first line of
	 * actual code. The first line of the block is always the opening fence, so
	 * the code begins on the second line.
	 */
	let mdOffset = startOffset + lines[0].length + 1;

	/*
	 * For each line, determine how much leading whitespace was trimmed due to
	 * indentation. Increase the JS lookup offset by the length of the line
	 * post-trimming and the Markdown offset by the total line length.
	 */
	for (let i = 0; i + 1 < lines.length; i++) {
		const line = lines[i + 1];
		const leadingWhitespaceLength =
			leadingWhitespaceRegex.exec(line)[0].length;

		// The parser trims leading whitespace up to the level of the opening
		// fence, so keep any additional indentation beyond that.
		const trimLength = Math.min(baseIndent, leadingWhitespaceLength);

		rangeMap.push({
			indent: trimLength,
			js: jsOffset,

			// Advance `trimLength` character from the beginning of the Markdown
			// line to the beginning of the equivalent JS line, then compute the
			// delta.
			md: mdOffset + trimLength - jsOffset,
		});

		// Accumulate the current line in the offsets, and don't forget the
		// newline.
		mdOffset += line.length + 1;
		jsOffset += line.length - trimLength + 1;
	}

	return rangeMap;
}

/**
 * Creates a map function that adjusts messages in a code block.
 * @param {Block} block A code block.
 * @returns {(message: Message) => Message} A function that adjusts messages in a code block.
 */
function adjustBlock(block) {
	const leadingCommentLines = block.comments.reduce(
		(count, comment) => count + comment.split("\n").length,
		0,
	);

	const blockStart = block.position.start.line;

	/**
	 * Adjusts ESLint messages to point to the correct location in the Markdown.
	 * @param {Message} message A message from ESLint.
	 * @returns {Message} The same message, but adjusted to the correct location.
	 */
	return function adjustMessage(message) {
		if (!Number.isInteger(message.line)) {
			return {
				...message,
				line: blockStart,
				column: block.position.start.column,
			};
		}

		const lineInCode = message.line - leadingCommentLines;

		if (lineInCode < 1 || lineInCode >= block.rangeMap.length) {
			return null;
		}

		const out = {
			line: lineInCode + blockStart,
			column: message.column + block.rangeMap[lineInCode].indent,
		};

		if (Number.isInteger(message.endLine)) {
			out.endLine = message.endLine - leadingCommentLines + blockStart;
		}

		const adjustedFix = {};

		if (message.fix) {
			adjustedFix.fix = {
				range: /** @type {Range} */ (
					message.fix.range.map(range => {
						// Advance through the block's range map to find the last
						// matching range by finding the first range too far and
						// then going back one.
						let i = 1;

						while (
							i < block.rangeMap.length &&
							block.rangeMap[i].js <= range
						) {
							i++;
						}

						// Apply the mapping delta for this range.
						return range + block.rangeMap[i - 1].md;
					})
				),
				text: message.fix.text.replace(
					/\n/gu,
					`\n${block.baseIndentText}`,
				),
			};
		}

		return { ...message, ...out, ...adjustedFix };
	};
}


export function extractJsFromQml(qmlContent, filename) {
	console.log(`GETTTINGGG ASSSST`)
    // Step 1: Parse QML into an AST
    const qmlAst = parse(qmlContent);

    // Step 2: Traverse the AST to find JavaScript blocks
    const jsBlocks = [];
    function traverse(node) {
        let code = null;
        let location = null;
        if( node.name){
            console.log(node.name);
        }
        if ((node.kind === 'Property' || node.kind === 'Attribute') &&
            (node.value.kind === 'JavascriptBlock' || node.value.kind === 'JavascriptValue')) {
            code = node.value.value;
            location = node.value.loc;
        }
        if (node.kind === 'Function') {
            code = node.body;
            location = node.loc;
        }    
        if (code){
            // jsBlocks.push({ code, location });
            jsBlocks.push(code);
        }
        if (node.children) {
            node.children.forEach(traverse);
        }

    }
    // use recursion to check all childern
    traverse(qmlAst);
	console.log(`[QQQQQQQQQQQQQQQQQQQQQMLLLLLLLL]\n\n\n\n${jsBlocks.length}`);
	console.log(jsBlocks, jsBlocks.length);

    
    return { js: jsBlocks};
}


function preprocess(sourceText, filename) {
	console.log("YOOYOOYOYPreprocessing Input:", filename, sourceText);
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


export default processor = {
	meta: {
		name: "@justxd22/qml/qml",
		version: "1.0.0",
	},
	preprocess: preprocess,
	postprocess: postprocess,
};
