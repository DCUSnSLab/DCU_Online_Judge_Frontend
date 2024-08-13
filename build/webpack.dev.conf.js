'use strict'
const utils = require('./utils')
const webpack = require('webpack')
const config = require('../config')
const { merge } = require('webpack-merge')
const baseWebpackConfig = require('./webpack.base.conf')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')

// add hot-reload related code to entry chunks
Object.keys(baseWebpackConfig.entry).forEach(function (name) {
  baseWebpackConfig.entry[name] = ['./build/dev-client'].concat(baseWebpackConfig.entry[name])
})

module.exports = merge(baseWebpackConfig, {
  mode: 'development',
  module: {
    rules: utils.styleLoaders({ sourceMap: config.dev.cssSourceMap })
  },
  devtool: 'eval-cheap-module-source-map',
  plugins: [
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(config.dev.env)
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new HtmlWebpackPlugin({
      filename: config.build.ojIndex,
      template: config.build.ojTemplate,
      chunks: ['oj'],
      inject: true
    }),
    new HtmlWebpackPlugin({
      filename: config.build.adminIndex,
      template: config.build.adminTemplate,
      chunks: ['admin'],
      inject: true
    }),
    new FriendlyErrorsPlugin()
  ]
})
