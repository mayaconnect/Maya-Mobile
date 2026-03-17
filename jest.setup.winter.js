// Mock Expo winter runtime (Expo 54+) - Must be loaded FIRST before any module imports
// This file is loaded via setupFiles (not setupFilesAfterEnv) to ensure mocks are in place early

const mockExpoImportMetaRegistry = {};

// Mock expo/build/winter if referenced by jest-expo
jest.mock('expo/build/winter', () => ({}), { virtual: true });

// Mock Expo Winter runtime BEFORE anything else
jest.mock('expo/src/winter/runtime.native', () => {
  return {
    __esModule: true,
    default: {},
  };
}, { virtual: true });

jest.mock('expo/src/winter/installGlobal', () => {
  return {
    __esModule: true,
    __ExpoImportMetaRegistry: mockExpoImportMetaRegistry,
    default: {
      __ExpoImportMetaRegistry: mockExpoImportMetaRegistry,
    },
  };
}, { virtual: true });

// Mock any other potential expo winter paths
jest.mock('expo/winter', () => ({}), { virtual: true });

// Mock expo-auth-session early to prevent Winter runtime from being triggered
jest.mock('expo-auth-session', () => {
  return {
    useAuthRequest: jest.fn(() => [null, null, jest.fn()]),
    makeRedirectUri: jest.fn(() => 'redirect://'),
    ResponseType: { Token: 'token', Code: 'code' },
    AuthRequest: jest.fn(),
    AuthSession: jest.fn(),
    DiscoveryDocument: jest.fn(),
  };
});

