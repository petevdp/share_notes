const path = require('path');
const { CLIENT_BUILD_PATH, CLIENT_ROOT, MONACO_ROOT, SHARED_ROOT } = require('./paths');

const HtmlWebPackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  devServer: {
    contentBase: CLIENT_BUILD_PATH,
    compress: true,
    historyApiFallback: true,
    port: 1234,
  },
  devtool: 'inline-source-map',
  entry: {
    app: CLIENT_ROOT,
    'json.worker': path.join(MONACO_ROOT, 'language/json/json.worker.js'),
    'css.worker': path.join(MONACO_ROOT, '/language/css/css.worker.js'),
    'html.worker': path.join(MONACO_ROOT, '/language/html/html.worker.js'),
    'ts.worker': path.join(MONACO_ROOT, '/language/typescript/ts.worker.js'),
    'editor.worker': path.join(MONACO_ROOT, '/editor/editor.worker.js'),
  },
  output: {
    globalObject: 'self',
    path: CLIENT_BUILD_PATH,
  },
  plugins: [
    new HtmlWebPackPlugin({
      title: 'Share Notes',
      template: './src/client/index.html',
      inject: 'body',
    }),
  ],
  resolve: {
    extensions: ['.js'],
    alias: {
      Shared: SHARED_ROOT,
      Client: CLIENT_ROOT,
    },
  },
};
