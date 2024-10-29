import { traverseAST, parseJavaScriptBlock } from '../utils/astUtils.js';

const meta = {
    type: 'layout',
    docs: {
        description: 'Enforce consistent use of semicolons'
    }
};
function create(context) {
    return {
        validate: (ast) => {
            traverseAST(ast, node => {
                if (node.type === 'statement') {
                    const hasSemicolon = node.semicolon;
                    if (context.config === 'always' && !hasSemicolon) {
                        context.report({
                            message: 'Missing semicolon',
                            node
                        });
                    } else if (context.config === 'never' && hasSemicolon) {
                        context.report({
                            message: 'Unnecessary semicolon',
                            node
                        });
                    }
                }

                // Check JavaScript blocks
                if (node.type === 'javascript_block') {
                    const jsAst = parseJavaScriptBlock(node.code);
                    if (jsAst) {
                        traverseAST(jsAst, (jsNode) => {
                            if (jsNode.type === 'ExpressionStatement') {
                                // Check semicolon presence in JavaScript statements
                                const hasSemicolon = jsNode.semicolon;
                                if (context.config === 'always' && !hasSemicolon) {
                                    context.report({
                                        message: 'Missing semicolon in JavaScript block',
                                        node: jsNode
                                    });
                                }
                            }
                        });
                    }
                }
            });
        }
    };
}

export default { meta, create };