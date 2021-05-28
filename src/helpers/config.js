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
