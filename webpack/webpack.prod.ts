import 'module-alias/register';
import webpack, { DefinePlugin } from 'webpack';
import fs from 'fs';
import { CLIENT_ROOT, SHARED_ROOT, ROOT, CLIENT_BUILD_PATH_PROD } from '../src/server/paths';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import { merge } from 'webpack-merge';
import path from 'path';
import commonConfig from './webpack.common';
import { writeGeneratedConfig } from './helpers';

const config: webpack.Configuration = merge(commonConfig, {
  mode: 'production',
  devtool: 'source-map',
  output: {
    globalObject: 'self',
    filename: '[name].[contenthash].js',
    path: CLIENT_BUILD_PATH_PROD,
  },
  plugins: [
    new CleanWebpackPlugin(),
    new DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.ttf$/,
        use: ['file-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2)$/i,
        loader: 'url-loader',
        options: {
          limit: 8192,
        },
      },
      {
        test: /\.tsx?$/,
        include: [CLIENT_ROOT, SHARED_ROOT],
        use: [
          {
            loader: 'babel-loader',
          },
          {
            loader: 'ts-loader',
            options: {
              // type errors will be caught by npm run start:compile on front and backend, so we don't need to typecheck here
              transpileOnly: true,
              projectReferences: true,
            },
          },
        ],
      },
    ],
  },
  optimization: {
    runtimeChunk: 'single',
    moduleIds: 'hashed',
  },
});

writeGeneratedConfig(config, 'prod');

export default config;
