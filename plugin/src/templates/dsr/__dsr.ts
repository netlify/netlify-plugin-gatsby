/**
 * Handler for DSR routes
 */

import { join } from 'path'
import process from 'process'

import { builder, Handler } from '@netlify/functions'
import etag from 'etag'
// eslint-disable-next-line import/order
import { readFile } from 'fs-extra'
/* eslint-disable  node/no-unpublished-import */
import type {
  getData as getDataType,
  renderHTML as renderHTMLType,
  renderPageData as renderPageDataType,
} from 'gatsby/cache-dir/page-ssr'
import type { IGatsbyPage } from 'gatsby/cache-dir/query-engine'

import {
  prepareFilesystem,
  CACHE_DIR,
  getPagePathFromPageDataPath,
  getGraphQLEngine,
} from './utils'
/* eslint-enable  node/no-unpublished-import */

type PageSSR = {
  getData: typeof getDataType
  renderHTML: typeof renderHTMLType
  renderPageData: typeof renderPageDataType
}

prepareFilesystem()

// Requiring this dynamically so esbuild doesn't re-bundle it
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getData, renderHTML, renderPageData }: PageSSR = require(join(
  CACHE_DIR,
  'page-ssr',
))

const DATA_SUFFIX = '/page-data.json'
const DATA_PREFIX = '/page-data/'

// eslint-disable-next-line complexity
export const handler: Handler = builder(async function handler(event) {
  const eventPath = event.path
  const isPageData =
    eventPath.endsWith(DATA_SUFFIX) && eventPath.startsWith(DATA_PREFIX)

  const pathName = isPageData
    ? getPagePathFromPageDataPath(eventPath)
    : eventPath

  const graphqlEngine = getGraphQLEngine()

  // Gatsby doesn't currently export this type. Hopefully fixed by v4 release
  const page: IGatsbyPage & { mode?: string } =
    graphqlEngine.findPageByPath(pathName)

  if (page && page.mode === `DSR`) {
    const data = await getData({
      pathName,
      graphqlEngine,
    })

    if (isPageData) {
      const body = JSON.stringify(await renderPageData({ data }))
      return {
        statusCode: 200,
        body,
        headers: {
          ETag: etag(body),
          'Content-Type': 'application/json',
          'X-Mode': 'DSR',
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
        'X-Mode': 'DSR',
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
      'X-Mode': 'DSR',
    },
  }
})
