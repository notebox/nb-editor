/* eslint-disable  */

const {merge} = require("webpack-merge")
const common = require("./webpack.common.js")

module.exports = merge(common, {
  mode: "development",
  devtool: "source-map",
  devServer: {
    port: 3000,
    static: "../dist",
  },
  entry: ["./src/main.debug.tsx"],
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          "style-loader" /** @purpose HMR */,
          "css-loader" /** @purpose translates CSS into CommonJS */,
          "sass-loader" /** @purpose compiles Sass to CSS, using Node Sass by default */,
        ],
        exclude: /node_modules/,
      },
    ],
  },
})
