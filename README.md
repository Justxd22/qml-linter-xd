# QML validation

## Overview

QML Linter is a validation tool designed to enforce coding standards and best practices in QML files. The linter serves as an ESLint plugin, helping developers maintain consistent code quality through a set of predefined rules. It leverages the `@oltodo/qml-parser` library to parse QML files and provide meaningful feedback on potential issues.

- end goal eslint plugin for validation
- samples from monero-gui-wallet

## Features

- **Rule-Based Validation**: Check your QML code against various configurable rules.
- **JavaScript Code Block Parsing**: Validates JavaScript code blocks within QML files.
- **Report Generation**: Detailed reporting of linting issues, including the type of issue and the affected code.

## Installation

1. Clone the repository:

   ```bash
   git clone 
   cd qml-linter
   ```

You'll first need to install [ESLint](https://eslint.org/):

```sh
npm i eslint --save-dev
```

Next, install `eslint-plugin-qml-linter-xd`:

```sh
npm install eslint-plugin-qml-linter-xd --save-dev
```

## Usage

In your [configuration file](https://eslint.org/docs/latest/use/configure/configuration-files#configuration-file), import the plugin `eslint-plugin-qml-linter-xd` and add `qml-linter-xd` to the `plugins` key:

```js
import qml from "eslint-plugin-qml-linter-xd"


export default [
  {
    files: ["**/*.qml"],
    processor: qml.processors.qml,
  },

];
```


Then configure js rules you want to use under the `rules` key.

```js
import qml from "eslint-plugin-qml-linter-xd"


export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": "error", // Example: prevent unused variables
      "no-console": "warn", // Example: warn on console statements
    },
  },

  {
    files: ["**/*.qml"],
    processor: qml.processors.qml,
  },

];
```


## Contributing
Contributions are welcome! Please feel free to submit a pull request or open an issue for any bugs or feature requests.

## License
This project is licensed under the MIT License. See the LICENSE file for more information.

