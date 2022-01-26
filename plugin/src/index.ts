import path, { dirname, join } from 'path'
import process from 'process'

import { NetlifyPluginOptions } from '@netlify/build'
import { stripIndent } from 'common-tags'
import { existsSync, readFile, writeFile } from 'fs-extra'

import { normalizedCacheDir, restoreCache, saveCache } from './helpers/cache'
import {
  checkGatsbyConfig,
  mutateConfig,
  shouldSkipFunctions,
  spliceConfig,
} from './helpers/config'
import { deleteFunctions, writeFunctions } from './helpers/functions'
import { checkZipSize } from './helpers/verification'

/**
 * This horrible thing is required because Gatsby tries to use a cache file in location that is readonly when deployed to a lambda
 */
async function patchFile(baseDir): Promise<void> {
  /* eslint-disable no-template-curly-in-string */
  const lmdbCacheString = 'process.cwd(), `.cache/${cacheDbFile}`'
  const replacement =
    "require('os').tmpdir(), 'gatsby', `.cache/${cacheDbFile}`"
  /* eslint-enable no-template-curly-in-string */

  const bundleFile = join(baseDir, '.cache', 'query-engine', 'index.js')
  if (!existsSync(bundleFile)) {
    return
  }
  const bundle = await readFile(bundleFile, 'utf8')
  await writeFile(bundleFile, bundle.replace(lmdbCacheString, replacement))
}

const DEFAULT_FUNCTIONS_SRC = 'netlify/functions'

export async function onPreBuild({
  constants: { PUBLISH_DIR },
  utils,
  netlifyConfig,
}): Promise<void> {
  // Print a helpful message if the publish dir is misconfigured
  if (!PUBLISH_DIR || process.cwd() === PUBLISH_DIR) {
    utils.build.failBuild(
      `Gatsby sites must publish the "public" directory, but your site’s publish directory is set to “${PUBLISH_DIR}”. Please set your publish directory to your Gatsby site’s "public" directory.`,
    )
  }
  await restoreCache({ utils, publish: PUBLISH_DIR })

  checkGatsbyConfig({ utils, netlifyConfig })
}

export async function onBuild({
  constants,
  netlifyConfig,
}: NetlifyPluginOptions): Promise<void> {
  const {
    PUBLISH_DIR,
    FUNCTIONS_SRC = DEFAULT_FUNCTIONS_SRC,
    INTERNAL_FUNCTIONS_SRC,
  } = constants
  const cacheDir = normalizedCacheDir(PUBLISH_DIR)

  if (
    INTERNAL_FUNCTIONS_SRC &&
    existsSync(path.join(FUNCTIONS_SRC, 'gatsby'))
  ) {
    console.log(stripIndent`
    Detected the function "${path.join(
      FUNCTIONS_SRC,
      'gatsby',
    )}" that seem to have been generated by an old version of the Essential Gatsby plugin. 
The plugin no longer uses this and it should be deleted to avoid conflicts.\n`)
  }

  if (shouldSkipFunctions(cacheDir)) {
    await deleteFunctions(constants)
    return
  }
  const compiledFunctionsDir = path.join(cacheDir, '/functions')

  await writeFunctions(constants)

  mutateConfig({ netlifyConfig, cacheDir, compiledFunctionsDir })

  const root = dirname(netlifyConfig.build.publish)
  await patchFile(root)

  // Editing _redirects so it works with ntl dev
  spliceConfig({
    startMarker: '# @netlify/plugin-gatsby redirects start',
    endMarker: '# @netlify/plugin-gatsby redirects end',
    contents: '/api/* /.netlify/functions/__api 200',
    fileName: join(netlifyConfig.build.publish, '_redirects'),
  })

  netlifyConfig.redirects.push({
    from: '/*',
    to: '/.netlify/builders/__dsg',
    status: 200,
  })
}

export async function onPostBuild({
  constants: { PUBLISH_DIR, FUNCTIONS_DIST },
  utils,
}): Promise<void> {
  await saveCache({ publish: PUBLISH_DIR, utils })
  for (const func of ['api', 'dsg', 'ssr']) {
    await checkZipSize(path.join(FUNCTIONS_DIST, `__${func}.zip`))
  }
}
