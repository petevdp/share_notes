import configProd from './webpack.prod';
import { Configuration } from 'webpack';
import { merge } from 'webpack-merge';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { writeGeneratedConfig } from './helpers';

const config: Configuration = merge(configProd, {
  plugins: [new BundleAnalyzerPlugin()],
});

writeGeneratedConfig(config, 'prod-analyze');

export default config;
