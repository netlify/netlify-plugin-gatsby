import fs from 'fs'
import os from 'os'
import { join } from 'path'
import process from 'process'

import { existsSync, copySync, emptyDirSync } from 'fs-extra'
// eslint-disable-next-line node/no-unpublished-import
import type { GraphQLEngine } from 'gatsby/cache-dir/query-engine'
import { link } from 'linkfs'

// Bundled with the function, but readonly
export const CACHE_DIR = join(process.cwd(), `.cache`)

// Alias in the temp directory so it's writable
export const TEMP_CACHE_DIR = join(os.tmpdir(), 'gatsby', '.cache')

/**
 * Hacks to deal with the fact that functions execute on a readonly filesystem
 */
export function prepareFilesystem() {
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
  emptyDirSync(TEMP_CACHE_DIR)
  const dir = 'data'
  if (existsSync(join(TEMP_CACHE_DIR, dir))) {
    console.log('directory already exists')
  } else {
    console.time(`Copying ${dir}`)
    copySync(join(CACHE_DIR, dir), join(TEMP_CACHE_DIR, dir))
    console.timeEnd(`Copying ${dir}`)
  }
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
  prepareFilesystem()

  // eslint-disable-next-line @typescript-eslint/no-var-requires, node/global-require
  const { GraphQLEngine: GQE } = require(join(CACHE_DIR, 'query-engine')) as {
    GraphQLEngine: typeof GraphQLEngine
  }

  const dbPath = join(TEMP_CACHE_DIR, 'data', 'datastore')

  return new GQE({
    dbPath,
  })
}
