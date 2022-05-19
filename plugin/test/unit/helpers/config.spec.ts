import process from 'node:process'
import { resolve, join } from 'path'

import { copy, readJSON } from 'fs-extra'
import { dir as getTmpDir } from 'tmp-promise'
import { validate } from 'uuid'

import {
  createDatastoreMetadataFile,
  mutateConfig,
} from '../../../src/helpers/config'

const SAMPLE_PROJECT_DIR = `${__dirname}/../../../../demo`
const TEST_TIMEOUT = 20_000

const changeCwd = (cwd) => {
  const originalCwd = process.cwd()
  process.chdir(cwd)
  return () => {
    process.chdir(originalCwd)
  }
}

// Move gatsby project from sample project to current directory
const moveGatsbyDir = async () => {
  await copy(SAMPLE_PROJECT_DIR, join(process.cwd()))
}

/* eslint-disable no-underscore-dangle */
describe('mutateConfig', () => {
  const cacheDir = '.cache'
  const compiledFunctionsDir = `${cacheDir}/functions`
  let netlifyConfig, defaultArgs

  beforeEach(() => {
    netlifyConfig = {
      functions: {
        __api: null,
        __dsg: null,
        __ssr: null,
      },
    }
    defaultArgs = {
      netlifyConfig,
      compiledFunctionsDir,
      cacheDir,
    }
  })

  afterEach(() => {
    delete process.env.LOAD_GATSBY_LMDB_DATASTORE_FROM_CDN
  })

  it('includes the dataMetadata file containing gatsby datastore info when LOAD_GATSBY_LMDB_DATASTORE_FROM_CDN is enabled', () => {
    process.env.LOAD_GATSBY_LMDB_DATASTORE_FROM_CDN = 'true'
    mutateConfig(defaultArgs)

    expect(netlifyConfig.functions.__api).toStrictEqual({
      included_files: [`${compiledFunctionsDir}/**`],
      external_node_modules: ['msgpackr-extract'],
    })
    expect(netlifyConfig.functions.__ssr).toStrictEqual(
      netlifyConfig.functions.__dsg,
    )

    expect(netlifyConfig.functions.__dsg).toStrictEqual({
      included_files: [
        'public/404.html',
        'public/500.html',
        `${cacheDir}/query-engine/**`,
        `${cacheDir}/page-ssr/**`,
        '!**/*.js.map',
        'public/dataMetadata.json',
      ],
      external_node_modules: ['msgpackr-extract'],
      node_bundler: 'esbuild',
    })
  })

  it('does not include the dataMetadata file containing gatsby datastore info when LOAD_GATSBY_LMDB_DATASTORE_FROM_CDN is disabled and bundles datastore into lambdas', () => {
    process.env.LOAD_GATSBY_LMDB_DATASTORE_FROM_CDN = 'false'
    mutateConfig(defaultArgs)

    expect(netlifyConfig.functions.__api).toStrictEqual({
      included_files: [`${compiledFunctionsDir}/**`],
      external_node_modules: ['msgpackr-extract'],
    })
    expect(netlifyConfig.functions.__ssr).toStrictEqual(
      netlifyConfig.functions.__dsg,
    )
    expect(netlifyConfig.functions.__dsg).toStrictEqual({
      included_files: [
        'public/404.html',
        'public/500.html',
        `${cacheDir}/query-engine/**`,
        `${cacheDir}/page-ssr/**`,
        '!**/*.js.map',
        `${cacheDir}/data/**`,
      ],
      external_node_modules: ['msgpackr-extract'],
      node_bundler: 'esbuild',
    })
  })

  it('does not include the dataMetadata file containing gatsby datastore info when LOAD_GATSBY_LMDB_DATASTORE_FROM_CDN is undefined and bundles datastore into lambdas', () => {
    mutateConfig(defaultArgs)

    expect(netlifyConfig.functions.__api).toStrictEqual({
      included_files: [`${compiledFunctionsDir}/**`],
      external_node_modules: ['msgpackr-extract'],
    })
    expect(netlifyConfig.functions.__ssr).toStrictEqual(
      netlifyConfig.functions.__dsg,
    )
    expect(netlifyConfig.functions.__dsg).toStrictEqual({
      included_files: [
        'public/404.html',
        'public/500.html',
        `${cacheDir}/query-engine/**`,
        `${cacheDir}/page-ssr/**`,
        '!**/*.js.map',
        `${cacheDir}/data/**`,
      ],
      external_node_modules: ['msgpackr-extract'],
      node_bundler: 'esbuild',
    })
  })
})
/* eslint-enable no-underscore-dangle */

describe('createDatastoreMetadataFile', () => {
  let cleanup
  let restoreCwd

  beforeEach(async () => {
    const tmpDir = await getTmpDir({ unsafeCleanup: true })

    restoreCwd = changeCwd(tmpDir.path)
    // eslint-disable-next-line prefer-destructuring
    cleanup = tmpDir.cleanup
  })

  afterEach(async () => {
    // Cleans up the temporary directory from `getTmpDir()` and do not make it
    // the current directory anymore
    restoreCwd()
    await cleanup()
  })
  it(
    'successfully creates a metadata file',
    async () => {
      await moveGatsbyDir()
      const publishDir = resolve('public')

      await createDatastoreMetadataFile(publishDir)

      const contents = await readJSON(`${publishDir}/dataMetadata.json`)

      const { fileName } = contents
      expect(fileName).toEqual(expect.stringContaining('data-'))

      const uuidId = fileName.slice(
        fileName.indexOf('-') + 1,
        fileName.indexOf('.mdb'),
      )
      expect(validate(uuidId)).toEqual(true)
      // Longer timeout for the test is necessary due to the copying of the demo project into the tmp dir
    },
    TEST_TIMEOUT,
  )
})
