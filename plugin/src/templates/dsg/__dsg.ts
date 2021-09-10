/**
 * Handler for DSR/DSG routes
 */

import { join } from 'path'
import process from 'process'

import { builder, Handler } from '@netlify/functions'
import etag from 'etag'
import { readFile } from 'fs-extra'
/* eslint-disable  node/no-unpublished-import */
import type {
  getData as getDataType,
  renderHTML as renderHTMLType,
  renderPageData as renderPageDataType,
} from 'gatsby/cache-dir/page-ssr'
import type { IGatsbyPage } from 'gatsby/cache-dir/query-engine'

import {
  CACHE_DIR,
  getPagePathFromPageDataPath,
  getGraphQLEngine,
  logtime,
  getLogs,
  prepareFilesystem,
} from './utils'
/* eslint-enable  node/no-unpublished-import */

prepareFilesystem()

type PageSSR = {
  getData: typeof getDataType
  renderHTML: typeof renderHTMLType
  renderPageData: typeof renderPageDataType
}

// Requiring this dynamically so esbuild doesn't re-bundle it
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getData, renderHTML, renderPageData }: PageSSR = require(join(
  CACHE_DIR,
  'page-ssr',
))

const DATA_SUFFIX = '/page-data.json'
const DATA_PREFIX = '/page-data/'

// eslint-disable-next-line complexity, max-statements
export const handler: Handler = builder(async function handler(event) {
  const start = Date.now()
  const eventPath = event.path
  logtime(`handler: start ${eventPath}`, start)

  const isPageData =
    eventPath.endsWith(DATA_SUFFIX) && eventPath.startsWith(DATA_PREFIX)

  const pathName = isPageData
    ? getPagePathFromPageDataPath(eventPath)
    : eventPath
  logtime(`handler: getGraphQLEngine start ${eventPath}`, start)
  const graphqlEngine = getGraphQLEngine()
  logtime(`handler: getGraphQLEngine end ${eventPath}`, start)
  // Gatsby doesn't currently export this type. Hopefully fixed by v4 release
  const page: IGatsbyPage & { mode?: string } =
    graphqlEngine.findPageByPath(pathName)
  logtime(`handler: findPageByPath end ${eventPath}`, start)

  if (page?.mode === `DSR` || page?.mode === `DSG`) {
    logtime(`handler: getData start ${eventPath}`, start)
    const data = await getData({
      pathName,
      graphqlEngine,
    })
    logtime(`handler: getData end ${eventPath}`, start)

    if (isPageData) {
      const body = JSON.stringify({
        ...(await renderPageData({ data })),
        logs: getLogs(),
      })
      return {
        statusCode: 200,
        body,
        headers: {
          ETag: etag(body),
          'Content-Type': 'application/json',
          'X-Mode': 'DSG',
        },
      }
    }

    const body = `${await renderHTML({ data })}\n<!-- ${getLogs()} -->`

    return {
      statusCode: 200,
      body,
      headers: {
        ETag: etag(body),
        'Content-Type': 'text/html; charset=utf-8',
        'X-Mode': 'DSG',
      },
    }
  }

  const body = await readFile(join(process.cwd(), 'public', '404.html'), 'utf8')

  return {
    statusCode: 404,
    body,
    headers: {
      Tag: etag(body),
      'Content-Type': 'text/html; charset=utf-8',
      'X-Mode': 'DSG',
    },
  }
})
