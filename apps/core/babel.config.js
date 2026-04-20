module.exports = function (api) {
  api.cache(true);
  const plugins = [
    '@babel/plugin-transform-async-generator-functions',
    'react-native-reanimated/plugin',
  ];
  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
