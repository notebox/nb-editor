/* eslint-disable  */

const path = require("path")
const {CleanWebpackPlugin} = require("clean-webpack-plugin")
const HTMLWebpackPlugin = require("html-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")

module.exports = {
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../src/"),
    },
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
  },
  entry: ["./src/resource/style/all.scss"],
  output: {
    path: path.resolve(__dirname, "../dist"),
    filename: "static/[chunkhash].js",
    publicPath: "/",
  },
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({filename: "static/[chunkhash].css"}),
    new HTMLWebpackPlugin({template: "./src/index.html"}),
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.svg$/,
        use: ["url-loader"],
      },
      {
        test: /\.js$/,
        include: [path.resolve(__dirname, "../src")],
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
            plugins: ["@babel/plugin-proposal-class-properties"],
          },
        },
      },
    ],
  },
}
