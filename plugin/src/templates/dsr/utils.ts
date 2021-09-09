import fs from 'fs'
import os from 'os'
import { join } from 'path'
import process from 'process'

import { existsSync, copySync } from 'fs-extra'
// eslint-disable-next-line node/no-unpublished-import
import type { GraphQLEngine } from 'gatsby/cache-dir/query-engine'
import { link } from 'linkfs'

// Bundled with the function, but readonly
export const CACHE_DIR = join(process.cwd(), `.cache`)

// Alias in the temp directory so it's writable
export const TEMP_CACHE_DIR = join(os.tmpdir(), 'gatsby', '.cache')

let logs = []
let fileSystemHasBeenPrepared = false

export function logtime(msg: string, start: number): void {
  const now = Date.now()
  const elapsed = now - start
  const logmsg = `${msg} ${elapsed}ms`
  console.log(logmsg)
  logs.push(logmsg)
}

export function getLogs(): string {
  const result = logs.join('\n')
  logs = []
  return result
}

/**
 * Hacks to deal with the fact that functions execute on a readonly filesystem
 */

// eslint-disable-next-line max-statements
export function prepareFilesystem(): void {
  console.log(`prepareFilesystem start`)
  if (fileSystemHasBeenPrepared) {
    console.log(`filesystem already prepared`)
    return
  }
  fileSystemHasBeenPrepared = true
  const rewrites = [
    [join(CACHE_DIR, 'caches'), join(TEMP_CACHE_DIR, 'caches')],
    [join(CACHE_DIR, 'caches-lmdb'), join(TEMP_CACHE_DIR, 'caches-lmdb')],
    [join(CACHE_DIR, 'data'), join(TEMP_CACHE_DIR, 'data')],
  ]
  // Alias the cache dir paths to the temp dir
  const lfs = link(fs, rewrites)

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
  if (existsSync(join(TEMP_CACHE_DIR, dir))) {
    console.log('directory already exists')
    return
  }
  console.log(`Start copying ${dir}`)
  copySync(join(CACHE_DIR, dir), join(TEMP_CACHE_DIR, dir))
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
export function getGraphQLEngine(): GraphQLEngine {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, node/global-require
  const { GraphQLEngine: GQE } = require(join(CACHE_DIR, 'query-engine')) as {
    GraphQLEngine: typeof GraphQLEngine
  }

  const dbPath = join(TEMP_CACHE_DIR, 'data', 'datastore')

  return new GQE({
    dbPath,
  })
}
