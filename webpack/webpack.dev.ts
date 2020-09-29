import 'module-alias/register';
import * as path from 'path';
import * as fs from 'fs';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import { CLIENT_BUILD_PATH_DEV, CLIENT_ROOT, SHARED_ROOT, ROOT } from '../src/server/paths';
import * as p from 'Server/paths';
import commonConfig from './webpack.common';
import { API_PORT, DEV_SERVER_PORT } from 'Shared/environment';
import { Configuration, DefinePlugin } from 'webpack';
import { merge } from 'webpack-merge';

import { API_URL } from '../dist/src/shared/environment';

const config: Configuration = merge(commonConfig, {
  mode: 'development',
  devtool: 'inline-source-map',
  output: {
    globalObject: 'self',
    path: CLIENT_BUILD_PATH_DEV,
  },
  plugins: [
    new DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
    }),
    new ReactRefreshWebpackPlugin(),
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
});

// the devServer Property appears to be missing on the Configuration typescript interface, so we have to define this separately
const devServer = {
  contentBase: CLIENT_BUILD_PATH_DEV,
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

const generatedOutPath = path.join(ROOT, 'webpack/generated/dev.json');

fs.writeFile(generatedOutPath, JSON.stringify(config, undefined, 2), {}, () =>
  console.log('generated dev config: ', generatedOutPath),
);

export default { ...config, devServer };
