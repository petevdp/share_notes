import 'module-alias/register';
const path = require('path');
import { CLIENT_BUILD_PATH, CLIENT_ROOT, MONACO_ROOT, SHARED_ROOT } from '../src/server/paths';
import * as p from 'Server/paths';
import { API_PORT, DEV_SERVER_PORT } from 'Shared/environment';

import HtmlWebPackPlugin from 'html-webpack-plugin';
import { Configuration } from 'webpack';

console.log(p);

const config: Configuration = {
  mode: 'development',
  devtool: 'source-map',
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
      template: path.join(CLIENT_ROOT, 'index.html'),
      inject: 'body',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            projectReferences: true,
          },
        },
      },
      // monaco uses some css and font modules we need to load
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2)$/i,
        loader: 'url-loader',
        options: {
          limit: 8192,
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    alias: {
      Shared: SHARED_ROOT,
      Client: CLIENT_ROOT,
    },
  },
};

// the devServer Property appears to be missing on the Configuration typescript interface, so we have to define this separately
const devServer = {
  contentBase: CLIENT_BUILD_PATH,
  proxy: { '/api': `http://localhost:${API_PORT}` },
  compress: true,
  historyApiFallback: true,
  port: DEV_SERVER_PORT,
};

export default { ...config, devServer };
