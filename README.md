# QML validation

## Overview

QML Linter is a validation tool designed to enforce coding standards and best practices in QML files. The linter serves as an ESLint plugin, helping developers maintain consistent code quality through a set of predefined rules. It leverages the `@oltodo/qml-parser` library to parse QML files and provide meaningful feedback on potential issues.

- end goal eslint plugin for validation
- samples from monero-gui-wallet

## Features

- **Rule-Based Validation**: Check your QML code against various configurable rules.
- **Customizable Rules**: Enable or disable specific rules as needed in your `.qmllintrc` configuration file.
- **JavaScript Code Block Parsing**: Validates JavaScript code blocks within QML files using Esprima.
- **Report Generation**: Detailed reporting of linting issues, including the type of issue and the affected code.

## Installation

1. Clone the repository:

   ```bash
   git clone 
   cd qml-linter
   ```

2. Install the dependencies:

    ```bash
    npm install
    ```


## Configuration
To configure the linter, create a .qmllintrc file in the root of your project. Here’s an example configuration:

```json
{
  "rules": {
    "noUnusedVariables": {
      "enabled": true
    },
    "consistentEquality": {
      "enabled": true,
      "config": "strict"
    },
    "consistentSemicolons": {
      "enabled": true,
      "config": "always"
    },
    "propertyOrder": {
      "enabled": true,
      "config": ["id", "property", "signal", "function", "Component"]
    }
  }
}
```

## Usage
You can run the linter on your QML files using the following command:

```bash
npm run lint
```

To test the linter and see if your rules are functioning correctly, use the testing scripts:

```bash
npm run test
```

## File Patterns
The linter supports glob patterns for file selection. Modify the lint command in your package.json if you want to specify a different file pattern.


## Testing
The project includes unit tests for the defined rules. You can run the tests with:

```bash
npm run test
```

To run tests in watch mode:

```bash
npm run test:watch
```

## Contributing
Contributions are welcome! Please feel free to submit a pull request or open an issue for any bugs or feature requests.

## License
This project is licensed under the MIT License. See the LICENSE file for more information.

