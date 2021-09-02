import fs from 'fs-extra'
import { EOL } from 'os'

export async function spliceConfig({
  startMarker,
  endMarker,
  contents,
  fileName,
}: {
  startMarker: string
  endMarker: string
  contents: string
  fileName: string
}) {
  await fs.ensureFile(fileName)
  const data = await fs.readFile(fileName, 'utf8')
  const [initial = '', rest = ''] = data.split(startMarker)
  const [, final = ''] = rest.split(endMarker)
  const out = [
    initial,
    initial.endsWith(EOL) ? '' : EOL,
    startMarker,
    EOL,
    contents,
    EOL,
    endMarker,
    final.startsWith(EOL) ? '' : EOL,
    final,
  ]
    .filter(Boolean)
    .join('')

  return fs.writeFile(fileName, out)
}
