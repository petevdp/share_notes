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
  optimization: {
    runtimeChunk: 'single',
    moduleIds: 'hashed',
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        include: [CLIENT_ROOT, SHARED_ROOT],
        use: [
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

writeGeneratedConfig(config, 'prod');

export default config;