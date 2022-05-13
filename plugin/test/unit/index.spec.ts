import process from 'node:process'
import { join } from 'path'

import Chance from 'chance'

import { onSuccess } from '../../src/index'

jest.mock('node-fetch', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const chance = new Chance()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockFetchMethod = (url) => Promise.resolve()

describe('onSuccess', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, node/global-require
  const fetch = require('node-fetch').default

  beforeEach(() => {
    fetch.mockImplementation(mockFetchMethod)
    process.env.LOAD_GATSBY_LMDB_DATASTORE_FROM_CDN = 'true'
    process.env.URL = chance.url()
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.resetAllMocks()
    delete process.env.LOAD_GATSBY_LMDB_DATASTORE_FROM_CDN
    delete process.env.URL
  })

  it('makes requests to pre-warm the lambdas if LOAD_GATSBY_LMDB_DATASTORE_FROM_CDN is enabled', async () => {
    await onSuccess()

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      join(process.env.URL, '.netlify/functions/__api'),
    )
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      join(process.env.URL, '.netlify/functions/__dsg'),
    )
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      join(process.env.URL, '.netlify/functions/__ssr'),
    )
  })
})
