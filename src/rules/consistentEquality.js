import { traverseAST, parseJavaScriptBlock } from '../utils/astUtils.js';

const meta = {
    type: 'suggestion',
    docs: {
        description: 'Enforce consistent use of equality operators'
    }
};
function create(context) {
    return {
        validate: (ast) => {
            const checkEquality = (node) => {
                if (node.type === 'BinaryExpression') {
                    if (context.config === 'strict') {
                        if (node.operator === '==' || node.operator === '!=') {
                            context.report({
                                message: `Use ${node.operator === '==' ? '===' : '!=='} instead of ${node.operator}`,
                                node
                            });
                        }
                    } else {
                        if (node.operator === '===' || node.operator === '!==') {
                            context.report({
                                message: `Use ${node.operator === '===' ? '==' : '!='} instead of ${node.operator}`,
                                node
                            });
                        }
                    }
                }
            };

            // Check QML bindings
            traverseAST(ast, node => {
                if (node.type === 'Binding' && node.value?.type === 'JavaScriptCodeBlock') {
                    const jsAst = parseJavaScriptBlock(node.value.code);
                    if (jsAst) {
                        traverseAST(jsAst, checkEquality);
                    }
                }

                // Check JavaScript functions
                if (node.type === 'Function' && node.body?.type === 'JavaScriptCodeBlock') {
                    const jsAst = parseJavaScriptBlock(node.body.code);
                    if (jsAst) {
                        traverseAST(jsAst, checkEquality);
                    }
                }

                // Check any binary expressions in property bindings
                checkEquality(node);
            });
        }
    };
}

export default { meta, create };