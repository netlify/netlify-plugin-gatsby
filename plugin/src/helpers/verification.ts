import process from 'process'

import { yellowBright, redBright } from 'chalk'
import { stripIndent } from 'common-tags'
import { existsSync, promises } from 'fs-extra'
import { async as StreamZip } from 'node-stream-zip'
import { relative } from 'pathe'
import prettyBytes from 'pretty-bytes'

// 50MB, which is the warning max
// eslint-disable-next-line no-magic-numbers
export const LAMBDA_WARNING_SIZE = 1024 * 1024 * 50

// 250MB, which is the hard max
// eslint-disable-next-line no-magic-numbers
export const LAMBDA_MAX_SIZE = 1024 * 1024 * 250

// eslint-disable-next-line max-statements
export const checkZipSize = async (
  file: string,
  warningSize: number = LAMBDA_WARNING_SIZE,
  maxSize: number = LAMBDA_MAX_SIZE,
): Promise<void> => {
  if (!existsSync(file)) {
    console.warn(`Could not check zip size because ${file} does not exist`)
    return
  }
  const fileSize = await promises.stat(file).then(({ size }) => size)
  if (fileSize < warningSize) {
    return
  }
  // We don't fail the build, because the actual hard max size is larger so it might still succeed
  console.log(
    yellowBright(stripIndent`
      The function zip ${blueBright(
        relative(process.cwd(), file),
      )} size is ${prettyBytes(
      fileSize,
    )}, which is larger than the recommended maximum size of ${prettyBytes(
      warningSize,
    )}. This will fail the build if the unzipped size is bigger than the maximum size of ${prettyBytes(
      maxSize.
      There are a few reasons this could happen, such as accidentally bundling a large dependency or adding lots of files to "included_files".
    `),
  )
  const zip = new StreamZip({ file })
  console.log(`Contains ${await zip.entriesCount} files`)
  const sortedFiles = Object.values(await zip.entries()).sort(
    (entryA, entryB) => entryB.size - entryA.size,
  )

  const largest = {}
  const MAX_ROWS = 10
  for (let idx = 0; idx < MAX_ROWS && idx < sortedFiles.length; idx++) {
    largest[`${idx + 1}`] = {
      File: sortedFiles[idx].name,
      'Compressed Size': prettyBytes(sortedFiles[idx].compressedSize),
      'Uncompressed Size': prettyBytes(sortedFiles[idx].size),
    }
  }
  await zip.close()
  console.log(yellowBright`\n\nThese are the largest files in the zip:`)
  console.table(largest)
}
