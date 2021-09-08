/* eslint-disable max-lines, complexity, max-statements, no-param-reassign */
import path, { dirname, join } from 'path'
import process from 'process'

import fs from 'fs-extra'

import { spliceConfig } from './helpers/config'

const normalizedCacheDir = (PUBLISH_DIR) =>
  path.normalize(`${PUBLISH_DIR}/../.cache`)

const getCacheDirs = (PUBLISH_DIR) => [
  PUBLISH_DIR,
  normalizedCacheDir(PUBLISH_DIR),
]

// eslint-disable-next-line no-template-curly-in-string
const lmdbCacheString = 'process.cwd(), `.cache/${cacheDbFile}`'
// eslint-disable-next-line no-template-curly-in-string
const replacement = "require('os').tmpdir(), 'gatsby', `.cache/${cacheDbFile}`"

async function patchFile(baseDir) {
  const bundleFile = join(baseDir, '.cache', 'query-engine', 'index.js')
  // eslint-disable-next-line node/no-sync
  if (!fs.existsSync(bundleFile)) {
    return
  }
  const bundle = await fs.readFile(bundleFile, 'utf8')

  //  I'm so, so sorry
  await fs.writeFile(bundleFile, bundle.replace(lmdbCacheString, replacement))
}

const DEFAULT_FUNCTIONS_SRC = 'netlify/functions'

const MAX_BUILD_IMAGE_VERSION = 16

const hasPlugin = (plugins, pluginName) =>
  plugins &&
  plugins.some(
    (plugin) =>
      plugin &&
      (typeof plugin === 'string'
        ? plugin === pluginName
        : plugin.resolve === pluginName),
  )

function loadGatsbyFile(utils) {
  const gatsbyConfigFile = path.resolve(process.cwd(), 'gatsby-config.js')
  // eslint-disable-next-line node/no-sync
  if (!fs.existsSync(gatsbyConfigFile)) {
    return {}
  }

  try {
    // eslint-disable-next-line node/global-require
    return require(gatsbyConfigFile)
  } catch (error) {
    utils.build.failBuild('Could not load gatsby-config.js', { error })
  }
}

export async function onPreBuild({
  constants: { PUBLISH_DIR },
  utils,
  netlifyConfig,
}): Promise<void> {
  // print a helpful message if the publish dir is misconfigured
  if (!PUBLISH_DIR || process.cwd() === PUBLISH_DIR) {
    utils.build.failBuild(
      `Gatsby sites must publish the public directory, but your site’s publish directory is set to “${PUBLISH_DIR}”. Please set your publish directory to your Gatsby site’s public directory.`,
    )
  }
  // Only run in CI
  if (process.env.NETLIFY) {
    console.log('Checking build image version...')
    const { stdout: ubuntuVersion } = await utils.run(`lsb_release`, ['-sr'])
    const [major] = ubuntuVersion.split('.')
    if (Number.parseInt(major) > MAX_BUILD_IMAGE_VERSION) {
      utils.build.failBuild(
        `The Gatsby build plugin does not current support building on Ubuntu ${ubuntuVersion}. Please change your build image to "Ubuntu Xenial". See https://docs.netlify.com/configure-builds/get-started/#build-image-selection`,
      )
    }
    if (process.env.AWS_LAMBDA_JS_RUNTIME !== 'nodejs14.x') {
      utils.build.failBuild(
        `The Gatsby build plugin requires AWS Lambda to be configured to use NodeJS 14.x. Please set "AWS_LAMBDA_JS_RUNTIME" to 'nodejs14.x' in the site UI (not netlify.toml). See https://docs.netlify.com/functions/build-with-javascript/#runtime-settings`,
      )
    }
  }

  const cacheDirs = getCacheDirs(PUBLISH_DIR)

  if (await utils.cache.restore(cacheDirs)) {
    console.log('Found a Gatsby cache. We’re about to go FAST. ⚡️')
  } else {
    console.log('No Gatsby cache found. Building fresh.')
  }

  // warn if gatsby-plugin-netlify is missing
  const pluginName = 'gatsby-plugin-netlify'
  const gatsbyConfig = loadGatsbyFile(utils)

  if (!hasPlugin(gatsbyConfig.plugins, pluginName)) {
    console.warn(
      'Install `gatsby-plugin-netlify` if you would like to support Gatsby redirects. https://www.gatsbyjs.com/plugins/gatsby-plugin-netlify/',
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
      (plugin) => plugin && plugin.package === 'netlify-plugin-gatsby-cache',
    )
  ) {
    console.warn(
      "The plugin 'netlify-plugin-gatsby-cache' is no longer required and should be removed.",
    )
  }
}

