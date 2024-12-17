import qml from "eslint-plugin-qml-linter-xd";


export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest", // Modern JavaScript
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
