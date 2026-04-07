module.exports = function (api) {
  api.cache(true);
  const plugins = [
    [
      '@tamagui/babel-plugin',
      {
        components: ['tamagui'],
        config: './tamagui.config.ts',
      },
    ],
    '@babel/plugin-transform-async-generator-functions',
    'react-native-reanimated/plugin',
  ];
  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
