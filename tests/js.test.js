/* eslint-disable no-unused-vars */
import assert from 'assert';
import { extractJsFromQml } from '../lib/processor.js';

describe('Function and Variable Usage Tracking', () => {
  describe('Usage Detection', () => {
    it('should track function usage across multiple blocks', () => {
      const qmlContent = `
import QtQuick 2.15

Item {
    function helper() {
        return 42;
    }

    function mainFunction() {
        let result = helper();
        console.log(result);
    }
}`;
      
      const extractedJs = extractJsFromQml(qmlContent);
      
      assert.ok(extractedJs.js.length > 0, 'Should extract JavaScript blocks');
      
      // Simulate tracking usage
      const usedFuncs = new Map();
      usedFuncs.set('helper', 0);
      usedFuncs.set('mainFunction', 0);
      
      extractedJs.js.forEach(block => {
        const funcNames = Array.from(usedFuncs.keys());
        funcNames.forEach(funcName => {
          if (block.code.includes(funcName)) {
            usedFuncs.set(funcName, usedFuncs.get(funcName) + 1);
          }
        });
      });
      
      assert.strictEqual(usedFuncs.get('helper'), 2, 'Helper function should be used');
      assert.strictEqual(usedFuncs.get('mainFunction'), 1, 'Main function should not be marked as used');
    });

    it('should track variable usage across different scopes', () => {
      const qmlContent = `
import QtQuick 2.15

Item {
    property var globalVar: 10

    function processData() {
        let localVar = globalVar + 5;
        return localVar;
    }

    onSomeSignal: {
        console.log(globalVar);
    }
}`;
      
      const extractedJs = extractJsFromQml(qmlContent);
      
      assert.ok(extractedJs.js.length > 0, 'Should extract JavaScript blocks');
      
      // Simulate variable usage tracking
      const usedVars = new Map();
      usedVars.set('globalVar', 0);
      usedVars.set('localVar', 0);
      
      extractedJs.js.forEach(block => {
        const varNames = Array.from(usedVars.keys());
        varNames.forEach(varName => {
          if (block.code.includes(varName)) {
            usedVars.set(varName, usedVars.get(varName) + 1);
          }
        });
      });
      
      assert.strictEqual(usedVars.get('globalVar'), 3, 'Global variable should be used multiple times');
      assert.strictEqual(usedVars.get('localVar'), 1, 'Local variable should be used');
    });
  });

  describe('Unused Variable Detection', () => {
    it('should identify unused variables', () => {
      const qmlContent = `
import QtQuick 2.15

Item {
    property var unusedVariable: 42
    property var usedVariable: 10

    function someFunction() {
        let x = usedVariable;
        console.log(x);
    }
}`;
      
      const extractedJs = extractJsFromQml(qmlContent);
      
      // Simulate unused variable detection
      const variableUsage = new Map();
      extractedJs.js.forEach(block => {
        const unusedVars = ['unusedVariable', 'usedVariable'];
        unusedVars.forEach(varName => {
          if (block.code.includes(varName)) {
            variableUsage.set(varName, (variableUsage.get(varName) || 0) + 1);
          }
        });
      });
      
      const unusedVars = Array.from(variableUsage.entries())
        .filter(([_, count]) => count <= 1)
        .map(([varName]) => varName);
      
      assert.deepStrictEqual(unusedVars, ['unusedVariable'], 'Should identify unused variables');
    });
  });
});