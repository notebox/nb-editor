/* eslint-disable  */

const path = require("path")
const {merge} = require("webpack-merge")
const common = require("./webpack.common.js")
const TerserPlugin = require("terser-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")

module.exports = merge(common, {
  mode: "production",
  output: {
    path: path.resolve(__dirname, "../dist"),
    filename: "static/[chunkhash].js",
    publicPath: "./",
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          format: {
            comments: false,
          },
          compress: {
            drop_console: true,
          },
        },
        extractComments: false,
      }),
    ],
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader" /** @purpose translates CSS into CommonJS */,
          "sass-loader" /** @purpose compiles Sass to CSS, using Node Sass by default */,
        ],
        exclude: /node_modules/,
      },
    ],
  },
})
