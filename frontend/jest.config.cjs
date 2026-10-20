module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.jest.js'],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '^vitest$': '<rootDir>/src/test/vitest-to-jest.js',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/.stryker-tmp'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/test/**'
  ],
  coverageReporters: ['text', 'lcov', 'html', 'cobertura', 'json'],
  coverageDirectory: '<rootDir>/coverage-jest'
};
