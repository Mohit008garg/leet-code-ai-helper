const { merge } = require('webpack-merge')
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const config = require('./webpack.config.js');

module.exports = merge(config, {
    mode: 'production',
    entry: {
  content: './src/content.tsx',
        popup: './src/index.tsx'
    // add other entries if needed
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js', // this will output content.js
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'popup.html',       // generates popup.html
      chunks: ['popup']             // injects only popup.js
    })
  ]
})