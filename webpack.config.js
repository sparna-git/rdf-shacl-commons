const webpack = require("webpack");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const DashboardPlugin = require("webpack-dashboard/plugin");

module.exports = {
  entry: {
    "rdf-shacl-commons": [
      "./src/index.ts"
    ],
  },
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "[name].js",
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: { loader: "babel-loader" },
      },
      {
        test: /\.ts$/,
        use: {
          loader: "ts-loader"
        },
      }
    ],
  },
  resolve: {
    fallback: {
      stream: require.resolve("stream-browserify")
    },
    extensions: [".tsx", ".ts", ".js"],
  },
  plugins: [
    // uncomment to analyze the package size
    // new StatoscopeWebpackPlugin(),
  ],
  devServer: {
    static: {
      directory: path.resolve(__dirname, "./dev-page"),
    },
    historyApiFallback: true,
    hot: true
  },
  devtool: "source-map",
};
