import type { Handler, HandlerEvent } from '@netlify/functions'
import { stripIndent as javascript } from 'common-tags'
import type { GatsbyFunctionRequest } from 'gatsby'
import type {
  getData as getDataType,
  renderHTML as renderHTMLType,
  renderPageData as renderPageDataType,
} from 'gatsby/cache-dir/page-ssr'
import type { IGatsbyPage } from 'gatsby/cache-dir/query-engine'

// These are "require()"d rather than imported so the symbol names are not munged,
// as we need them to match the hard-coded values
const { join } = require('path')

const etag = require('etag')

const {
  getPagePathFromPageDataPath,
  getGraphQLEngine,
  prepareFilesystem,
  getErrorResponse,
} = require('./utils')

type SSRReq = Pick<GatsbyFunctionRequest, 'query' | 'method' | 'url'> & {
  headers: HandlerEvent['headers']
}

type PageSSR = {
  getData: typeof getDataType
  renderHTML: typeof renderHTMLType
  renderPageData: typeof renderPageDataType
}

export type RenderMode = 'SSR' | 'DSG'

/**
 * Generates a Netlify function handler for Gatsby SSR or DSG.
 * It isn't used directly, but rather has `toString()` called on it to generate
 * the actual handler code, with the correct paths and render mode injected.
 */
const getHandler = (renderMode: RenderMode, appDir: string): Handler => {
  process.chdir(appDir)

  const DATA_SUFFIX = '/page-data.json'
  const DATA_PREFIX = '/page-data/'
  const cacheDir = join(appDir, '.cache')

  prepareFilesystem(cacheDir)
  // Requiring this dynamically so esbuild doesn't re-bundle it
  const { getData, renderHTML, renderPageData }: PageSSR = require(join(
    cacheDir,
    'page-ssr',
  ))

  const graphqlEngine = getGraphQLEngine(cacheDir)

  return async function handler(event: HandlerEvent) {
    // Gatsby expects cwd to be the site root
    process.chdir(appDir)
    const eventPath = event.path

    const isPageData =
      eventPath.endsWith(DATA_SUFFIX) && eventPath.startsWith(DATA_PREFIX)

    const pathName = isPageData
      ? getPagePathFromPageDataPath(eventPath)
      : eventPath
    // Gatsby doesn't currently export this type.
    const page: IGatsbyPage & { mode?: RenderMode } =
      graphqlEngine.findPageByPath(pathName)

    if (page?.mode !== renderMode) {
      return getErrorResponse({ statusCode: 404, renderMode })
    }
    const req: SSRReq =
      renderMode === 'SSR'
        ? {
            query: event.queryStringParameters,
            method: event.httpMethod,
            url: event.path,
            headers: event.headers,
          }
        : {
            query: {},
            method: 'GET',
            url: event.path,
            headers: {},
          }

    console.log(`[${req.method}] ${event.path} (${renderMode})`)

    try {
      const data = await getData({
        pathName,
        graphqlEngine,
        req,
      })
      if (isPageData) {
        const body = JSON.stringify(await renderPageData({ data }))
        return {
          statusCode: 200,
          body,
          headers: {
            ETag: etag(body),
            'Content-Type': 'application/json',
            'X-Render-Mode': renderMode,
            ...data.serverDataHeaders,
          },
        }
      }

      const body = await renderHTML({ data })

      return {
        statusCode: 200,
        body,
        headers: {
          ETag: etag(body),
          'Content-Type': 'text/html; charset=utf-8',
          'X-Render-Mode': renderMode,
          ...data.serverDataHeaders,
        },
      }
    } catch (error) {
      return getErrorResponse({ error, renderMode })
    }
  }
}

export const makeHandler = (appDir: string, renderMode: RenderMode): string =>
  // This is a string, but if you have the right editor plugin it should format as js
  javascript`
    const { readFileSync } = require('fs');
    const { builder } = require('@netlify/functions');
    const { getPagePathFromPageDataPath, getGraphQLEngine, prepareFilesystem, getErrorResponse } = require('./utils')
    const { join, resolve } = require("path");
    const etag = require('etag');
    const pageRoot = resolve(__dirname, "${appDir}");
    exports.handler = ${
      renderMode === 'DSG'
        ? `builder((${getHandler.toString()})("${renderMode}", pageRoot))`
        : `((${getHandler.toString()})("${renderMode}", pageRoot))`
    }

`
getHandler.toString()
