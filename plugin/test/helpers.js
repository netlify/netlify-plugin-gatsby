const build = require('@netlify/build')

module.exports.buildSite = () =>
  build({ testOpts: { testEnv: false }, buffer: true })
