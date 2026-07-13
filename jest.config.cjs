/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  rootDir: 'src/tests',
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  // The Fuseki-backed integration suite requires core's uncompiled test-helpers
  // and a running Fuseki, so it can't run in unit CI. Skip it by default; run it
  // locally via `npm run test:integration` (which overrides this ignore).
  testPathIgnorePatterns: ['react-component-integration'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: '<rootDir>/../../tsconfig-test.json',
      },
    ],
  },
  // Strip the `.js` extension from relative ESM imports so ts-jest resolves the
  // `.ts` source (NodeNext-style specifiers carry `.js`; jest maps back to src).
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@_linked/core/test-helpers/(.*)$': '<rootDir>/../../../core/src/test-helpers/$1',
    '^@_linked/react/(.*)$': '<rootDir>/../$1',
    '^@_linked/react$': '<rootDir>/../index',
  },
};
