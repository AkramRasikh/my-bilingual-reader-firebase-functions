module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  globalSetup: '<rootDir>/test-setup/global-setup.js',
  globalTeardown: '<rootDir>/test-setup/global-teardown.js',
  testTimeout: 30000,
};
