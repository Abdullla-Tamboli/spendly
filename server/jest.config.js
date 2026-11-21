export default {
  transform: {},
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  forceExit: true,
  detectOpenHandles: true,
  setupFiles: ['./src/tests/helpers/setup.js'],
};
