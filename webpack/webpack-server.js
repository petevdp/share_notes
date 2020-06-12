const {
  SERVER_ROOT,
  SERVER_BUILD_PATH,
  SHARED_ROOT,
  ROOT,
} = require("./paths");

const path = require("path");
const NodemonPlugin = require("nodemon-webpack-plugin");

const MAIN_ENTRY = path.join(SERVER_ROOT, "main.ts");

module.exports = {
  target: "node",
  watchOptions: {
    ignored: "/node_modules/",
  },
  mode: "development",
  context: ROOT,
  devtool: "cheap-source-map",
  entry: {
    main: MAIN_ENTRY,
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: {
          loader: "ts-loader",
          options: { transpileOnly: true },
        },
        exclude: /node_modules/,
      },
    ],
  },
  output: {
    globalObject: "self",
    path: SERVER_BUILD_PATH,
  },
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      Shared: SHARED_ROOT,
      Server: SERVER_ROOT,
    },
  },
  plugins: [new NodemonPlugin()],
};
