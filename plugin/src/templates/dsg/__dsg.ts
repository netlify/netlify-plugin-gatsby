/**
 * Handler for DSG routes
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
/* eslint-enable  node/no-unpublished-import */

import {
  CACHE_DIR,
  getPagePathFromPageDataPath,
  getGraphQLEngine,
  prepareFilesystem,
} from './utils'

type PageSSR = {
  getData: typeof getDataType
  renderHTML: typeof renderHTMLType
  renderPageData: typeof renderPageDataType
}

const DATA_SUFFIX = '/page-data.json'
const DATA_PREFIX = '/page-data/'

function getHandler(): Handler {
  prepareFilesystem()
  // Requiring this dynamically so esbuild doesn't re-bundle it
  // eslint-disable-next-line @typescript-eslint/no-var-requires, node/global-require
  const { getData, renderHTML, renderPageData }: PageSSR = require(join(
    CACHE_DIR,
    'page-ssr',
  ))

  const graphqlEngine = getGraphQLEngine()

  return async function handler(event) {
    const eventPath = event.path

    const isPageData =
      eventPath.endsWith(DATA_SUFFIX) && eventPath.startsWith(DATA_PREFIX)

    const pathName = isPageData
      ? getPagePathFromPageDataPath(eventPath)
      : eventPath
    // Gatsby doesn't currently export this type. Hopefully fixed by v4 release
    const page: IGatsbyPage & { mode?: string } =
      graphqlEngine.findPageByPath(pathName)

    if (page?.mode !== 'DSG') {
      const body = await readFile(
        join(process.cwd(), 'public', '404.html'),
        'utf8',
      )

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
          'X-Mode': 'DSG',
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
        'X-Mode': 'DSG',
      },
    }
  }
}

export const handler: Handler = builder(getHandler())
