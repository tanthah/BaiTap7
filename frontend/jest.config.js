module.exports = {
  testEnvironment: 'jsdom',
  
  // Setup files - FIX PATH
  setupFilesAfterEnv: ['<rootDir>/setupTests.js'],  // Bỏ /src/
  
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js'
  },
  
  transformIgnorePatterns: [
    'node_modules/(?!(dompurify)/)'
  ],
  
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/**/*.stories.{js,jsx}',
    '!src/**/*.test.{js,jsx}'
  ],
  
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx}',
    '<rootDir>/tests/**/*.{spec,test}.{js,jsx}'  // Add tests folder
  ],
  
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
  verbose: true
};