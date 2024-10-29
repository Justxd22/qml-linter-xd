import { parse } from '@oltodo/qml-parser';
import glob from 'glob';
import fs from 'fs';
import { parseJavaScriptBlock } from './utils/astUtils.js';

// Import rules
import noUnusedVariables from './rules/noUnusedVariables.js';
import consistentEquality from './rules/consistentEquality.js';
import consistentSemicolons from './rules/consistentSemicolons.js';
import propertyOrder from './rules/propertyOrder.js';

const rules = {
  noUnusedVariables,
  consistentEquality,
  consistentSemicolons,
  propertyOrder
};

class QMLLinter {
  constructor(config = {}) {
    this.config = {
      rules: {},
      ...config
    };

    // Initialize rules
    Object.entries(this.config.rules)
      .filter(([_, config]) => config.enabled)
      .forEach(([name, config]) => {
        if (rules[name]) {
          this.config.rules[name] = {
            ...rules[name].create({
              report: (issue) => this.report(name, issue),
              config: config.config
            }),
            config: config.config
          };
        }
      });
  }

  report(ruleName, issue) {
    this.currentIssues.push({
      ...issue,
      rule: ruleName,
      filePath: this.currentFilePath
    });
  }

  lint(fileContent, filePath) {
    this.currentIssues = [];
    this.currentFilePath = filePath;

    try {
      const ast = parse(fileContent);

      console.log(`[ASSSST]   ${ast} ${this.config.rules}`)
      // console.log(`[ASSSST]   ${JSON.stringify(ast, null, 2)}\n${JSON.stringify(this.config.rules, null, 2)}`);

      Object.entries(this.config.rules)
        .filter(([_, rule]) => rule.validate)
        .forEach(([_, rule]) => {
          rule.validate(ast);
          console.log(`[INSIDEEE] ${JSON.stringify(ast, null, 2)} [rrr] ${JSON.stringify(rule, null, 2)}`);
        });
    } catch (error) {
      this.currentIssues.push({
        message: `Parsing error: ${error.message}`,
        filePath
      });
    }
    
    return this.currentIssues;
  }

  lintFiles(pattern) {
    const files = glob.sync(pattern);
    const allIssues = [];
    
    files.forEach(file => {
        try {
            const content = fs.readFileSync(file, 'utf8');
            const issues = this.lint(content, file);
            allIssues.push(...issues);
        } catch (error) {
            console.error(`Failed to read file ${file}: ${error.message}`);
        }
    });
    return allIssues;
  }
}

export { QMLLinter };
