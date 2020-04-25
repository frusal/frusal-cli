// @ts-check
/* eslint-disable @typescript-eslint/no-var-requires, no-undef */

const webpack = require('webpack');
const shelljs = require('shelljs');
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { TsconfigPathsPlugin } = require('tsconfig-paths-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

/** @type {import("webpack").Configuration} */
const config = {
    entry: './src/main.ts',
    mode: 'production',
    module: {
        rules: [{ test: /\.ts$/, use: 'ts-loader', exclude: /node_modules/ }]
    },
    resolve: {
        plugins: [new TsconfigPathsPlugin()],
        extensions: ['.ts', '.js'],
    },
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin()],
    },
    plugins: [
        new CleanWebpackPlugin(),
        new webpack.BannerPlugin({ banner: '#!/usr/bin/env node', raw: true, entryOnly: true }),
        new CopyPlugin([{ from: "static" }, { from: "README.md" }, { from: "node_modules/@frusal/library-for-node/index.js.LICENSE.txt" }]),
        compiler => compiler.hooks.done.tap('fs-chmod', () => shelljs.chmod(755, path.resolve('dist', 'index.js'))), // chmod +x dist/frusal-cli.js
        compiler => compiler.hooks.done.tap('fs-cp-sub-lic', () => shelljs.cp("node_modules/@frusal/library-for-node/index.js.LICENSE.txt", "dist")), // pass on license acknowledgements
    ],
    output: {
        filename: "index.js"
    },
    target: "node"
}

module.exports = config;
