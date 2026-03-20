const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // 添加对 .wasm 文件的支持
  config.module.rules.push({
    test: /\.wasm$/,
    type: 'asset/resource',
  });

  return config;
};
