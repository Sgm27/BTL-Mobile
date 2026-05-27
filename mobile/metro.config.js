const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// On web, stub out native-only modules so Metro doesn't try to bundle them.
const webStubs = {
  'react-native-maps': path.resolve(__dirname, 'src/mocks/empty-module.js'),
  'expo-secure-store': path.resolve(__dirname, 'src/mocks/secure-store-web.js'),
};

const originalResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && webStubs[moduleName]) {
    return {
      type: 'sourceFile',
      filePath: webStubs[moduleName],
    };
  }
  if (originalResolver) {
    return originalResolver(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
