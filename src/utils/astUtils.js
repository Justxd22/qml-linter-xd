import esprima from 'esprima';

function parseJavaScriptBlock(code) {
  try {
    return esprima.parseScript(code);
  } catch (error) {
    return null;
  }
}

function traverseAST(node, callback) {
  if (!node) return;
  
  callback(node);
  
  // Check and traverse specific child properties based on the node type
  if (node.body && Array.isArray(node.body)) {
    node.body.forEach(child => traverseAST(child, callback));
  } else if (node.members && Array.isArray(node.members)) {
    node.members.forEach(child => traverseAST(child, callback));
  } else if (node.properties && Array.isArray(node.properties)) {
    node.properties.forEach(child => traverseAST(child, callback));
  } else if (node.object) {
    traverseAST(node.object, callback);
  }
}

function findNodes(ast, predicate) {
  const nodes = [];
  traverseAST(ast, (node) => {
    if (predicate(node)) {
      nodes.push(node);
    }
  });
  return nodes;
}

export { parseJavaScriptBlock, traverseAST, findNodes };
