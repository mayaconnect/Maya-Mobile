// Mock pour expo/src/winter/installGlobal
// Ce fichier est utilisé via moduleNameMapper dans jest.config.js

const mockExpoImportMetaRegistry = {};

// Fonction pour installer les globals
function installGlobal() {
  // S'assurer que __ExpoImportMetaRegistry est disponible sur window
  if (typeof global !== 'undefined') {
    if (typeof global.window === 'undefined') {
      global.window = {};
    }
    Object.defineProperty(global.window, '__ExpoImportMetaRegistry', {
      get: () => mockExpoImportMetaRegistry,
      configurable: true,
      enumerable: true,
    });
    
    // Mock structuredClone si nécessaire
    if (typeof global.window.structuredClone === 'undefined') {
      global.window.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
    }
  }
}

// Appeler installGlobal immédiatement
installGlobal();

module.exports = {
  __esModule: true,
  __ExpoImportMetaRegistry: mockExpoImportMetaRegistry,
  default: {
    __ExpoImportMetaRegistry: mockExpoImportMetaRegistry,
  },
  installGlobal,
};

