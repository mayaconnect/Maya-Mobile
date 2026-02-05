// Mock Expo winter runtime (Expo 54+) - Must be loaded FIRST before any module imports
// This file is loaded via setupFiles (not setupFilesAfterEnv) to ensure mocks are in place early

// Installer tous les polyfills nécessaires AVANT tout import
const mockExpoImportMetaRegistry = {};

if (typeof global !== 'undefined') {
  // Créer window si nécessaire
  if (typeof global.window === 'undefined') {
    global.window = global;
  }
  
  // Installer TextDecoder/TextEncoder
  if (typeof global.TextDecoder === 'undefined') {
    global.TextDecoder = class TextDecoder {
      decode(input) {
        return typeof input === 'string' ? input : String.fromCharCode(...input);
      }
    };
  }
  
  if (typeof global.TextEncoder === 'undefined') {
    global.TextEncoder = class TextEncoder {
      encode(input) {
        return new Uint8Array(input.split('').map(c => c.charCodeAt(0)));
      }
    };
  }
  
  if (typeof global.TextDecoderStream === 'undefined') {
    global.TextDecoderStream = class TextDecoderStream {};
  }
  
  if (typeof global.TextEncoderStream === 'undefined') {
    global.TextEncoderStream = class TextEncoderStream {};
  }
  
  if (typeof global.URL === 'undefined') {
    global.URL = class URL {
      constructor(url, base) {
        this.href = url;
      }
    };
  }
  
  if (typeof global.URLSearchParams === 'undefined') {
    global.URLSearchParams = class URLSearchParams {};
  }
  
  if (typeof global.structuredClone === 'undefined') {
    global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
  }
  
  // Copier sur window aussi
  global.window.TextDecoder = global.TextDecoder;
  global.window.TextEncoder = global.TextEncoder;
  global.window.TextDecoderStream = global.TextDecoderStream;
  global.window.TextEncoderStream = global.TextEncoderStream;
  global.window.URL = global.URL;
  global.window.URLSearchParams = global.URLSearchParams;
  global.window.structuredClone = global.structuredClone;
  
  // Installer __ExpoImportMetaRegistry
  Object.defineProperty(global.window, '__ExpoImportMetaRegistry', {
    get: () => mockExpoImportMetaRegistry,
    configurable: true,
    enumerable: true,
  });
}

// Mock expo/build/winter if referenced by jest-expo
jest.mock('expo/build/winter', () => ({}), { virtual: true });

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

