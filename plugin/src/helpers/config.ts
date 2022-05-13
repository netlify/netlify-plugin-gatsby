/* eslint-disable max-lines */
import { EOL } from 'os'
import path from 'path'
import process from 'process'

import fs, { existsSync } from 'fs-extra'
import type { GatsbyConfig, PluginRef } from 'gatsby'

import { checkPackageVersion } from './files'

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

function loadGatsbyConfig({ gatsbyRoot, utils }): GatsbyConfig | never {
  const gatsbyConfigFile = path.resolve(gatsbyRoot, 'gatsby-config.js')

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

export async function checkConfig({ utils, netlifyConfig }): Promise<void> {
  const gatsbyRoot = getGatsbyRoot(netlifyConfig.build.publish)

  // warn if gatsby-plugin-netlify is missing
  const gatsbyConfig = loadGatsbyConfig({
    utils,
    gatsbyRoot,
  })

  if (hasPlugin(gatsbyConfig.plugins, 'gatsby-plugin-netlify')) {
    if (
      !(await checkPackageVersion(
        gatsbyRoot,
        'gatsby-plugin-netlify',
        '>=4.2.0',
      ))
    ) {
      console.error(
        'The plugin `gatsby-plugin-netlify` does not support DSG, please update to >=4.2.0',
      )
    }
  } else {
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
  neededFunctions,
}): void {
  /* eslint-disable no-underscore-dangle, no-param-reassign */
  if (neededFunctions.includes('API')) {
    netlifyConfig.functions.__api = {
      included_files: [path.posix.join(compiledFunctionsDir, '**')],
      external_node_modules: ['msgpackr-extract'],
    }
  }

  if (neededFunctions.includes('DSG')) {
    netlifyConfig.functions.__dsg = {
      included_files: [
        'public/404.html',
        'public/500.html',
        path.posix.join(cacheDir, 'data', '**'),
        path.posix.join(cacheDir, 'query-engine', '**'),
        path.posix.join(cacheDir, 'page-ssr', '**'),
        '!**/*.js.map',
      ],
      external_node_modules: ['msgpackr-extract'],
      node_bundler: 'esbuild',
    }
  }

  if (neededFunctions.includes('SSR')) {
    netlifyConfig.functions.__ssr = {
      included_files: [
        'public/404.html',
        'public/500.html',
        path.posix.join(cacheDir, 'data', '**'),
        path.posix.join(cacheDir, 'query-engine', '**'),
        path.posix.join(cacheDir, 'page-ssr', '**'),
        '!**/*.js.map',
      ],
      external_node_modules: ['msgpackr-extract'],
      node_bundler: 'esbuild',
    }
  }
  /* eslint-enable no-underscore-dangle, no-param-reassign */
}

function shouldSupportFunctions(cacheDir: string) {
  if (
    process.env.NETLIFY_SKIP_GATSBY_FUNCTIONS === 'true' ||
    process.env.NETLIFY_SKIP_GATSBY_FUNCTIONS === '1'
  ) {
    console.log(
      'Skipping Gatsby Functions and SSR/DSG support because the environment variable NETLIFY_SKIP_GATSBY_FUNCTIONS is set to true',
    )
    return false
  }

  if (!existsSync(path.join(cacheDir, 'functions'))) {
    console.log(
      `Skipping Gatsby Functions and SSR/DSG support because the site's Gatsby version does not support them`,
    )
    return false
  }

  return true
}

export async function getNeededFunctions(
  cacheDir: string,
): Promise<Array<string>> {
  if (shouldSupportFunctions) {
    try {
      const skipReport = await fs.readJson(
        path.join(cacheDir, '.nf-skip-gatsby-functions'),
      )
      const funcs = Object.keys(skipReport).filter(
        (name) => skipReport[name] === true,
      )
      if (funcs.length !== 0) {
        console.log(`Enabling support for ${funcs.join('/')}`)
        return funcs
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        // no skip file
        console.log(`Enabling support for Gatsby Functions and SSR/DSG.`)
        return ['API', 'SSR', 'DSG']
      }
      console.log(
        // empty skip file (old plugin version)
        `Skipping Gatsby Functions and SSR/DSG support because gatsby-plugin-netlify reported that this site does not use them.`,
      )
    }
  }
  return []
}

export function getGatsbyRoot(publish: string): string {
  return path.resolve(path.dirname(publish))
}
/* eslint-enable max-lines */
