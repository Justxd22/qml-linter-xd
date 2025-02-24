import assert from 'assert';
import { excludeUnsatisfiableRules } from '../lib/processor.js';

describe('Rule Exclusions', () => {
  describe('excludeUnsatisfiableRules', () => {
    it('should filter out on* event handler false positives', () => {
      const message = {
        ruleId: 'no-unused-vars',
        message: "'onButtonClicked' is defined but never used."
      };
      
      const result = excludeUnsatisfiableRules(message);
      assert.strictEqual(result, false, 'Should exclude on* event handler');
    });

    it('should filter out problematic QML syntax warnings', () => {
      const messages = [
        {
          ruleId: 'syntax',
          message: 'Unterminated string constant'
        },
        {
          ruleId: 'return',
          message: "'return' outside of function"
        }
      ];
      
      messages.forEach(message => {
        const result = excludeUnsatisfiableRules(message);
        assert.strictEqual(result, false, `Should exclude message: ${message.message}`);
      });
    });
  });
});