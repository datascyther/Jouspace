module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      // Reanimated v4 depends on react-native-worklets; this plugin MUST be last
      // so worklet functions (useAnimatedStyle/withTiming callbacks, etc.) are
      // compiled. Without it the entry screen crashes on the UI thread and the
      // app auto-closes immediately on launch.
      'react-native-reanimated/plugin',
    ],
  };
};
