export default {
  transform: {},
  testEnvironment: 'node',
  testTimeout: 600000,
  testMatch: ['**/tests/**/*.test.js'],
  forceExit: true,
  detectOpenHandles: true,
  setupFiles: ['./src/tests/helpers/setup.js'],
};
