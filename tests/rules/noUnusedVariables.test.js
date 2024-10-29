import { QMLLinter } from '../../src/index.js';
import path from 'path';

describe('noUnusedVariables rule', () => {
    let linter;

    beforeEach(() => {
        linter = new QMLLinter({
            rules: {
                noUnusedVariables: { enabled: true }
            }
        });
    });

    test('should detect unused properties', () => {
        const filePath = path.join(__dirname, '../fixtures/rules/invalid/unusedVar.qml');
        console.log("PATHHH\n\n\n\n\nPATH");
        console.log(filePath);
        console.log("PATHHH\n\n\n\n\nPATH");
        const issues = linter.lintFiles(filePath);

        console.log("linttttTTTT1\n\n\n\n\nPATH");
        console.log(issues);
        console.log("linttttTTTT2\n\n\n\n\nPATH");

        expect(issues).toHaveLength(1);
        expect(issues[0].message).toContain('unusedProperty');
    });

    test('should pass valid files', () => {
        const filePath = path.join(__dirname, '../fixtures/rules/valid/basic.qml');
        const issues = linter.lintFiles(filePath);
        
        expect(issues).toHaveLength(0);
    });
});
