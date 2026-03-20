const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 告诉打包工具，见到 .wasm 文件请放行
config.resolver.assetExts.push('wasm');

module.exports = config;