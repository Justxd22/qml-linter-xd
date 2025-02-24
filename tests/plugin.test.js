import assert from 'assert';
import { processor } from '../lib/processor.js';

describe('QML Processor', () => {
  describe('preprocess', () => {
    it('should extract JavaScript blocks from QML file', () => {
      const qmlContent = `
import QtQuick 2.15

Item {
    property var myVar: 42
    
    function testFunction() {
        console.log("Hello, world!");
    }
    
    onSomeSignal: {
        let x = 10;
    }
}`;
      
      const preprocessed = processor.preprocess(qmlContent, 'test.qml');
      
      assert.ok(preprocessed, 'Preprocessed result should not be null');
      assert.ok(Array.isArray(preprocessed), 'Preprocessed result should be an array');
      assert(preprocessed.length > 0, 'Should extract at least one JavaScript block');
    });

    it('should handle QML files with no JavaScript', () => {
      const qmlContent = `
import QtQuick 2.15

Item {
    id: root
}`;
      
      const preprocessed = processor.preprocess(qmlContent, 'test.qml');
      assert.deepEqual(preprocessed, [], 'Should return undefined for QML without JavaScript');
    });
  });

  
});