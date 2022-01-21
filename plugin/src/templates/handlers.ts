import type { Handler, HandlerEvent } from '@netlify/functions'
import { stripIndent as javascript } from 'common-tags'
import type { GatsbyFunctionRequest } from 'gatsby'
import type {
  getData as getDataType,
  renderHTML as renderHTMLType,
  renderPageData as renderPageDataType,
} from 'gatsby/cache-dir/page-ssr'
import type { IGatsbyPage } from 'gatsby/cache-dir/query-engine'

const { readFileSync } = require('fs')
const { join } = require('path')

const etag = require('etag')

const {
  getPagePathFromPageDataPath,
  getGraphQLEngine,
  prepareFilesystem,
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

const getHandler =
  () =>
  // eslint-disable-next-line unicorn/consistent-function-scoping
  (renderMode: RenderMode, appDir: string): Handler => {
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

    return async function handler(event) {
      process.chdir(appDir)
      const eventPath = event.path

      const isPageData =
        eventPath.endsWith(DATA_SUFFIX) && eventPath.startsWith(DATA_PREFIX)

      const pathName = isPageData
        ? getPagePathFromPageDataPath(eventPath)
        : eventPath
      // Gatsby doesn't currently export this type.
      const page: IGatsbyPage & { mode?: string } =
        graphqlEngine.findPageByPath(pathName)

      if (page?.mode !== renderMode) {
        const body = readFileSync(join(appDir, 'public', '404.html'), 'utf8')

        return {
          statusCode: 404,
          body,
          headers: {
            Tag: etag(body),
            'Content-Type': 'text/html; charset=utf-8',
            'X-Mode': 'DSG',
          },
        }
      }
      // Headers and query are not set in DSG mode
      const req: SSRReq = {
        query: {},
        method: 'GET',
        url: event.path,
        headers: {},
      }

      const data = await getData({
        pathName,
        graphqlEngine,
        req,
      })

      const headers = (page.mode === 'SSR' && data.serverDataHeaders) || {}

      if (isPageData) {
        const body = JSON.stringify(await renderPageData({ data }))
        return {
          statusCode: 200,
          body,
          headers: {
            ETag: etag(body),
            'Content-Type': 'application/json',
            'X-Mode': renderMode,
            ...headers,
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
          'X-Mode': renderMode,
          ...headers,
        },
      }
    }
  }

export const makeHandler = (
  appDir: string,
  renderMode: RenderMode,
): string => javascript`
    // @ts-check
    const { readFileSync } = require('fs');
    const { builder } = require('@netlify/functions');
    const { getPagePathFromPageDataPath, getGraphQLEngine, prepareFilesystem } = require('./utils')
    const { join, resolve } = require("path");
    const etag = require('etag');
    const pageRoot = resolve(join(__dirname, "${appDir}"));
    exports.handler = ${
      renderMode === 'DSG'
        ? `builder((${getHandler().toString()})("${renderMode}", pageRoot))`
        : `((${getHandler().toString()})("${renderMode}", pageRoot))`
    }

`
getHandler.toString()
