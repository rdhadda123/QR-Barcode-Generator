module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    transform: {
      '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    },
    moduleDirectories: ['node_modules', '<rootDir>'],
    testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/']
  };