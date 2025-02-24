/* eslint-disable no-unused-vars */
import assert from 'assert';
import { processor, extractJsFromQml } from '../lib/processor.js';

describe('QML-Specific Edge Cases', () => {
  describe('Complex QML Structures', () => {
    it('should handle nested JavaScript in signal handlers', () => {
      const qmlContent = `
import QtQuick 2.15

Item {
    signal customSignal(int value)

    onCustomSignal: {
        function nestedFunction() {
            return value * 2;
        }
        
        let result = nestedFunction();
        console.log(result);
    }
}`;
      
      const extractedJs = extractJsFromQml(qmlContent);
      
      assert.ok(extractedJs.js.length > 0, 'Should extract JavaScript blocks');
      assert.ok(extractedJs.js.some(block => block.code.includes('nestedFunction')), 
        'Should extract nested function in signal handler');
    });

    it('should handle complex property bindings', () => {
      const qmlContent = `
import QtQuick 2.15

Item {
    property var complexCalculation: {
        function calculate() {
            let a = 5;
            let b = 10;
            return a * b;
        }
        return calculate();
    }

    Component.onCompleted: {
        console.log(complexCalculation);
    }
}`;
      
      const extractedJs = extractJsFromQml(qmlContent);
      assert.ok(extractedJs.js.length > 0, 'Should extract JavaScript blocks');
      assert.ok(extractedJs.js.some(block => block.code.includes('calculate()')), 
        'Should extract complex property binding with function');
    });

    it('should handle QML property methods', () => {
      const qmlContent = `
import QtQuick 2.15

Item {
    property var dynamicMethod: function(x) {
        return x * 2;
    }

    function useMethod() {
        let result = dynamicMethod(5);
        return result;
    }
}`;
      
      const extractedJs = extractJsFromQml(qmlContent);
      
      assert.ok(extractedJs.js.length > 0, 'Should extract JavaScript blocks');
      assert.ok(extractedJs.js.some(block => block.code.includes('dynamicMethod')), 
        'Should extract dynamic property method');
    });
  });

});