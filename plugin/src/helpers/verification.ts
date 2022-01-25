import process from 'process'

import { yellowBright, redBright } from 'chalk'
import { stripIndent } from 'common-tags'
import { existsSync, promises } from 'fs-extra'
import { async as StreamZip } from 'node-stream-zip'
import { relative } from 'pathe'
import prettyBytes from 'pretty-bytes'

// 50MB, which is the documented max, though the hard max seems to be higher
// eslint-disable-next-line no-magic-numbers
export const LAMBDA_MAX_SIZE = 1024 * 1024 * 50

export const checkZipSize = async (
  file: string,
  maxSize: number = LAMBDA_MAX_SIZE,
): Promise<void> => {
  if (!existsSync(file)) {
    console.warn(`Could not check zip size because ${file} does not exist`)
    return
  }
  const fileSize = await promises.stat(file).then(({ size }) => size)
  if (fileSize < maxSize) {
    return
  }
  // We don't fail the build, because the actual hard max size is larger so it might still succeed
  console.log(
    redBright(stripIndent`
      The function zip ${yellowBright(
        relative(process.cwd(), file),
      )} size is ${prettyBytes(
      fileSize,
    )}, which is larger than the maximum supported size of ${prettyBytes(
      maxSize,
    )}.
      There are a few reasons this could happen. You may have accidentally bundled a large dependency, or you might have a
      large number of pre-rendered pages included.
    `),
  )
  const zip = new StreamZip({ file })
  console.log(`Contains ${await zip.entriesCount} files`)
  const sortedFiles = Object.values(await zip.entries()).sort(
    (entryA, entryB) => entryB.size - entryA.size,
  )

  const largest = {}
  // eslint-disable-next-line no-magic-numbers
  for (let idx = 0; idx < 10 && idx < sortedFiles.length; idx++) {
    largest[`${idx + 1}`] = {
      File: sortedFiles[idx].name,
      'Compressed Size': prettyBytes(sortedFiles[idx].compressedSize),
      'Uncompressed Size': prettyBytes(sortedFiles[idx].size),
    }
  }
  console.log(yellowBright`\n\nThese are the largest files in the zip:`)
  console.table(largest)
}
