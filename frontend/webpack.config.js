const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: "./src/main.js",

  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/resource",
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: "./index.html",
      filename: "index.html",
    }),
  ],

  output: {
    path: path.resolve(__dirname, "public"), // 改为 public
    filename: "bundle.js",
    clean: true,
  },

  devServer: {
    static: {
      directory: path.join(__dirname, "public"), // 改为 public
    },
    compress: true,
    port: 8080,
    open: true,
    hot: true,
  },

  resolve: {
    extensions: [".js", ".json"],
  },
};
