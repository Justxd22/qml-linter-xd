import { traverseAST, findNodes } from '../utils/astUtils.js';

const meta = {
    type: 'problem',
    docs: {
        description: 'Detect unused variables in QML files'
    }
};
function create(context) {
    return {
        validate: (ast) => {
            const declaredVars = new Set();
            const usedVars = new Set();

            // Find all property declarations
            traverseAST(ast, node => {
                if (node.type === 'Property') {
                    declaredVars.add(node.name);
                }
            });

            // Check for variable usage
            traverseAST(ast, node => {
                if (node.type === 'MemberExpression') {
                    const name = node.property?.name;
                    if (name) {
                        usedVars.add(name);
                    }
                }
            });

            // Report unused variables
            declaredVars.forEach(varName => {
                if (!usedVars.has(varName)) {
                    context.report({
                        message: `Unused variable: ${varName}`,
                        node: { name: varName }
                    });
                }
            });
        }
    };
}

export default { meta, create };