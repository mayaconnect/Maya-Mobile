/** @type {import('jest').Config} */
module.exports = {
  roots: ['<rootDir>'],
  testMatch: [
    '**/__tests__/**/*.test.{ts,tsx}',
    '**/*.test.{ts,tsx}',
    '**/*.spec.{ts,tsx}',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^react-native$': 'react-native-web',
    // Mapper les imports Expo Winter vers nos mocks
    '^expo/src/winter/index$': '<rootDir>/__mocks__/expo-winter-index.js',
    '^expo/src/winter/runtime.native$': '<rootDir>/__mocks__/expo-winter-runtime.js',
    '^expo/src/winter/installGlobal$': '<rootDir>/__mocks__/expo-winter-installGlobal.js',
  },
  // setupFiles est exécuté AVANT que les modules ne soient importés
  // C'est crucial pour mocker le runtime Expo Winter
  setupFiles: ['<rootDir>/jest.setup.winter.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Utiliser jest-expo preset pour une meilleure compatibilité
  preset: 'jest-expo',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@testing-library)',
  ],
  collectCoverageFrom: [
    'services/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'features/**/*.{ts,tsx}',
    'utils/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/coverage/**',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/'],
  // jsdom pour les tests de composants React Native
  testEnvironment: 'jsdom',
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
