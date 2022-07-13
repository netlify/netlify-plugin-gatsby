/* eslint-disable  @typescript-eslint/no-explicit-any */
import { resolve, join } from 'path'

import {
  copySync,
  ensureFileSync,
  readdir,
  readJSON,
  writeJSON,
} from 'fs-extra'
import { v4 as uuidv4 } from 'uuid'

import { createMetadataFileAndCopyDatastore } from '../../../src/helpers/config'

jest.mock('fs-extra')
jest.mock('uuid')

// TODO: Need proper TS types here!
const mockReadJSON = readJSON as jest.MockedFunction<any>
const mockEnsureFileSync = ensureFileSync as jest.MockedFunction<any>
const mockCopySync = copySync as jest.MockedFunction<any>
const mockWriteJSON = writeJSON as jest.MockedFunction<any>
const mockReaddir = readdir as jest.MockedFunction<any>
const mockUuidv4 = uuidv4 as jest.MockedFunction<any>

/* eslint-disable max-nested-callbacks */
/* eslint-disable max-lines-per-function */
// Only added tests for 'createMetadataFileAndCopyDatastore'
describe('createMetadataFileAndCopyDatastore', () => {
  const mockedFileName = 'fake/path/mockFilename.mdb'
  const mockDataMetdataJsonFile = {
    fileName: mockedFileName,
  }
  const publishDir = resolve('public')
  const cacheDir = resolve('.cache')

  afterEach(() => {
    mockReadJSON.mockRestore()
    mockEnsureFileSync.mockRestore()
    mockCopySync.mockRestore()
    mockWriteJSON.mockRestore()
    mockReaddir.mockRestore()
    mockUuidv4.mockRestore()
  })

  describe('when previous filename exists in cached metadata file', () => {
    beforeEach(() => {
      mockReadJSON.mockResolvedValue(mockDataMetdataJsonFile)
    })

    it('should create expected filename in published directory', async () => {
      const expectedFileName = `${publishDir}/${mockedFileName}`
      await createMetadataFileAndCopyDatastore(publishDir, cacheDir)

      expect(mockEnsureFileSync).toHaveBeenCalledWith(expectedFileName)
    })

    it('should copy cached datastore file to published directory', async () => {
      const expectedDataFile = join(`${cacheDir}/data/datastore/data.mdb`)
      const expectedFileName = `${publishDir}/${mockedFileName}`

      await createMetadataFileAndCopyDatastore(publishDir, cacheDir)

      expect(mockCopySync).toHaveBeenCalledWith(
        expectedDataFile,
        expectedFileName,
      )
    })

    it('should create expected metadata file in cached directory', async () => {
      const expectedFileName = `${cacheDir}/dataMetadata.json`

      await createMetadataFileAndCopyDatastore(publishDir, cacheDir)

      expect(mockEnsureFileSync).toHaveBeenCalledWith(expectedFileName)
    })

    it('should write expected metadata payload in cached directory', async () => {
      const expectedFileName = `${cacheDir}/dataMetadata.json`
      const expectedPayload = {
        fileName: mockedFileName,
      }

      await createMetadataFileAndCopyDatastore(publishDir, cacheDir)

      expect(mockWriteJSON).toHaveBeenCalledWith(
        expectedFileName,
        expectedPayload,
      )
    })
  })

  describe('when previous filename datastore file already exists in published directory', () => {
    const mockedDatastoreFile = 'data-test-uuid.mdb'
    const mockFilesInDirectory = ['testFile.mdb', mockedDatastoreFile]

    beforeEach(() => {
      mockReadJSON.mockResolvedValue(null)
      mockReaddir.mockResolvedValue(mockFilesInDirectory)
    })

    it('should create expected filename in published directory', async () => {
      const expectedFileName = `${publishDir}/${mockedDatastoreFile}`
      await createMetadataFileAndCopyDatastore(publishDir, cacheDir)

      expect(mockEnsureFileSync).toHaveBeenCalledWith(expectedFileName)
    })

    it('should copy cached datastore file to published directory', async () => {
      const expectedDataFile = join(`${cacheDir}/data/datastore/data.mdb`)
      const expectedFileName = `${publishDir}/${mockedDatastoreFile}`

      await createMetadataFileAndCopyDatastore(publishDir, cacheDir)

      expect(mockCopySync).toHaveBeenCalledWith(
        expectedDataFile,
        expectedFileName,
      )
    })

    it('should create expected metadata file in cached directory', async () => {
      const expectedFileName = `${cacheDir}/dataMetadata.json`

      await createMetadataFileAndCopyDatastore(publishDir, cacheDir)

      expect(mockEnsureFileSync).toHaveBeenCalledWith(expectedFileName)
    })

    it('should write expected metadata payload in cached directory', async () => {
      const expectedFileName = `${cacheDir}/dataMetadata.json`
      const expectedPayload = {
        fileName: mockedDatastoreFile,
      }

      await createMetadataFileAndCopyDatastore(publishDir, cacheDir)

      expect(mockWriteJSON).toHaveBeenCalledWith(
        expectedFileName,
        expectedPayload,
      )
    })
  })

  describe('when previous datastore file does not exist', () => {
    const mockedUuid = 'fake-uuid'
    const expectedUuidFileName = `data-${mockedUuid}.mdb`

    beforeEach(() => {
      mockReadJSON.mockResolvedValue(null)
      mockReaddir.mockResolvedValue([])
      mockUuidv4.mockReturnValue(mockedUuid)
    })

    it('should create expected filename in published directory', async () => {
      const expectedFileName = `${publishDir}/${expectedUuidFileName}`
      await createMetadataFileAndCopyDatastore(publishDir, cacheDir)

      expect(mockEnsureFileSync).toHaveBeenCalledWith(expectedFileName)
    })

    it('should copy cached datastore file to published directory', async () => {
      const expectedDataFile = join(`${cacheDir}/data/datastore/data.mdb`)
      const expectedFileName = `${publishDir}/${expectedUuidFileName}`

      await createMetadataFileAndCopyDatastore(publishDir, cacheDir)

      expect(mockCopySync).toHaveBeenCalledWith(
        expectedDataFile,
        expectedFileName,
      )
    })

    it('should create expected metadata file in cached directory', async () => {
      const expectedFileName = `${cacheDir}/dataMetadata.json`

      await createMetadataFileAndCopyDatastore(publishDir, cacheDir)

      expect(mockEnsureFileSync).toHaveBeenCalledWith(expectedFileName)
    })

    it('should write expected metadata payload in cached directory', async () => {
      const expectedFileName = `${cacheDir}/dataMetadata.json`
      const expectedPayload = {
        fileName: expectedUuidFileName,
      }

      await createMetadataFileAndCopyDatastore(publishDir, cacheDir)

      expect(mockWriteJSON).toHaveBeenCalledWith(
        expectedFileName,
        expectedPayload,
      )
    })
  })
})
/* eslint-enable max-lines-per-function */
/* eslint-enable max-nested-callbacks */
/* eslint-enable  @typescript-eslint/no-explicit-any */
