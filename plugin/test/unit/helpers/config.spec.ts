import { resolve, join } from 'path'

import { copy, readJSON } from 'fs-extra'
import { dir as getTmpDir } from 'tmp-promise'
import {validate} from 'uuid'

import { createDatastoreMetadataFile } from '../../../src/helpers/config'

const SAMPLE_PROJECT_DIR = `${__dirname}/../../../../demo`

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


describe('config', () => {
  let cleanup;
  let restoreCwd;

  beforeEach(async () => {
    const tmpDir = await getTmpDir({ unsafeCleanup: true })

    restoreCwd = changeCwd(tmpDir.path)
    cleanup = tmpDir.cleanup
  })

  afterEach(async () => {
    // Cleans up the temporary directory from `getTmpDir()` and do not make it
    // the current directory anymore
    restoreCwd()
    await cleanup()
  })

  describe('createDatastoreMetadataFile', () => {
    it('successfully creates a metadata file', async () => {
      await moveGatsbyDir()
      const publishDir = resolve('public')

      await createDatastoreMetadataFile(publishDir)

      const contents = await readJSON(`${publishDir}/dataMetadata.json`)

      const {fileName } = contents;
      expect(fileName).toEqual(expect.stringContaining('data-'))
      
      const uuidId = fileName.substring(fileName.indexOf('-') + 1, fileName.indexOf('.mdb'))
      expect(validate(uuidId)).toEqual(true)
    // Longer timeout for the test is necessary due to the copying of the demo project into the tmp dir
    }, 20_000)
  })
})
