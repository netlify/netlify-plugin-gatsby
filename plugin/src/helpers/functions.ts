/* eslint-disable max-lines */
import { NetlifyConfig, NetlifyPluginConstants } from '@netlify/build'
import { copy, copyFile, ensureDir, existsSync, rm, writeFile } from 'fs-extra'
import { resolve, join, relative } from 'pathe'

import { makeApiHandler, makeHandler } from '../templates/handlers'

import { getGatsbyRoot } from './config'
import {
  ImageCdnImplementation,
  ImageCdnUrlSyntax,
  type PrepareImageCdnResult,
} from './image_cdn'

export type FunctionList = Array<'API' | 'SSR' | 'DSG'>

const writeFunction = async ({
  renderMode,
  handlerName,
  appDir,
  functionsSrc,
}) => {
  const source = makeHandler(appDir, renderMode)
  await ensureDir(join(functionsSrc, handlerName))
  await writeFile(join(functionsSrc, handlerName, `${handlerName}.js`), source)
  await copyFile(
    join(__dirname, '..', '..', 'lib', 'templates', 'utils.js'),
    join(functionsSrc, handlerName, 'utils.js'),
  )
}

const writeApiFunction = async ({ appDir, functionDir }) => {
  const source = makeApiHandler(appDir)
  // This is to ensure we're copying from the compiled js, not ts source
  await copy(
    join(__dirname, '..', '..', 'lib', 'templates', 'api'),
    functionDir,
  )
  await writeFile(join(functionDir, '__api.js'), source)
}

export const writeFunctions = async ({
  constants,
  netlifyConfig,
  neededFunctions,
  prepareImageCdnResult,
}: {
  constants: NetlifyPluginConstants
  netlifyConfig: NetlifyConfig
  neededFunctions: FunctionList
  prepareImageCdnResult?: PrepareImageCdnResult
}): Promise<void> => {
  const { PUBLISH_DIR, INTERNAL_FUNCTIONS_SRC } = constants
  const siteRoot = getGatsbyRoot(PUBLISH_DIR)
  const functionDir = resolve(INTERNAL_FUNCTIONS_SRC, '__api')
  const appDir = relative(functionDir, siteRoot)

  await ensureDir(INTERNAL_FUNCTIONS_SRC)

  if (neededFunctions.includes('SSR')) {
    await writeFunction({
      renderMode: 'SSR',
      handlerName: '__ssr',
      appDir,
      functionsSrc: INTERNAL_FUNCTIONS_SRC,
    })
  }

  if (neededFunctions.includes('DSG')) {
    await writeFunction({
      renderMode: 'DSG',
      handlerName: '__dsg',
      appDir,
      functionsSrc: INTERNAL_FUNCTIONS_SRC,
    })
  }

  if (
    prepareImageCdnResult &&
    prepareImageCdnResult.imageCDNImplementation !== 'NONE'
  ) {
    await setupImageCdn({ constants, netlifyConfig, prepareImageCdnResult })
  }

  if (neededFunctions.includes('API')) {
    await writeApiFunction({ appDir, functionDir })
  }
}

