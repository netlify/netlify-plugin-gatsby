import Chance from 'chance';
import {join} from 'path';
import {onSuccess} from '../../src/index'

const chance = new Chance();

describe('onSuccess', () => {
  const mockFetchMethod = (url) => {
    // return Promise.resolve(new Response('success'));
    return Promise.resolve();
  }
  
  beforeEach(() => {
    process.env.LOAD_GATSBY_LMDB_DATASTORE_FROM_CDN = 'true'
    process.env.URL = chance.url()

    globalThis.fetch = jest.fn().mockImplementation(mockFetchMethod)
  })

  afterEach(() => {
    delete globalThis.fetch
    delete process.env.LOAD_GATSBY_LMDB_DATASTORE_FROM_CDN
    delete process.env.URL
  })

  it('makes requests to pre-warm the lambdas if LOAD_GATSBY_LMDB_DATASTORE_FROM_CDN is enabled', async () => {
    await onSuccess()

    expect(globalThis.fetch).toHaveBeenNthCalledWith(1, join(process.env.URL, '.netlify/functions/__api'))
    expect(globalThis.fetch).toHaveBeenNthCalledWith(2, join(process.env.URL, '.netlify/functions/__dsg'))
    expect(globalThis.fetch).toHaveBeenNthCalledWith(3, join(process.env.URL, '.netlify/functions/__ssr'))
  })
})
