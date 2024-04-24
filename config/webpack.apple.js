/* eslint-disable  */

const {merge} = require("webpack-merge")
const prd = require("./webpack.prd.js")
const path = require("path")

module.exports = merge(prd, {
  entry: ["./src/main.apple.ts"],
  output: {
    path: path.resolve(__dirname, "../dist/apple"),
  },
})
