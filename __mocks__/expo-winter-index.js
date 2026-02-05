// Mock pour expo/src/winter/index.ts
// Ce fichier est utilisé via moduleNameMapper dans jest.config.js
// Il évite que Jest essaie de parser le fichier ESM original

// Ce module ne doit rien exporter car il installe juste des globals via runtime
module.exports = {
  __esModule: true,
  default: {},
};

