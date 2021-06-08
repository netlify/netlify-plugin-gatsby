const build = require('@netlify/build')
exports.buildSite = () => {
  return build({ testOpts: { testEnv: false }, buffer: true })
}
