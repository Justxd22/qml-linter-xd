import qml from "eslint-plugin-qml-linter-xd";


export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest", // Modern JavaScript
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": "warn", // Example: prevent unused variables
      "no-console": "warn", // Example: warn on console statements
      "semi": ["error", "always"], // Enforce semicolons
      "eqeqeq": ["error", "always"], // Require === and !== instead of == and !=
      "keyword-spacing": "error",
      "space-before-blocks": "error"
    },
    processor: qml.processors["pragma-js"],
  },

  {
    files: ["**/*.qml"],
    processor: qml.processors.qml,
  },

];
