'use strict'
const os = require('os');
const path = require('path');
const utils = require('./utils');
const webpack = require('webpack');
const config = require('../config');
const { merge } = require('webpack-merge');
const baseWebpackConfig = require('./webpack.base.conf');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const webpackConfig = merge(baseWebpackConfig, {
  mode: 'production',
  module: {
    rules: utils.styleLoaders({
      sourceMap: config.build.productionSourceMap,
      extract: true,
      use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader']
    })
  },
  devtool: config.build.productionSourceMap ? 'hidden-source-map' : false,
  output: {
    path: config.build.assetsRoot,
    filename: utils.assetsPath('js/[name].[contenthash].js'),
    chunkFilename: utils.assetsPath('js/[id].[contenthash].js')
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          name: 'vendor',
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          chunks: 'initial'
        },
      },
    },
    runtimeChunk: {
      name: 'manifest',
    },
    minimizer: [
      new TerserPlugin({
        exclude: /\.min\.js$/,
        cache: true,
        parallel: os.cpus().length,
        sourceMap: config.build.productionSourceMap,
      }),
      new CssMinimizerPlugin()
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(config.build.env)
    }),
    new webpack.optimize.ModuleConcatenationPlugin(),
    new MiniCssExtractPlugin({
      filename: utils.assetsPath('css/[name].[contenthash].css'),
      chunkFilename: utils.assetsPath('css/[id].[contenthash].css')
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, '../static'),
          to: config.build.assetsSubDirectory,
          globOptions: {
            ignore: ['.*'],
          },
        },
      ],
    }),
    new HtmlWebpackPlugin({
      filename: config.build.ojIndex,
      template: config.build.ojTemplate,
      chunks: ['manifest', 'vendor', 'oj'],
      inject: true,
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true,
      }
    }),
    new HtmlWebpackPlugin({
      filename: config.build.adminIndex,
      template: config.build.adminTemplate,
      chunks: ['manifest', 'vendor', 'admin'],
      inject: true,
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true,
      }
    })
  ]
});

if (config.build.productionGzip) {
  const CompressionWebpackPlugin = require('compression-webpack-plugin');

  webpackConfig.plugins.push(
    new CompressionWebpackPlugin({
      filename: '[path][base].gz',
      algorithm: 'gzip',
      test: new RegExp(
        '\\.(' + config.build.productionGzipExtensions.join('|') + ')$'
      ),
      threshold: 10240,
      minRatio: 0.8
    })
  );
}

if (config.build.bundleAnalyzerReport) {
  const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
  webpackConfig.plugins.push(new BundleAnalyzerPlugin());
}

module.exports = webpackConfig;
