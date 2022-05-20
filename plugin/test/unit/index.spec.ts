/* eslint-disable max-nested-callbacks, max-lines */
import process from 'node:process'
import { join } from 'path'

import {
  NetlifyPluginRunUtilOptions,
  NetlifyPluginRunUtilResult,
} from '@netlify/build/types/options/netlify_plugin_run_util'
import Chance from 'chance'

import { onBuild, onSuccess } from '../../src/index'

jest.mock('node-fetch', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('../../src/helpers/config', () => {
  const configObj = jest.requireActual('../../src/helpers/config')

  return {
    ...configObj,
    mutateConfig: jest.fn(),
    createDatastoreMetadataFile: jest.fn(),
    spliceConfig: jest.fn(),
  }
})

jest.mock('../../src/helpers/functions', () => {
  const functionsObj = jest.requireActual('../../src/helpers/functions')

  return {
    ...functionsObj,
    writeFunctions: jest.fn(),
  }
})

jest.mock('../../src/helpers/files', () => {
  const filesObj = jest.requireActual('../../src/helpers/files')

  return {
    ...filesObj,
    patchFile: jest.fn(),
    relocateBinaries: jest.fn(),
  }
})

const chance = new Chance()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockFetchMethod = (url) => Promise.resolve()
const constants = {
  INTERNAL_FUNCTIONS_SRC: 'demo/.netlify/internal-functions',
  PUBLISH_DIR: 'demo/public',
  FUNCTIONS_DIST: 'demo/.netlify/functions',
  EDGE_HANDLERS_DIST: 'demo/.netlify/edge-functions-dist/',
  IS_LOCAL: true,
  NETLIFY_BUILD_VERSION: '9000.0.0',
  SITE_ID: chance.guid(),
}
const netlifyConfig = {
  build: {
    command: 'npm run build',
    publish: 'demo/public',
    base: '.',
    environment: {},
    services: {},
    processing: {
      css: {},
      js: {},
      html: {},
      images: {},
    },
  },
  functions: { '*': {} },
  redirects: [],
  headers: [],
  edge_handlers: [],
  plugins: [],
}

const mockRun = (
  /* eslint-disable @typescript-eslint/no-unused-vars */
  file: string,
  args?: readonly string[],
  options?: NetlifyPluginRunUtilOptions,
  /* eslint-enable @typescript-eslint/no-unused-vars */
): Promise<NetlifyPluginRunUtilResult> =>
  // eslint-disable-next-line no-void
  Promise.resolve(void 0)

mockRun.command = (
  /* eslint-disable @typescript-eslint/no-unused-vars */
  command: string,
  options?: NetlifyPluginRunUtilOptions,
  /* eslint-enable @typescript-eslint/no-unused-vars */
): Promise<NetlifyPluginRunUtilResult> =>
  // eslint-disable-next-line no-void
  Promise.resolve(void 0)

const utils = {
  build: {
    failBuild(message) {
      throw new Error(message)
    },
    failPlugin(message) {
      throw new Error(message)
    },
    cancelBuild(message) {
      throw new Error(message)
    },
  },

  run: mockRun,
  cache: {
    save: jest.fn(),
    restore: jest.fn(),
    list: jest.fn(),
    remove: jest.fn(),
    has: jest.fn(),
  },
  status: {
    show: jest.fn(),
  },
  git: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fileMatch: (globPattern: string) => [],
    modifiedFiles: [],
    createdFiles: [],
    deletedFiles: [],
    commits: [],
    linesOfCode: () => Promise.resolve(chance.number()),
  },
  functions: {
    add: jest.fn(),
    list: jest.fn(),
    listAll: jest.fn(),
  },
}

const defaultArgs = {
  netlifyConfig,
  utils,
  constants,
  packageJson: {},
  inputs: {},
}

