const path = require('path');

let config = {
    entry: {
        index: './index.js'
    },
    output:{
        filename: '[name].js',
        path: path.resolve(__dirname, 'build'),
        library: 'gTag',
        libraryTarget: 'commonjs2'
    },
    target: 'node',
    module: {
        rules: [
            {
                test: /\.js$/,
                include: [path.resolve(__dirname, "lib")],
                exclude: /node_modules/,
                loader: 'babel-loader'
            }
        ]
    },
    plugins: [

    ],
    node: {
        // child_process: true
    }
};

module.exports = config;