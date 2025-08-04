/* eslint-disable max-nested-callbacks, ava/no-import-test-files */
import process from 'process'

import type { NetlifyConfig, NetlifyPluginOptions } from '@netlify/build'
import Chance from 'chance'

import { onBuild, onSuccess } from '../../src/index'
import { enableGatsbyExcludeDatastoreFromBundle } from '../helpers'

jest.mock('../../src/helpers/config', () => {
  const configObj = jest.requireActual('../../src/helpers/config')

  return {
    ...configObj,
    mutateConfig: jest.fn(),
    createMetadataFileAndCopyDatastore: jest.fn(),
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
const constants: NetlifyPluginOptions['constants'] = {
  INTERNAL_FUNCTIONS_SRC: 'demo/.netlify/internal-functions',
  PUBLISH_DIR: 'demo/public',
  FUNCTIONS_DIST: 'demo/.netlify/functions',
  EDGE_FUNCTIONS_DIST: 'demo/.netlify/edge-functions-dist/',
  IS_LOCAL: true,
  NETLIFY_BUILD_VERSION: '9000.0.0',
  SITE_ID: chance.guid(),
  CACHE_DIR: 'demo/.netlify/cache',
}
const netlifyConfig: NetlifyConfig = {
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
  edge_functions: [],
  plugins: [],
  images: {
    remote_images: [],
  },
}

const mockRun = (
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  ...args: Parameters<NetlifyPluginOptions['utils']['run']>
): ReturnType<NetlifyPluginOptions['utils']['run']> =>
  // eslint-disable-next-line no-void
  Promise.resolve(void 0) as unknown as ReturnType<
    NetlifyPluginOptions['utils']['run']
  >

mockRun.command = (
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  ...args: Parameters<NetlifyPluginOptions['utils']['run']['command']>
): ReturnType<NetlifyPluginOptions['utils']['run']['command']> =>
  // eslint-disable-next-line no-void
  Promise.resolve(void 0) as unknown as ReturnType<
    NetlifyPluginOptions['utils']['run']['command']
  >

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
    linesOfCode: () => Promise.resolve(chance.integer()),
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
    const {
      createMetadataFileAndCopyDatastore,
    } = require('../../src/helpers/config')

    it('creates the metadata file for the Gatsby datastore when GATSBY_EXCLUDE_DATASTORE_FROM_BUNDLE is enabled', async () => {
      enableGatsbyExcludeDatastoreFromBundle()

      createMetadataFileAndCopyDatastore.mockImplementation(() =>
        Promise.resolve(),
      )

      await onBuild(defaultArgs)

      expect(createMetadataFileAndCopyDatastore).toHaveBeenCalled()
      expect(createMetadataFileAndCopyDatastore).toHaveBeenCalledWith(
        constants.PUBLISH_DIR,
        `${process.cwd()}/demo/.cache`,
      )

      delete process.env.GATSBY_EXCLUDE_DATASTORE_FROM_BUNDLE
    })

    it('does not create the metadata file for the Gatsby datastore when GATSBY_EXCLUDE_DATASTORE_FROM_BUNDLE is disabled', async () => {
      process.env.GATSBY_EXCLUDE_DATASTORE_FROM_BUNDLE = 'false'
      createMetadataFileAndCopyDatastore.mockImplementation(() =>
        Promise.reject(
          new Error(
            'createMetadataFileAndCopyDatastore should not be called in this test',
          ),
        ),
      )

      await onBuild(defaultArgs)

      expect(createMetadataFileAndCopyDatastore).not.toHaveBeenCalled()

      delete process.env.GATSBY_EXCLUDE_DATASTORE_FROM_BUNDLE
    })

    it('does not create the metadata file for the Gatsby datastore when GATSBY_EXCLUDE_DATASTORE_FROM_BUNDLE is not defined', async () => {
      createMetadataFileAndCopyDatastore.mockImplementation(() =>
        Promise.reject(
          new Error(
            'createMetadataFileAndCopyDatastore should not be called in this test',
          ),
        ),
      )

      await onBuild(defaultArgs)

      expect(createMetadataFileAndCopyDatastore).not.toHaveBeenCalled()
    })
  })

  describe('onSuccess', () => {
    const mockFetch = jest.fn()
    const originalFetch = globalThis.fetch

    beforeEach(() => {
      globalThis.fetch = mockFetch
      mockFetch.mockImplementation(mockFetchMethod)
      enableGatsbyExcludeDatastoreFromBundle()
    })

    afterEach(() => {
      globalThis.fetch = originalFetch
      jest.clearAllMocks()
      delete process.env.GATSBY_EXCLUDE_DATASTORE_FROM_BUNDLE
      delete process.env.DEPLOY_PRIME_URL
    })

    it('makes requests to pre-warm the lambdas if GATSBY_EXCLUDE_DATASTORE_FROM_BUNDLE is enabled', async () => {
      await onSuccess(defaultArgs)
      const controller = new AbortController()
      expect(fetch).toHaveBeenNthCalledWith(
        1,
        `${process.env.DEPLOY_PRIME_URL}/.netlify/functions/__api`,
        { signal: controller.signal },
      )
      expect(fetch).toHaveBeenNthCalledWith(
        2,
        `${process.env.DEPLOY_PRIME_URL}/.netlify/functions/__dsg`,
        { signal: controller.signal },
      )
      expect(fetch).toHaveBeenNthCalledWith(
        3,
        `${process.env.DEPLOY_PRIME_URL}/.netlify/functions/__ssr`,
        { signal: controller.signal },
      )
    })

    it('does not make requests to pre-warm the lambdas if GATSBY_EXCLUDE_DATASTORE_FROM_BUNDLE is disabled', async () => {
      process.env.GATSBY_EXCLUDE_DATASTORE_FROM_BUNDLE = 'false'

      await onSuccess(defaultArgs)

      expect(fetch).toBeCalledTimes(0)
    })

    it('does not make requests to pre-warm the lambdas if process.env.GATSBY_EXCLUDE_DATASTORE_FROM_BUNDLE is not defined', async () => {
      delete process.env.GATSBY_EXCLUDE_DATASTORE_FROM_BUNDLE

      await onSuccess(defaultArgs)

      expect(fetch).toBeCalledTimes(0)
    })

    it('does not make requests to pre-warm the lambdas if process.env.DEPLOY_PRIME_URL is not defined', async () => {
      delete process.env.DEPLOY_PRIME_URL

      await onSuccess(defaultArgs)

      expect(fetch).toBeCalledTimes(0)
    })
  })
})
/* eslint-enable max-nested-callbacks, ava/no-import-test-files */
