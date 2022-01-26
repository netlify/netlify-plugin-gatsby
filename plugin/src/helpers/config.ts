import { EOL } from 'os'
import path from 'path'
import process from 'process'

import { stripIndent } from 'common-tags'
import fs, { existsSync } from 'fs-extra'
import type { GatsbyConfig, PluginRef } from 'gatsby'

export async function spliceConfig({
  startMarker,
  endMarker,
  contents,
  fileName,
}: {
  startMarker: string
  endMarker: string
  contents: string
  fileName: string
}): Promise<void> {
  await fs.ensureFile(fileName)
  const data = await fs.readFile(fileName, 'utf8')
  const [initial = '', rest = ''] = data.split(startMarker)
  const [, final = ''] = rest.split(endMarker)
  const out = [
    initial === EOL ? '' : initial,
    initial.endsWith(EOL) ? '' : EOL,
    startMarker,
    EOL,
    contents,
    EOL,
    endMarker,
    final.startsWith(EOL) ? '' : EOL,
    final === EOL ? '' : final,
  ]
    .filter(Boolean)
    .join('')

  return fs.writeFile(fileName, out)
}

function loadGatsbyConfig(utils): GatsbyConfig | never {
  const gatsbyConfigFile = path.resolve(process.cwd(), 'gatsby-config.js')
  if (!existsSync(gatsbyConfigFile)) {
    return {}
  }

  try {
    // eslint-disable-next-line node/global-require, @typescript-eslint/no-var-requires, import/no-dynamic-require
    return require(gatsbyConfigFile) as GatsbyConfig
  } catch (error) {
    utils.build.failBuild('Could not load gatsby-config.js', { error })
  }
}

function hasPlugin(plugins: PluginRef[], pluginName: string): boolean {
  return plugins?.some(
    (plugin) =>
      plugin &&
      (typeof plugin === 'string'
        ? plugin === pluginName
        : plugin.resolve === pluginName),
  )
}

export function checkGatsbyConfig({ utils, netlifyConfig }): void {
  // warn if gatsby-plugin-netlify is missing
  const gatsbyConfig = loadGatsbyConfig(utils)

  if (!hasPlugin(gatsbyConfig.plugins, 'gatsby-plugin-netlify')) {
    console.error(
      'Please install `gatsby-plugin-netlify` and enable it in your gatsby-config.js. https://www.gatsbyjs.com/plugins/gatsby-plugin-netlify/',
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

export function mutateConfig({
  netlifyConfig,
  compiledFunctionsDir,
  cacheDir,
}): void {
  /* eslint-disable no-underscore-dangle, no-param-reassign */
  netlifyConfig.functions.__api = {
    included_files: [path.posix.join(compiledFunctionsDir, '**')],
    external_node_modules: ['msgpackr-extract'],
  }

  netlifyConfig.functions.__dsg = {
    included_files: [
      'public/404.html',
      'public/500.html',
      path.posix.join(cacheDir, 'data', '**'),
      path.posix.join(cacheDir, 'query-engine', '**'),
      path.posix.join(cacheDir, 'page-ssr', '**'),
    ],
    external_node_modules: ['msgpackr-extract'],
    node_bundler: 'esbuild',
  }

  netlifyConfig.functions.__ssr = { ...netlifyConfig.functions.__dsg }
  /* eslint-enable no-underscore-dangle, no-param-reassign */
}

export function shouldSkipFunctions(cacheDir: string): boolean {
  if (
    process.env.NETLIFY_SKIP_GATSBY_FUNCTIONS === 'true' ||
    process.env.NETLIFY_SKIP_GATSBY_FUNCTIONS === '1'
  ) {
    console.log(
      'Skipping Gatsby Functions and SSR/DSG support because the environment variable NETLIFY_SKIP_GATSBY_FUNCTIONS is set to true',
    )
    return true
  }

  if (!existsSync(path.join(cacheDir, 'functions'))) {
    console.log(
      `Skipping Gatsby Functions and SSR/DSG support because the site's Gatsby version does not support them`,
    )
    return true
  }

  const skipFile = path.join(cacheDir, '.nf-skip-gatsby-functions')

  if (existsSync(skipFile)) {
    console.log(
      stripIndent`
      Skipping Gatsby Functions and SSR/DSG support because gatsby-plugin-netlify reported that this site does not use them. 
      If this is incorrect, remove the file "${skipFile}" and try again.`,
    )
    return true
  }

  return false
}
