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

## Working sample
Qml files from the monero-gui
```bash
❯ npx eslint test/

Preprocessing Input: /home/xd/Documents/code/mdtest/test/Account.qml
Preprocessing Input: /home/xd/Documents/code/mdtest/test/AddressBook.qml
Preprocessing Input: /home/xd/Documents/code/mdtest/test/Advanced.qml
Preprocessing Input: /home/xd/Documents/code/mdtest/test/Keys.qml
Preprocessing Input: /home/xd/Documents/code/mdtest/test/History.qml
Preprocessing Input: /home/xd/Documents/code/mdtest/test/Sign.qml
Preprocessing Input: /home/xd/Documents/code/mdtest/test/Mining.qml
Preprocessing Input: /home/xd/Documents/code/mdtest/test/Receive.qml
Preprocessing Input: /home/xd/Documents/code/mdtest/test/Transfer.qml
Preprocessing Input: /home/xd/Documents/code/mdtest/test/TxKey.qml

/home/xd/Documents/code/mdtest/test/Account.qml
   50:5   error    'accountHeight' is assigned a value but never used           no-unused-vars
   51:5   error    'balanceAllText' is assigned a value but never used          no-unused-vars
   52:5   error    'unlockedBalanceAllText' is assigned a value but never used  no-unused-vars
   56:10  error    'renameSubaddressAccountLabel' is defined but never used     no-unused-vars
  118:29  warning  Unexpected console statement                                 no-console
  153:29  warning  Unexpected console statement                                 no-console
  393:9   warning  Unexpected console statement                                 no-console

/home/xd/Documents/code/mdtest/test/AddressBook.qml
   47:5   error    'addressbookHeight' is assigned a value but never used  no-unused-vars
  456:33  warning  Unexpected console statement                            no-console
  472:29  warning  Unexpected console statement                            no-console
  508:10  error    'showEditAddress' is defined but never used             no-unused-vars
  521:9   warning  Unexpected console statement                            no-console
  547:9   warning  Unexpected console statement                            no-console

/home/xd/Documents/code/mdtest/test/History.qml
  1450:17  error    'matched' is assigned a value but never used         no-unused-vars
  1638:10  error    'editDescription' is defined but never used          no-unused-vars
  1664:10  error    'removeFromCollapsedList' is defined but never used  no-unused-vars
  1691:10  error    'showTxDetails' is defined but never used            no-unused-vars
  1710:10  error    'showTxProof' is defined but never used              no-unused-vars
  1710:53  error    'subaddrAccount' is defined but never used           no-unused-vars
  1710:69  error    'subaddrIndex' is defined but never used             no-unused-vars
  1713:13  warning  Unexpected console statement                         no-console
  1719:13  warning  Unexpected console statement                         no-console
  1722:9   warning  Unexpected console statement                         no-console
  1731:9   warning  Unexpected console statement                         no-console
  1761:13  warning  Unexpected console statement                         no-console
  1793:19  error    'err' is defined but never used                      no-unused-vars
  1828:10  error    'searchInHistory' is defined but never used          no-unused-vars

/home/xd/Documents/code/mdtest/test/Keys.qml
   43:5  error    'keysHeight' is assigned a value but never used  no-unused-vars
  272:9  warning  Unexpected console statement                     no-console

/home/xd/Documents/code/mdtest/test/Mining.qml
  41:5  error  'miningHeight' is assigned a value but never used       no-unused-vars
  42:5  error  'currentHashRate' is assigned a value but never used    no-unused-vars
  44:5  error  'stopMiningEnabled' is assigned a value but never used  no-unused-vars

/home/xd/Documents/code/mdtest/test/Receive.qml
   52:5   error    'receiveHeight' is assigned a value but never used  no-unused-vars
  758:21  warning  Unexpected console statement                        no-console
  771:9   warning  Unexpected console statement                        no-console

/home/xd/Documents/code/mdtest/test/Sign.qml
   40:5   error    'signHeight' is assigned a value but never used  no-unused-vars
  424:10  error    'clearFields' is defined but never used          no-unused-vars
  435:9   warning  Unexpected console statement                     no-console

/home/xd/Documents/code/mdtest/test/Transfer.qml
    52:5   error    'transferHeight1' is assigned a value but never used  no-unused-vars
    53:5   error    'transferHeight2' is assigned a value but never used  no-unused-vars
   109:9   warning  Unexpected console statement                          no-console
   839:19  warning  Unexpected console statement                          no-console
   841:19  warning  Unexpected console statement                          no-console
   883:17  warning  Unexpected console statement                          no-console
   889:17  warning  Unexpected console statement                          no-console
   909:17  warning  Unexpected console statement                          no-console
   915:17  warning  Unexpected console statement                          no-console
   939:17  warning  Unexpected console statement                          no-console
   941:17  warning  Unexpected console statement                          no-console
   948:17  warning  Unexpected console statement                          no-console
   954:17  warning  Unexpected console statement                          no-console
   981:17  warning  Unexpected console statement                          no-console
  1001:17  warning  Unexpected console statement                          no-console
  1011:17  warning  Unexpected console statement                          no-console
  1028:13  warning  Unexpected console statement                          no-console
  1055:13  warning  Unexpected console statement                          no-console
  1065:13  warning  Unexpected console statement                          no-console
  1073:13  warning  Unexpected console statement                          no-console
  1083:13  warning  Unexpected console statement                          no-console
  1091:13  warning  Unexpected console statement                          no-console
  1101:13  warning  Unexpected console statement                          no-console
  1109:13  warning  Unexpected console statement                          no-console
  1120:13  warning  Unexpected console statement                          no-console
  1128:13  warning  Unexpected console statement                          no-console
  1141:9   warning  Unexpected console statement                          no-console
  1187:10  error    'sendTo' is defined but never used                    no-unused-vars

/home/xd/Documents/code/mdtest/test/TxKey.qml
   41:5   error    'txkeyHeight' is assigned a value but never used  no-unused-vars
  151:21  warning  Unexpected console statement                      no-console
  236:21  warning  Unexpected console statement                      no-console
  262:10  error    'clearFields' is defined but never used           no-unused-vars
  274:9   warning  Unexpected console statement                      no-console

✖ 71 problems (27 errors, 44 warnings)
```
## Contributing
Contributions are welcome! Please feel free to submit a pull request or open an issue for any bugs or feature requests.

## License
This project is licensed under the MIT License. See the LICENSE file for more information.

