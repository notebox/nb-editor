/* eslint-disable  */

const {CleanWebpackPlugin} = require("clean-webpack-plugin")
const HTMLWebpackPlugin = require("html-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const {merge} = require("webpack-merge")
const prd = require("./webpack.prd.js")
const path = require("path")

module.exports = merge({
  ...prd,
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({filename: "static/app.css"}),
    new HTMLWebpackPlugin({template: "./src/index.html"}),
  ],
}, {
  entry: ["./src/main.iframe.ts"],
  output: {
    path: path.resolve(__dirname, "../dist/iframe"),
    filename: "static/app.js",
  },
})
