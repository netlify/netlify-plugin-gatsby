// @ts-check

const path = require('path');
const fs = require('fs-extra');

const normalizedCacheDir = (PUBLISH_DIR) => (path.normalize(`${PUBLISH_DIR}/../.cache`))

const getCacheDirs = (PUBLISH_DIR) => [
  PUBLISH_DIR,
  normalizedCacheDir(PUBLISH_DIR),
];

const writeToFile = (file, string) => {
    const logStream = fs.createWriteStream(file, { flags: 'a' });

    logStream.write('# netlify-plugin-gatsby automated ignores\r\n');
    logStream.end(`${FUNCTIONS_SRC}/gatsby\r\n`);
}

const DEFAULT_FUNCTIONS_SRC = 'netlify/functions';

module.exports = {
  async onPreBuild({ constants: { PUBLISH_DIR, FUNCTIONS_SRC = DEFAULT_FUNCTIONS_SRC }, utils }) {
    try {
      // print a helpful message if the publish dir is misconfigured
      if (process.cwd() === PUBLISH_DIR) {
        utils.build.failBuild(
          `Gatsby sites must publish the public directory, but your site’s publish directory is set to “${PUBLISH_DIR}”. Please set your publish directory to your Gatsby site’s public directory.`,
        );
      }

      const cacheDirs = getCacheDirs(PUBLISH_DIR);

      if (await utils.cache.restore(cacheDirs)) {
        console.log('Found a Gatsby cache. We’re about to go FAST. ⚡️');
      } else {
        console.log('No Gatsby cache found. Building fresh.');
      }

      // warn if gatsby-plugin-netlify is missing
      const pluginName = 'gatsby-plugin-netlify';
      const gatsbyConfig = require(path.join(process.cwd(), 'gatsby-config'))
  
      if (!gatsbyConfig.plugins.some((plugin) => (typeof plugin === 'string' ? plugin === pluginName : plugin.resolve === pluginName))) {
        console.warn('Add `gatsby-plugin-netlify` to `gatsby-config` if you would like to support Gatsby redirects. 🎉');
      }
  
      // copying netlify wrapper functions into functions directory
      await fs.copy(path.join(__dirname, 'templates/'), `${FUNCTIONS_SRC}/gatsby`, {
        overwrite: false,
        errorOnExist: true,
      })

      // add gatsby functions to .gitignore
      await fs.appendFile(path.resolve('.gitignore'), `# netlify-plugin-gatsby ignores\r\n${FUNCTIONS_SRC}/gatsby\r\n`);
    } catch (error) {
      utils.build.failBuild('Error message', { error });
    }
  },

  async onBuild({
    constants: { PUBLISH_DIR, FUNCTIONS_SRC = DEFAULT_FUNCTIONS_SRC },
    utils,
  }) {
    try {
      // copying gatsby functions to functions directory
      await fs.copy(path.join(normalizedCacheDir(PUBLISH_DIR), '/functions'), `${FUNCTIONS_SRC}/gatsby/functions`, {
        overwrite: false,
        errorOnExist: true,
      })

      // path to netlify's redirects file
      const redirectsPath = path.resolve('_redirects')

      // ensure we have a _redirects file
      await fs.ensureFile(redirectsPath)

      // add redirect to _redirects file
      await fs.appendFile(redirectsPath, `# netlify-plugin-gatsby redirects\r\n/api/* /.netlify/functions/gatsby 200\r\n`);
    } catch (error) {
      utils.build.failBuild('Error message', { error });
    }
  },

  async onPostBuild({ constants: { PUBLISH_DIR }, utils }) {
    try {
      const cacheDirs = getCacheDirs(PUBLISH_DIR);

      if (await utils.cache.save(cacheDirs)) {
        console.log('Stored the Gatsby cache to speed up future builds. 🔥');
      } else {
        console.log('No Gatsby build found.');
      }
    } catch (error) {
      utils.build.failBuild('Error message', { error });
    }
  },
}
