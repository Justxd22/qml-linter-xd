import assert from 'assert';
import fs from 'fs';
import path from 'path';
import * as eslint from 'eslint';
import plugin from '../lib/index.js';

describe('ESLint QML Plugin Integration', () => {
  const fixturesDir = path.resolve(process.cwd(), 'tests', 'fixtures', 'rules');
  
  // Helper function to run ESLint with our plugin
  async function runEslintOnFile(filePath) {
    const { FlatESLint } = eslint;
    
    const eslintInstance = new FlatESLint({
      overrideConfigFile: false,
      overrideConfig: [
        {
          files: ['**/*.js'],
          languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module'
          },
          rules: {
            'no-unused-vars': 'error',
            'eqeqeq': 'error',
            'no-console': 'warn'
          }
        },
        {
          files: ['**/*.qml'],
          plugins: {
            'qml-linter-xd': plugin
          },
          processor: 'qml-linter-xd/qml'
        }
      ]
    });

    return await eslintInstance.lintFiles([filePath]);
  }

  async function runEslintOnFile(filePath) {
    const linter = new eslint.Linter();
    
    const config = [
        {
          files: ["**/*.js"],
          languageOptions: {
            ecmaVersion: "latest", // Modern JavaScript
            sourceType: "module",
          },
          rules: {
            "no-unused-vars": "error", // Example: prevent unused variables
            "no-console": "warn", // Example: warn on console statements
            "eqeqeq": ["error", "always"], // Require === and !== instead of == and !=

          },
        },
        {
              files: ["**/*.qml"],
              processor: plugin.processors.qml,
        },
      
      ];

    // Read file contents
    const fileContents = fs.readFileSync(filePath, 'utf8');
    
    // Lint the file
    const messages = linter.verify(fileContents, config, { filename: filePath });
    console.log(messages, filePath);
    
    // Create a result object similar to ESLint's output
    return [{
      filePath,
      messages,
      errorCount: messages.filter(m => m.severity === 2).length,
      warningCount: messages.filter(m => m.severity === 1).length
    }];
  }

  // Test valid files should have no errors
  describe('Valid Files', () => {
    const validDir = path.join(fixturesDir, 'valid');
    
    fs.readdirSync(validDir)
      .filter(file => file.endsWith('.qml'))
      .forEach(file => {
        it(`should not produce errors for ${file}`, async () => {
          const filePath = path.join(validDir, file);
          const results = await runEslintOnFile(filePath);
          
          assert.strictEqual(results[0].errorCount, 0, 
            `Expected no errors in ${file}, but found: ${JSON.stringify(results[0].messages)}`);
          assert.strictEqual(results[0].warningCount, 0, 
            `Expected no warnings in ${file}, but found: ${JSON.stringify(results[0].messages)}`);
        });
      });
  });

  // Test invalid files for specific error conditions
  describe('Invalid Files', () => {
    const invalidDir = path.join(fixturesDir, 'invalid');
    
    const expectedErrorCases = {
      'unusedVar.qml': [
        { ruleId: 'no-unused-vars', message: /unused/ }
      ],
      'JavaScriptBlock.qml': [
        { ruleId: 'eqeqeq', message: / '===' / },
        { ruleId: 'no-console', message: /Unexpected console statement/ },
        { ruleId: 'eqeqeq', message: / '!==' / },
        { ruleId: 'no-console', message: /Unexpected console statement/ },
        { ruleId: 'eqeqeq', message: / '===' / },
      ],
      'wrongEquality.qml': [
        { ruleId: 'eqeqeq', message: / '===' / }
      ]
    };

    Object.entries(expectedErrorCases).forEach(([filename, expectedErrors]) => {
      it(`should produce expected errors for ${filename}`, async () => {
        const filePath = path.join(invalidDir, filename);
        const results = await runEslintOnFile(filePath);
        console.log(results);
        // Verify total number of errors
        assert.strictEqual(results[0].errorCount + results[0].warningCount, expectedErrors.length, 
          `Unexpected number of errors in ${filename}`);
        
        // Check each expected error
        expectedErrors.forEach((expectedError, index) => {
          const actualError = results[0].messages[index];
          
          assert.ok(actualError, `Missing error for ${expectedError.ruleId}`);
          assert.strictEqual(actualError.ruleId, expectedError.ruleId, 
            `Unexpected rule ID for error in ${filename}`);
          assert.match(actualError.message, expectedError.message, 
            `Unexpected error message in ${filename} ${actualError.message} ${expectedError.message}`);
        });
      });
    });
  });

});