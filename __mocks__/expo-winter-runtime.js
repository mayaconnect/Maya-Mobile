// Mock pour expo/src/winter/runtime.native
// Ce fichier est utilisé via moduleNameMapper dans jest.config.js
// Ce fichier installe des polyfills globaux, mais nous les mockons pour les tests

// Mock des polyfills globaux pour éviter les erreurs d'import
if (typeof global !== 'undefined') {
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
        this.origin = '';
        this.protocol = '';
        this.host = '';
        this.hostname = '';
        this.port = '';
        this.pathname = '';
        this.search = '';
        this.hash = '';
      }
    };
  }
  
  if (typeof global.URLSearchParams === 'undefined') {
    global.URLSearchParams = class URLSearchParams {
      constructor(init) {
        this.params = new Map();
      }
      get(name) { return this.params.get(name); }
      set(name, value) { this.params.set(name, value); }
      has(name) { return this.params.has(name); }
      delete(name) { this.params.delete(name); }
    };
  }
  
  if (typeof global.structuredClone === 'undefined') {
    global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
  }
  
  if (typeof global.window !== 'undefined') {
    global.window.TextDecoder = global.TextDecoder;
    global.window.TextEncoder = global.TextEncoder;
    global.window.TextDecoderStream = global.TextDecoderStream;
    global.window.TextEncoderStream = global.TextEncoderStream;
    global.window.URL = global.URL;
    global.window.URLSearchParams = global.URLSearchParams;
    global.window.structuredClone = global.structuredClone;
  }
}

// Mock __ExpoImportMetaRegistry
const mockExpoImportMetaRegistry = {};
if (typeof global !== 'undefined') {
  if (typeof global.window === 'undefined') {
    global.window = {};
  }
  Object.defineProperty(global.window, '__ExpoImportMetaRegistry', {
    get: () => mockExpoImportMetaRegistry,
    configurable: true,
    enumerable: true,
  });
}

// Ce module ne doit rien exporter car il installe juste des globals
module.exports = {
  __esModule: true,
  default: {},
};

