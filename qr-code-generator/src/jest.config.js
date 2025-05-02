// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.module\\.css$': 'identity-obj-proxy',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  testEnvironment: 'jsdom',
};

module.exports = createJestConfig(customJestConfig);
