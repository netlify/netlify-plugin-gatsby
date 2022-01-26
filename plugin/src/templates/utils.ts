import fs from 'fs'
import os from 'os'
import { join } from 'path'
import process from 'process'

import { HandlerResponse } from '@netlify/functions'
import etag from 'etag'
import { existsSync, copySync, readFileSync } from 'fs-extra'
import type { GraphQLEngine } from 'gatsby/cache-dir/query-engine'
import { link } from 'linkfs'

// Alias in the temp directory so it's writable
export const TEMP_CACHE_DIR = join(os.tmpdir(), 'gatsby', '.cache')

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      _fsWrapper: typeof import('fs')
    }
  }
}

/**
 * Hacks to deal with the fact that functions execute on a readonly filesystem
 */
export function prepareFilesystem(cacheDir: string): void {
  console.log('Preparing Gatsby filesystem')
  const rewrites = [
    [join(cacheDir, 'caches'), join(TEMP_CACHE_DIR, 'caches')],
    [join(cacheDir, 'caches-lmdb'), join(TEMP_CACHE_DIR, 'caches-lmdb')],
    [join(cacheDir, 'data'), join(TEMP_CACHE_DIR, 'data')],
  ]
  // Alias the cache dir paths to the temp dir
  const lfs = link(fs, rewrites) as typeof import('fs')

  // linkfs doesn't pass across the `native` prop, which graceful-fs needs
  for (const key in lfs) {
    if (Object.hasOwnProperty.call(fs[key], 'native')) {
      lfs[key].native = fs[key].native
    }
  }
  // Gatsby uses this instead of fs if present
  // eslint-disable-next-line no-underscore-dangle
  global._fsWrapper = lfs
  const dir = 'data'
  if (!process.env.NETLIFY_LOCAL && existsSync(join(TEMP_CACHE_DIR, dir))) {
    console.log('directory already exists')
    return
  }
  console.log(`Start copying ${dir}`)
  copySync(join(cacheDir, dir), join(TEMP_CACHE_DIR, dir))
  console.log(`End copying ${dir}`)
}

// Inlined from gatsby-core-utils

export function reverseFixedPagePath(pageDataRequestPath: string): string {
  return pageDataRequestPath === `index` ? `/` : pageDataRequestPath
}

export function getPagePathFromPageDataPath(
  pageDataPath: string,
): string | null {
  const matches = pageDataPath.matchAll(
    /^\/?page-data\/(.+)\/page-data.json$/gm,
  )

  // Not sure why Gatsby does this!
  // eslint-disable-next-line no-unreachable-loop
  for (const [, requestedPagePath] of matches) {
    return reverseFixedPagePath(requestedPagePath)
  }

  return null
}

/**
 * Loads the bundled GraphQL engine from the Gatsby cache directory
 */
export function getGraphQLEngine(cacheDir: string): GraphQLEngine {
  const { GraphQLEngine: GQE } = require(join(cacheDir, 'query-engine')) as {
    GraphQLEngine: typeof GraphQLEngine
  }

  const dbPath = join(TEMP_CACHE_DIR, 'data', 'datastore')

  return new GQE({
    dbPath,
  })
}

/**
 * Gets an error page to return from a function
 */

export function getErrorResponse({
  statusCode = 500,
  error,
  renderMode,
}: {
  statusCode?: number
  error?: Error
  renderMode: 'DSG' | 'SSR'
}): HandlerResponse {
  let body = `<html><body><h1>${statusCode}</h1><p>${
    statusCode === 404 ? 'Not found' : 'Internal Server Error'
  }</p></body></html>`

  if (error) {
    console.error(error)
  }

  if (statusCode === 500 || statusCode === 404) {
    const filename = join(process.cwd(), 'public', `${statusCode}.html`)
    if (existsSync(filename)) {
      body = readFileSync(filename, 'utf8')
    }
  }
  return {
    statusCode,
    body,
    headers: {
      Tag: etag(body),
      'Content-Type': 'text/html; charset=utf-8',
      'X-Render-Mode': renderMode,
    },
  }
}
