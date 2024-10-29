import { traverseAST } from '../utils/astUtils.js';

const meta = {
    type: 'layout',
    docs: {
        description: 'Enforce consistent property ordering'
    }
};
function create(context) {
    return {
        validate: (ast) => {
            traverseAST(ast, node => {
                if (node.type === 'object') {
                    const properties = node.properties;
                    let lastIndex = -1;

                    properties.forEach(prop => {
                        const typeIndex = context.config.indexOf(prop.type);
                        if (typeIndex !== -1) {
                            if (typeIndex < lastIndex) {
                                context.report({
                                    message: `Property of type ${prop.type} should appear before properties of type ${context.config[lastIndex]}`,
                                    node: prop
                                });
                            }
                            lastIndex = typeIndex;
                        }
                    });
                }
            });
        }
    };
}

export default { meta, create };