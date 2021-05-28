const fs = require('fs-extra')
const { EOL } = require('os')

exports.spliceConfig = async function spliceConfig({
  startMarker,
  endMarker,
  contents,
  fileName,
}) {
  await fs.ensureFile(fileName)
  const data = await fs.readFile(fileName, 'utf8')
  const [initial = '', rest = ''] = data.split(startMarker)
  const [inner, final = ''] = rest.split(endMarker)
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

  console.log({ out, data, initial, rest, inner, final })

  return fs.writeFile(fileName, out)
}
