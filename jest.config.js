export default {
    testEnvironment: 'node',
    transform: {
      // Use Babel to transform the test files
      '^.+\\.jsx?$': 'babel-jest',
    },
    moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
    testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
    globals: {
      'ts-jest': {
        useESM: true,
      },
    },
  };
  