const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuration pour résoudre le problème InternalBytecode.js sur Windows
config.resolver = {
  ...config.resolver,
  unstable_conditionNames: ['require', 'import', 'default', 'browser', 'react-native'],
};

// Ignorer certaines extensions de fichiers problématiques
config.resolver.sourceExts = [
  ...(config.resolver.sourceExts || []),
  'jsx',
  'js',
  'ts',
  'tsx',
  'json',
];

module.exports = config;





