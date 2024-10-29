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
            const declaredVars = new Map(); // Map to store variable and its node
            const usedVars = new Set();

            // Find all property declarations
            traverseAST(ast, node => {
                if (node.type === 'Property') {
                    declaredVars.set(node.name, node);
                }
            });

            // Check for variable usage
            traverseAST(ast, node => {
                if (node.type === 'MemberExpression') {
                    const name = node.property?.name;
                    if (name && declaredVars.has(name)) {
                        usedVars.add(name);
                    }
                }
            });

            // Report unused variables
            declaredVars.forEach((node, varName) => {
                if (!usedVars.has(varName)) {
                    context.report({
                        message: `Unused variable: ${varName}`,
                        node
                    });
                }
            });
        }
    };
}

export default { meta, create };