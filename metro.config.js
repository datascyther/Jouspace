const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@': path.resolve(__dirname, 'src'),
  '@jouspace': path.resolve(__dirname, 'src'),
  backend: path.resolve(__dirname, 'backend'),
};

config.watchFolders = [...(config.watchFolders || []), path.resolve(__dirname, 'src')];

module.exports = withNativeWind(config, { input: './src/global.css' });
