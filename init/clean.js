const { readFile, writeFile } = require('fs')
const { promisify } = require('util')

const del = require('del')
const omit = require('omit.js').default
const filterObj = require('filter-obj')

const PACKAGE_ROOT = `${__dirname}/..`
const SCRIPTS_DIR = `${PACKAGE_ROOT}/init`
const PACKAGE_JSON = `${PACKAGE_ROOT}/package.json`

const pReadFile = promisify(readFile)
const pWriteFile = promisify(writeFile)

// Remove all files, properties and logic needed by `npm run init` once
// `npm run init` is done.
const cleanRepo = async function () {
  await Promise.all([del(SCRIPTS_DIR, { force: true }), cleanPackageJson()])
}

// Remove `npm run init` in `package.json` and all `devDependencies`.
const cleanPackageJson = async function () {
  const content = await pReadFile(PACKAGE_JSON, 'utf8')
  const { scripts, dependencies, devDependencies, ...packageJson } = JSON.parse(
    content,
  )

  const scriptsA = omit(scripts, ['init'])
  const devDependenciesA = filterObj(devDependencies, shouldKeepDevDependency)
  const packageJsonA = {
    ...packageJson,
    scripts: scriptsA,
    dependencies,
    devDependencies: devDependenciesA,
  }

  const contentA = JSON.stringify(packageJsonA, null, 2)
  await pWriteFile(PACKAGE_JSON, contentA)
}

// Remove devDependencies used only for initialization
const shouldKeepDevDependency = function (key) {
  return DEV_DEPENDENCIES.includes(key)
}

const DEV_DEPENDENCIES = [
  '@netlify/build',
  'ava',
  'cross-env',
  'eslint',
  'eslint-config-prettier',
  'eslint-plugin-import',
  'eslint-plugin-node',
  'eslint-plugin-prettier',
  'execa',
  'netlify-cli',
  'prettier',
  'release-it',
]

module.exports = { cleanRepo }
