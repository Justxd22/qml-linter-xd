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
  
  // Handle different node types based on @oltodo/qml-parser AST structure
  if (node.body && Array.isArray(node.body)) {
    node.body.forEach(child => traverseAST(child, callback));
  }
  
  if (node.members && Array.isArray(node.members)) {
    node.members.forEach(child => traverseAST(child, callback));
  }

  if (node.object) {
    traverseAST(node.object, callback);
  }

  if (node.properties && Array.isArray(node.properties)) {
    node.properties.forEach(child => traverseAST(child, callback));
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
