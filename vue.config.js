const nodeExternals = require('webpack-node-externals');

module.exports = {
  configureWebpack: () => {
    if (process.env.NODE_ENV === 'production') {
      return {
        externals: [
          nodeExternals(),
          { 'vue': 'vue' }
        ]
      }
    }
  }
}