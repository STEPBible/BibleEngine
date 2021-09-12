const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = {
  ...config,
  resolver: {
    assetExts: ['db', 'ttf', 'png'],
    resolverMainFields: ['browser', 'main'],
  },
  transformer: {
    minifierPath: 'metro-minify-terser',
    minifierConfig: {
      // https://www.npmjs.com/package/terser#mangle-options
      ecma: 8,
      keep_classnames: true,
      keep_fnames: true,
      module: true,
      mangle: {
        module: true,
        keep_classnames: true,
        keep_fnames: true,
      },
    },
  },
}
