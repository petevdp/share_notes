import 'module-alias/register';
const path = require('path');
import { CLIENT_BUILD_PATH, CLIENT_ROOT, SHARED_ROOT, MONACO_ROOT } from 'Server/paths';
import * as p from 'Server/paths';
import { API_PORT, DEV_SERVER_PORT } from 'Shared/environment';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';

import HtmlWebPackPlugin from 'html-webpack-plugin';
import { Configuration } from 'webpack';
import { API_URL } from '../dist/src/shared/environment';

console.log(p);

const config: Configuration = {
  mode: 'development',
  devtool: 'inline-source-map',
  entry: {
    app: CLIENT_ROOT,
    // 'json.worker': path.join(MONACO_ROOT, 'language/json/json.worker.js'),
    // 'css.worker': path.join(MONACO_ROOT, '/language/css/css.worker.js'),
    // 'html.worker': path.join(MONACO_ROOT, '/language/html/html.worker.js'),
    // 'ts.worker': path.join(MONACO_ROOT, '/language/typescript/ts.worker.js'),
    // 'editor.worker': path.join(MONACO_ROOT, '/editor/editor.worker.js'),
  },
  output: {
    globalObject: 'self',
    path: CLIENT_BUILD_PATH,
  },
  plugins: [
    new ReactRefreshWebpackPlugin(),
    new HtmlWebPackPlugin({
      title: 'Share Notes',
      template: path.join(CLIENT_ROOT, 'index.html'),
      inject: 'body',
      // resolve all relative urls as a full url
      base: {
        href: '/',
      },
    }),
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        include: [CLIENT_ROOT, SHARED_ROOT],
        use: [
          {
            loader: 'babel-loader',
            options: { plugins: ['react-refresh/babel'] },
          },
          {
            loader: 'ts-loader',
            options: {
              // type errors will be caught by npm run start:compile on front and backend, so we don't need to typecheck here
              transpileOnly: true,
              projectReferences: true,
            },
          },
        ].filter(Boolean),
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
  proxy: {
    '/api': {
      target: API_URL,
      pathRewrite: { '^/api': '' },
      secure: false,
      changeOrigin: true,
    },
  },
  compress: true,
  hot: true,
  historyApiFallback: true,
  port: DEV_SERVER_PORT,
};

export default { ...config, devServer };