// eslint-disable-next-line max-lines-per-function, complexity
export const setupImageCdn = async ({
  constants,
  netlifyConfig,
  prepareImageCdnResult,
}: {
  constants: NetlifyPluginConstants
  netlifyConfig: NetlifyConfig
  prepareImageCdnResult: PrepareImageCdnResult
}) => {
  await ensureDir(join(constants.INTERNAL_FUNCTIONS_SRC, '_ipx'))
  await copy(
    join(__dirname, '..', '..', 'src', 'templates', 'ipx.ts'),
    join(constants.INTERNAL_FUNCTIONS_SRC, '_ipx', '_ipx.ts'),
    { overwrite: true },
  )

  await writeFile(
    join(constants.INTERNAL_FUNCTIONS_SRC, '_ipx', 'config.ts'),
    `exports.config = ${JSON.stringify(prepareImageCdnResult.imageCDNConfig)}`,
  )

  if (
    prepareImageCdnResult.imageCDNImplementation ===
    ImageCdnImplementation.NETLIFY_IMAGE_CDN
  ) {
    await copyFile(
      join(__dirname, '..', '..', 'src', 'templates', 'image.ts'),
      join(constants.INTERNAL_FUNCTIONS_SRC, '__image.ts'),
    )

    netlifyConfig.redirects.push(
      ...[
        // QUERY_WITH_ENCRYPTED_URL is forcefully disable when using Netlify Image CDN
        // so we don't need to handle it here
        prepareImageCdnResult.imageCDNConfig.enabledUrlPatterns.includes(
          ImageCdnUrlSyntax.QUERY,
        )
          ? {
              from: '/_gatsby/image/:unused/:unused2/:filename',
              // eslint-disable-next-line id-length
              query: { u: ':url', a: ':args', cd: ':cd' },
              to: '/.netlify/functions/__image/image_query_compat?url=:url&args=:args&cd=:cd',
              status: 301,
              force: true,
            }
          : undefined,
        prepareImageCdnResult.imageCDNConfig.enabledUrlPatterns.includes(
          ImageCdnUrlSyntax.BASE64,
        )
          ? {
              from: '/_gatsby/image/*',
              to: '/.netlify/functions/__image',
              status: 200,
              force: true,
            }
          : undefined,
      ].filter(Boolean),
    )
  } else if (
    prepareImageCdnResult.imageCDNImplementation === ImageCdnImplementation.IPX
  ) {
    netlifyConfig.redirects.push(
      // eslint-disable-next-line no-sparse-arrays
      ...[
        prepareImageCdnResult.imageCDNConfig.enabledUrlPatterns.includes(
          ImageCdnUrlSyntax.QUERY_WITH_ENCRYPTED_URL,
        )
          ? {
              from: `/_gatsby/image/:unused/:unused2/:filename`,
              // eslint-disable-next-line id-length
              query: { eu: ':encrypted_url', a: ':args' },
              to: `/.netlify/builders/_ipx/image_query_compat_eu/:args/:encrypted_url/:filename`,
              status: 301,
              force: true,
            }
          : undefined,
        prepareImageCdnResult.imageCDNConfig.enabledUrlPatterns.includes(
          ImageCdnUrlSyntax.QUERY,
        )
          ? {
              from: `/_gatsby/image/:unused/:unused2/:filename`,
              // eslint-disable-next-line id-length
              query: { u: ':url', a: ':args' },
              to: `/.netlify/builders/_ipx/image_query_compat/:args/:url/:filename`,
              status: 301,
              force: true,
            }
          : undefined,
        prepareImageCdnResult.imageCDNConfig.enabledUrlPatterns.includes(
          ImageCdnUrlSyntax.BASE64,
        )
          ? {
              from: '/_gatsby/image/*',
              to: '/.netlify/builders/_ipx',
              status: 200,
              force: true,
            }
          : undefined,
        ,
      ].filter(Boolean),
    )
  }

  netlifyConfig.redirects.push(
    ...[
      prepareImageCdnResult.imageCDNConfig.enabledUrlPatterns.includes(
        ImageCdnUrlSyntax.QUERY_WITH_ENCRYPTED_URL,
      )
        ? {
            from: `/_gatsby/file/:unused/:filename`,
            query: { eu: ':encrypted_url' },
            to: `/.netlify/functions/_ipx/file_query_compat_eu/:encrypted_url/:filename`,
            status: 301,
            force: true,
          }
        : undefined,
      prepareImageCdnResult.imageCDNConfig.enabledUrlPatterns.includes(
        ImageCdnUrlSyntax.QUERY,
      )
        ? {
            from: `/_gatsby/file/:unused/:filename`,
            // eslint-disable-next-line id-length
            query: { u: ':url' },
            to: `/.netlify/functions/_ipx/file_query_compat/:url/:filename`,
            status: 301,
            force: true,
          }
        : undefined,
      prepareImageCdnResult.imageCDNConfig.enabledUrlPatterns.includes(
        ImageCdnUrlSyntax.BASE64,
      )
        ? {
            from: '/_gatsby/file/*',
            to: '/.netlify/functions/_ipx',
            status: 200,
            force: true,
          }
        : undefined,
    ].filter(Boolean),
  )
}

export const deleteFunctions = async ({
  INTERNAL_FUNCTIONS_SRC,
}: NetlifyPluginConstants): Promise<void> => {
  for (const func of ['__api', '__ssr', '__dsg']) {
    const funcDir = resolve(INTERNAL_FUNCTIONS_SRC, func)
    if (existsSync(funcDir)) {
      await rm(funcDir, { recursive: true, force: true })
    }
  }
}
/* eslint-enable max-lines */
