import { stripIndent as javascript } from 'common-tags'

export const getGatsbyConfigWrapper = (pluginPath: string): string =>
  // A string, but with the right editor plugin this will format as JS
  javascript`

const originalConfig = require('./gatsby-config-orig')
module.exports = {
  ...originalConfig,
  plugins: [
    ...originalConfig.plugins,
    {
      resolve: require.resolve("${pluginPath}"),
      "__nf_auto": true
    },
  ],
}
`
