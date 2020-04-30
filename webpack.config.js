// @ts-check
/* eslint-disable @typescript-eslint/no-var-requires, no-undef */

const webpack = require('webpack');
const fs = require('fs');
const path = require('path');
const shelljs = require('shelljs');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { TsconfigPathsPlugin } = require('tsconfig-paths-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

/** @return {import("webpack").Configuration} */
function config() {
    return {
        entry: './src/main.ts',
        mode: 'development',
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
            new CopyPlugin([
                { from: "static" },
                { from: "README.md" },
                { from: "node_modules/@frusal/library-for-node/index.d.ts" },
                { from: "node_modules/@frusal/library-for-node/wrapper.mjs" },
            ]),
            new MyPlugin(),
        ],
        output: {
            filename: "index.js",
            libraryTarget: 'umd',
        },
        node: {
            __dirname: false,
            __filename: false
        },
        target: "node"
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/** @implements {webpack.Plugin} */
class MyPlugin {
    /** @param {webpack.Compiler} compiler */
    apply(compiler) {
        compiler.hooks.beforeCompile.tap('my-plugin', () => {
            // banner
            console.log(compiler.options.mode !== 'production' ? 'Development build. 🤪' : 'Production build. 🥶');
        });
        compiler.hooks.done.tap('my-plugin', () => {
            // chmod +x dist/frusal-cli.js
            shelljs.chmod(755, path.resolve('dist', 'index.js'));

            // pass on license acknowledgements
            shelljs.cp("node_modules/@frusal/library-for-node/index.js.LICENSE.txt", "dist");

            // mark the release private unless it is a production (mode) build
            if (compiler.options.mode !== 'production') {
                const fileName = path.resolve('dist', 'package.json');
                const packageJson = JSON.parse(fs.readFileSync(fileName).toString());
                packageJson.private = true;
                fs.writeFileSync(fileName, JSON.stringify(packageJson, null, 2));
            }
        });
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = config();
