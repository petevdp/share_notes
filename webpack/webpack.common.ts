import * as webpack from 'webpack';
import { CLIENT_ROOT, SHARED_ROOT } from '../src/server/paths';
import HtmlWebPackPlugin from 'html-webpack-plugin';
import FaviconsWebpackPlugin from 'favicons-webpack-plugin';
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';
import path from 'path';

const config: webpack.Configuration = {
  entry: {
    app: CLIENT_ROOT,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    alias: {
      Shared: SHARED_ROOT,
      Client: CLIENT_ROOT,
    },
  },
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
    ],
  },
  plugins: [
    new MonacoWebpackPlugin(),
    new FaviconsWebpackPlugin({ logo: './src/client/assets/svgs/logo.svg' }),
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
};

export default config;
