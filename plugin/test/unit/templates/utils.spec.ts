import { tmpdir } from 'os'
import { resolve, join, dirname } from 'path'

import { copy, ensureDir, existsSync, readFileSync, unlink } from 'fs-extra'
import { dir as getTmpDir } from 'tmp-promise'

// eslint-disable-next-line import/no-namespace
import * as templateUtils from '../../../src/templates/utils'

const SAMPLE_PROJECT_DIR = `${__dirname}/../../../../demo`
const TEST_TIMEOUT = 20_000

/* eslint-disable node/prefer-global/process */
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

describe('prepareFilesystem', () => {
  let cleanup
  let restoreCwd
  let downloadFileSpy

  beforeEach(async () => {
    const tmpDir = await getTmpDir({ unsafeCleanup: true })
    restoreCwd = changeCwd(tmpDir.path)
    // eslint-disable-next-line prefer-destructuring
    cleanup = tmpDir.cleanup

    downloadFileSpy = jest
      .spyOn(templateUtils, 'downloadFile')
      .mockResolvedValue()
  })

  afterEach(async () => {
    // Cleans up the temporary directory from `getTmpDir()` and do not make it
    // the current directory anymore
    restoreCwd()
    await cleanup()

    jest.clearAllMocks()
    jest.resetAllMocks()
    jest.restoreAllMocks()
    delete process.env.LOAD_GATSBY_LMDB_DATASTORE_FROM_CDN
  })

  it(
    'downloads file from the CDN when LOAD_GATSBY_LMDB_DATASTORE_FROM_CDN is enabled',
    async () => {
      process.env.LOAD_GATSBY_LMDB_DATASTORE_FROM_CDN = 'true'
      await moveGatsbyDir()

      const cacheDir = resolve('.cache')
      await templateUtils.prepareFilesystem(cacheDir)

      expect(downloadFileSpy).toHaveBeenCalled()
    },
    TEST_TIMEOUT,
  )

  it(
    'does not download file from the CDN when LOAD_GATSBY_LMDB_DATASTORE_FROM_CDN is not enabled',
    async () => {
      process.env.LOAD_GATSBY_LMDB_DATASTORE_FROM_CDN = 'false'
      await moveGatsbyDir()

      const cacheDir = resolve('.cache')
      await templateUtils.prepareFilesystem(cacheDir)

      expect(downloadFileSpy).not.toHaveBeenCalled()
    },
    TEST_TIMEOUT,
  )

  it(
    'does not download file from the CDN when LOAD_GATSBY_LMDB_DATASTORE_FROM_CDN is undefined',
    async () => {
      await moveGatsbyDir()

      const cacheDir = resolve('.cache')
      await templateUtils.prepareFilesystem(cacheDir)

      expect(downloadFileSpy).not.toHaveBeenCalled()
    },
    TEST_TIMEOUT,
  )
})
/* eslint-enable node/prefer-global/process */

describe('downloadFile', () => {
  it('can download a file', async () => {
    const url =
      'https://raw.githubusercontent.com/netlify/netlify-plugin-gatsby/cc33cf55913eca9e81f5a4c8face96312ac29ee6/plugin/manifest.yml'
    const tmpFile = join(tmpdir(), 'gatsby-test', 'downloadfile.txt')
    await ensureDir(dirname(tmpFile))
    await templateUtils.downloadFile(url, tmpFile)
    expect(existsSync(tmpFile)).toBeTruthy()
    expect(readFileSync(tmpFile, 'utf8')).toMatchInlineSnapshot(`
      "name: '@netlify/plugin-gatsby'
      inputs: []
      # Example inputs:
      #  - name: example
      #    description: Example description
      #    default: 5
      #    required: false
      "
    `)
    await unlink(tmpFile)
  })

  it('downloadFile throws on bad domain', async () => {
    const url = 'https://nonexistentdomain.example'
    const tmpFile = join(tmpdir(), 'gatsby-test', 'downloadfile.txt')
    await ensureDir(dirname(tmpFile))
    await expect(
      templateUtils.downloadFile(url, tmpFile),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"getaddrinfo ENOTFOUND nonexistentdomain.example"`,
    )
  })
})
