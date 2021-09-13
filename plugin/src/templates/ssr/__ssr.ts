/**
 * Handler for SSR routes
 */

import { join } from 'path'
import process from 'process'

import { Handler } from '@netlify/functions'
import etag from 'etag'
import { readFile } from 'fs-extra'
/* eslint-disable  node/no-unpublished-import */
import type { GatsbyFunctionRequest } from 'gatsby'
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

type SSRReq = Pick<
  GatsbyFunctionRequest,
  'query' | 'method' | 'url' | 'headers'
>

type PageSSR = {
  getData: (
    args: Parameters<typeof getDataType>[0] & { req: SSRReq },
  ) => ReturnType<typeof getDataType>
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

// eslint-disable-next-line func-style
export const handler: Handler = async function handler(event) {
  const eventPath = event.path
  const isPageData =
    eventPath.startsWith('/page-data/') && eventPath.endsWith('/page-data.json')

  const pathName = isPageData
    ? getPagePathFromPageDataPath(eventPath)
    : eventPath

  const graphqlEngine = getGraphQLEngine()

  // Gatsby doesn't currently export this type. Hopefully fixed by v4 release
  const page: IGatsbyPage & { mode?: string } =
    graphqlEngine.findPageByPath(pathName)

  if (page?.mode !== `SSR`) {
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
        'X-Mode': 'SSR',
      },
    }
  }

  const req: SSRReq = {
    query: event.queryStringParameters,
    method: event.httpMethod,
    url: event.path,
    headers: event.headers,
  }

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
        'X-Mode': 'SSR',
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
      'X-Mode': 'SSR',
    },
  }
}