export async function onBuild({
  constants: {
    PUBLISH_DIR,
    FUNCTIONS_SRC = DEFAULT_FUNCTIONS_SRC,
    INTERNAL_FUNCTIONS_SRC,
  },
  netlifyConfig,
}) {
  const CACHE_DIR = normalizedCacheDir(PUBLISH_DIR)
  const compiledFunctions = path.join(CACHE_DIR, '/functions')
  // eslint-disable-next-line node/no-sync
  if (!fs.existsSync(compiledFunctions)) {
    return
  }

  const functionsSrcDir = INTERNAL_FUNCTIONS_SRC || FUNCTIONS_SRC

  // copying Netlify wrapper function into functions directory

  await Promise.all(
    ['api', 'dsr', 'ssr'].map((func) =>
      fs.copy(
        path.join(__dirname, '..', 'src', 'templates', func),
        path.join(functionsSrcDir, `__${func}`),
      ),
    ),
  )

  if (
    INTERNAL_FUNCTIONS_SRC &&
    // eslint-disable-next-line node/no-sync
    fs.existsSync(path.join(FUNCTIONS_SRC, 'gatsby'))
  ) {
    console.log(`
Detected the function "${path.join(
      FUNCTIONS_SRC,
      'gatsby',
    )}" that seem to have been generated by an old version of the Essential Gatsby plugin. 
The plugin no longer uses this and it should be deleted to avoid conflicts.\n`)
  }

  /* eslint-disable no-underscore-dangle */
  netlifyConfig.functions.__api = {
    included_files: [path.posix.join(compiledFunctions, '**')],
    external_node_modules: ['msgpackr-extract'],
  }

  netlifyConfig.functions.__dsr = {
    included_files: [
      path.posix.resolve(process.cwd(), 'public', '404.html'),
      path.posix.join(CACHE_DIR, 'data', '**'),
      path.posix.join(CACHE_DIR, 'query-engine', '**'),
      path.posix.join(CACHE_DIR, 'page-ssr', '**'),
    ],
    external_node_modules: ['msgpackr-extract'],
  }

  netlifyConfig.functions.__ssr = { ...netlifyConfig.functions.__dsr }

  /* eslint-enable no-underscore-dangle */

  await spliceConfig({
    startMarker: '# @netlify/plugin-gatsby start',
    endMarker: '# @netlify/plugin-gatsby end',
    contents: `GATSBY_PRECOMPILE_DEVELOP_FUNCTIONS=true`,
    fileName: path.posix.resolve(
      path.posix.join(PUBLISH_DIR, '..', '.env.development'),
    ),
  })

  const root = dirname(netlifyConfig.build.publish)
  await patchFile(root)

  // Editing _redirects to it works with ntl dev
  spliceConfig({
    startMarker: '# @netlify/plugin-gatsby redirects start',
    endMarker: '# @netlify/plugin-gatsby redirects end',
    contents: '/api/* /.netlify/functions/__api 200',
    fileName: join(netlifyConfig.build.publish, '_redirects'),
  })

  netlifyConfig.redirects.push({
    from: '/*',
    to: '/.netlify/functions/__dsr',
    status: 200,
  })
}

export async function onPostBuild({
  constants: { PUBLISH_DIR },
  utils,
}): Promise<void> {
  const cacheDirs = getCacheDirs(PUBLISH_DIR)

  if (await utils.cache.save(cacheDirs)) {
    utils.status.show({
      title: 'Essential Gatsby Build Plugin ran successfully',
      summary: 'Stored the Gatsby cache to speed up future builds. 🔥',
    })
  } else {
    console.log('No Gatsby build found.')
  }
}
/* eslint-enable max-lines, complexity, max-statements, no-param-reassign */
