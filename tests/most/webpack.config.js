var path = require('path');
var CopyWebpackPlugin = require('copy-webpack-plugin')

var outputPath = path.resolve(__dirname, '../../public/tests/most');

module.exports = {
  entry: './index.js',
  resolve: {
    extensions: [ '.js' ]
  },
  output: {
    filename: 'bundle.js',
    path: outputPath
  },
  plugins: [
    new CopyWebpackPlugin([{
      from: './index.html',
      to: path.join(outputPath, 'index.html')
    }])
  ]
};
