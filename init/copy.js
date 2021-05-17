const cpy = require('cpy')

const PACKAGE_ROOT = `${__dirname}/..`

// Copy some files during initialization
const copyFiles = async function () {
  const files = FILES.map((file) => `${__dirname}/${file}`)
  await cpy(files, PACKAGE_ROOT)
}

const FILES = ['README.md']

module.exports = { copyFiles }
