// @ts-check

const path = require('path')
const fs = require('fs-extra')
const { spliceConfig } = require('./helpers/config')

const normalizedCacheDir = (PUBLISH_DIR) =>
  path.normalize(`${PUBLISH_DIR}/../.cache`)

const getCacheDirs = (PUBLISH_DIR) => [
  PUBLISH_DIR,
  normalizedCacheDir(PUBLISH_DIR),
]

const DEFAULT_FUNCTIONS_SRC = 'netlify/functions'

const hasPlugin = (plugins, pluginName) =>
  plugins &&
  plugins.some((plugin) =>
    typeof plugin === 'string'
      ? plugin === pluginName
      : plugin.resolve === pluginName,
  )

module.exports = {
  async onPreBuild({ constants: { PUBLISH_DIR }, utils, netlifyConfig }) {
    try {
      // print a helpful message if the publish dir is misconfigured
      if (process.cwd() === PUBLISH_DIR) {
        utils.build.failBuild(
          `Gatsby sites must publish the public directory, but your site’s publish directory is set to “${PUBLISH_DIR}”. Please set your publish directory to your Gatsby site’s public directory.`,
        )
      }

      const cacheDirs = getCacheDirs(PUBLISH_DIR)

      if (await utils.cache.restore(cacheDirs)) {
        console.log('Found a Gatsby cache. We’re about to go FAST. ⚡️')
      } else {
        console.log('No Gatsby cache found. Building fresh.')
      }

      // warn if gatsby-plugin-netlify is missing
      const pluginName = 'gatsby-plugin-netlify'
      const gatsbyConfigFile = path.resolve(process.cwd(), 'gatsby-config.js')
      const gatsbyConfig = fs.existsSync(gatsbyConfigFile)
        ? require(gatsbyConfigFile)
        : {}

      if (!hasPlugin(gatsbyConfig.plugins, pluginName)) {
        console.warn(
          'Add `gatsby-plugin-netlify` to `gatsby-config.js` if you would like to support Gatsby redirects. 🎉',
        )
      }

      if (hasPlugin(gatsbyConfig.plugins, 'gatsby-plugin-netlify-cache')) {
        console.error(
          "The plugin 'gatsby-plugin-netlify-cache' is not compatible with the Gatsby build plugin",
        )
        console.error(
          'Please uninstall gatsby-plugin-netlify-cache and remove it from your gatsby-config.js',
        )
        utils.build.failBuild('Incompatible Gatsby plugin installed')
      }

      if (
        netlifyConfig.plugins.some(
          (plugin) => plugin.package === 'netlify-plugin-gatsby-cache',
        )
      ) {
        console.warn(
          "The plugin 'netlify-plugin-gatsby-cache' is no longer required and should be removed.",
        )
      }
    } catch (error) {
      utils.build.failBuild('Error message', { error })
    }
  },

  async onBuild({
    constants: { PUBLISH_DIR, FUNCTIONS_SRC = DEFAULT_FUNCTIONS_SRC },
    utils,
  }) {
    try {
      // copying gatsby functions to functions directory
      const compiledFunctions = path.join(
        normalizedCacheDir(PUBLISH_DIR),
        '/functions',
      )
      if (!fs.existsSync(compiledFunctions)) {
        return
      }

      // copying netlify wrapper functions into functions directory
      await fs.copy(
        path.join(__dirname, 'templates'),
        path.join(FUNCTIONS_SRC, 'gatsby'),
      )

      await fs.copy(
        compiledFunctions,
        path.join(FUNCTIONS_SRC, 'gatsby', 'functions'),
      )

      const redirectsPath = path.resolve(`${PUBLISH_DIR}/_redirects`)

      await spliceConfig({
        startMarker: '# @netlify/plugin-gatsby redirects start',
        endMarker: '# @netlify/plugin-gatsby redirects end',
        contents: '/api/* /.netlify/functions/gatsby 200',
        fileName: redirectsPath,
      })

      // add gatsby functions to .gitignore if doesn't exist
      const gitignorePath = path.resolve('.gitignore')

      await spliceConfig({
        startMarker: '# @netlify/plugin-gatsby ignores start',
        endMarker: '# @netlify/plugin-gatsby ignores end',
        contents: `${FUNCTIONS_SRC}/gatsby`,
        fileName: gitignorePath,
      })
    } catch (error) {
      utils.build.failBuild('Error message', { error })
    }
  },

  async onPostBuild({ constants: { PUBLISH_DIR }, utils }) {
    try {
      const cacheDirs = getCacheDirs(PUBLISH_DIR)

      if (await utils.cache.save(cacheDirs)) {
        console.log('Stored the Gatsby cache to speed up future builds. 🔥')
      } else {
        console.log('No Gatsby build found.')
      }
    } catch (error) {
      utils.build.failBuild('Error message', { error })
    }
  },
}
