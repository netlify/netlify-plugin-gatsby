// @ts-check

const path = require('path');

const getCacheDirs = (PUBLISH_DIR) => [
  PUBLISH_DIR,
  path.normalize(`${PUBLISH_DIR}/../.cache`),
];

module.exports = {
  async onPreBuild({ netlifyConfig, constants, packageJson, inputs, utils }) {
    try {
      // print a helpful message if the publish dir is misconfigured
      if (process.cwd() === constants.PUBLISH_DIR) {
        utils.build.failBuild(
          `Gatsby sites must publish the public directory, but your site’s publish directory is set to “${constants.PUBLISH_DIR}”. Please set your publish directory to your Gatsby site’s public directory.`,
        );
      }

      const cacheDirs = getCacheDirs(constants.PUBLISH_DIR);

      if (await utils.cache.restore(cacheDirs)) {
        console.log('Found a Gatsby cache. We’re about to go FAST. ⚡️');
      } else {
        console.log('No Gatsby cache found. Building fresh.');
      }

      const pluginName = 'gatsby-plugin-netlify';
      const gatsbyConfig = require(path.join(process.cwd(), 'gatsby-config'))
      if (!gatsbyConfig.plugins.some((plugin) => (typeof plugin === 'string' ? plugin === pluginName : plugin.resolve === pluginName))) {
        console.warn('Add gatsby-plugin-netlify to gatsby-config if you would like to support redirects.');
      }

      // add our functions to .gitignore
  
      // copying netlify wrapper functions into function dir
  
      // copy compiled gatsby functions into function dir
  
      // add redirect
  
    } catch (error) {
      // Report a user error
      utils.build.failBuild('Error message', { error })
    }

    // Display success information
    utils.status.show({ summary: 'Success!' })
  },

  // Other available event handlers
  /*
  // Before build commands are executed
  onPreBuild() {},
  // Build commands are executed
  onBuild() {},
  */

  // After Build commands are executed
  async onPostBuild({ constants, utils }) {
    const cacheDirs = getCacheDirs(constants.PUBLISH_DIR);

    if (await utils.cache.save(cacheDirs)) {
      console.log('Stored the Gatsby cache to speed up future builds.');
    } else {
      console.log('No Gatsby build found.');
    }
  },
  /*
  // Runs on build success
  onSuccess() {},
  // Runs on build error
  onError() {},
  // Runs on build error or success
  onEnd() {},
  */
}