describe('plugin', () => {
  afterEach(() => {
    jest.clearAllMocks()
    jest.resetAllMocks()
  })

  describe('onBuild', () => {
    // Importing here rather than at the top of the file allows us to import the mocked function
    // eslint-disable-next-line @typescript-eslint/no-var-requires, node/global-require
    const { createDatastoreMetadataFile } = require('../../src/helpers/config')

    it('creates the metadata file for the Gatsby datastore when LOAD_GATSBY_LMDB_DATASTORE_FROM_CDN is enabled', async () => {
      process.env.LOAD_GATSBY_LMDB_DATASTORE_FROM_CDN = 'true'
      createDatastoreMetadataFile.mockImplementation(() => Promise.resolve())

      await onBuild(defaultArgs)

      expect(createDatastoreMetadataFile).toHaveBeenCalled()
      expect(createDatastoreMetadataFile).toHaveBeenCalledWith(
        constants.PUBLISH_DIR,
      )

      delete process.env.LOAD_GATSBY_LMDB_DATASTORE_FROM_CDN
    })

    it('does not create the metadata file for the Gatsby datastore when LOAD_GATSBY_LMDB_DATASTORE_FROM_CDN is disabled', async () => {
      process.env.LOAD_GATSBY_LMDB_DATASTORE_FROM_CDN = 'false'
      createDatastoreMetadataFile.mockImplementation(() =>
        Promise.reject(
          new Error(
            'createDatastoreMetadataFile should not be called in this test',
          ),
        ),
      )

      await onBuild(defaultArgs)

      expect(createDatastoreMetadataFile).not.toHaveBeenCalled()

      delete process.env.LOAD_GATSBY_LMDB_DATASTORE_FROM_CDN
    })

    it('does not create the metadata file for the Gatsby datastore when LOAD_GATSBY_LMDB_DATASTORE_FROM_CDN is not defined', async () => {
      createDatastoreMetadataFile.mockImplementation(() =>
        Promise.reject(
          new Error(
            'createDatastoreMetadataFile should not be called in this test',
          ),
        ),
      )

      await onBuild(defaultArgs)

      expect(createDatastoreMetadataFile).not.toHaveBeenCalled()
    })
  })

  describe('onSuccess', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, node/global-require
    const fetch = require('node-fetch').default

    beforeEach(() => {
      fetch.mockImplementation(mockFetchMethod)
      process.env.LOAD_GATSBY_LMDB_DATASTORE_FROM_CDN = 'true'
      process.env.URL = chance.url()
    })

    afterEach(() => {
      delete process.env.LOAD_GATSBY_LMDB_DATASTORE_FROM_CDN
      delete process.env.URL
    })

    it('makes requests to pre-warm the lambdas if LOAD_GATSBY_LMDB_DATASTORE_FROM_CDN is enabled', async () => {
      await onSuccess()
      const controller = new globalThis.AbortController()
      expect(fetch).toHaveBeenNthCalledWith(
        1,
        join(process.env.URL, '.netlify/functions/__api'),
        { signal: controller.signal },
      )
      expect(fetch).toHaveBeenNthCalledWith(
        2,
        join(process.env.URL, '.netlify/functions/__dsg'),
        { signal: controller.signal },
      )
      expect(fetch).toHaveBeenNthCalledWith(
        3,
        join(process.env.URL, '.netlify/functions/__ssr'),
        { signal: controller.signal },
      )
    })

    it('does not make requests to pre-warm the lambdas if LOAD_GATSBY_LMDB_DATASTORE_FROM_CDN is disabled', async () => {
      process.env.LOAD_GATSBY_LMDB_DATASTORE_FROM_CDN = 'false'

      await onSuccess()

      expect(fetch).toBeCalledTimes(0)
    })

    it('does not make requests to pre-warm the lambdas if process.env.LOAD_GATSBY_LMDB_DATASTORE_FROM_CDN is not defined', async () => {
      delete process.env.LOAD_GATSBY_LMDB_DATASTORE_FROM_CDN

      await onSuccess()

      expect(fetch).toBeCalledTimes(0)
    })
  })
})
/* eslint-enable max-nested-callbacks, max-lines */
