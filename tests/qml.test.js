import assert from 'assert';
import { extractJsFromQml } from '../lib/processor.js';

describe('QML JavaScript Extraction', () => {
  describe('extractJsFromQml', () => {
    it('should extract function declarations', () => {
      const qmlContent = `
import QtQuick 2.15

Item {
    function calculateSum(a, b) {
        return a + b;
    }
}`;
      
      const extractedJs = extractJsFromQml(qmlContent);
      
      assert.ok(extractedJs.js.length > 0, 'Should extract JavaScript blocks');
      assert.ok(extractedJs.js[0].code.includes('return a + b'), 'Should extract function body');
    });

    it('should extract property JavaScript values', () => {
      const qmlContent = `
import QtQuick 2.15

Item {
    property var myCalculation: function() {
        return 42;
    }
}`;
      
      const extractedJs = extractJsFromQml(qmlContent);
      
      assert.ok(extractedJs.js.length > 0, 'Should extract JavaScript blocks');
      assert.ok(extractedJs.js[0].code.includes('var myCalculation'), 'Should transform property to var declaration');
    });
  });
});