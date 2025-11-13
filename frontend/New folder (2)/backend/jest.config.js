module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.js$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/test/**/*.test.(ts|tsx|js)'],
  transformIgnorePatterns: [
    '/node_modules/(?!uuid)'
  ],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      useESM: true,
    },
  },
};
