const nodeExternals = require('webpack-node-externals');
const { RunScriptWebpackPlugin } = require('run-script-webpack-plugin');

module.exports = function (options, webpack) {
  let originalEntry = options.entry;

  // Handle string entry
  if (typeof originalEntry === 'string') {
    originalEntry = [originalEntry];
  }

  // Handle object { main: './src/main.ts' }
  if (typeof originalEntry === 'object' && !Array.isArray(originalEntry)) {
    originalEntry = Object.values(originalEntry).flat();
  }

  return {
    ...options,

    entry: ['webpack/hot/poll?100', ...originalEntry],

    watch: true,

    externals: [
      nodeExternals({
        allowlist: ['webpack/hot/poll?100'],
      }),
    ],

    plugins: [
      ...options.plugins,

      new webpack.HotModuleReplacementPlugin(),

      new RunScriptWebpackPlugin({
        name: options.output.filename,
        autoRestart: false,
      }),
    ],

    watchOptions: {
      aggregateTimeout: 200,
      poll: 100,
      ignored: /node_modules/,
    },
  };
};
