/**
 * Handler for DSR routes
 */

import { join } from 'path'
import { builder, HandlerResponse } from '@netlify/functions'
import etag from 'etag'
// @ts-ignore From user's site
import type { IGatsbyPage } from '../../../.cache/query-engine'

import {
  prepareFilesystem,
  CACHE_DIR,
  getPagePathFromPageDataPath,
  getGraphQLEngine,
} from './utils'

prepareFilesystem()

// Requiring this dynamically so esbuild doesn't re-bundle it
const { getData, renderHTML, renderPageData } = require(join(
  CACHE_DIR,
  'page-ssr',
))

const DATA_SUFFIX = '/page-data.json'
const DATA_PREFIX = '/page-data/'

const render = async (eventPath: string): Promise<HandlerResponse> => {
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
      },
    }
  }

  return {
    statusCode: 404,
    body: `Page not found`,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  }
}

exports.handler = builder(async function handler(event, context) {
  console.log('version', process.version)
  console.log('env', process.env)
  return render(event.path)
})
