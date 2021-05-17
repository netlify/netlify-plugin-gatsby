const execa = require('execa')
const { red } = require('chalk')

const { getOptions } = require('./options.js')
const { copyFiles } = require('./copy.js')
const { applyTemplates } = require('./template.js')
const { cleanRepo } = require('./clean.js')
// const { createSite } = require('./site.js')

// `npm run init` main logic.
// Initialize/scaffold the template repository.
const init = async function (options) {
  const { variables } = await getOptions(options)

  try {
    await copyFiles()
    await applyTemplates(variables)
    await cleanRepo()
    await npmInstall()
    await execa.command('git add -A')
    await execa.command('git commit -m Init')
    // Revert changes on errors
  } catch (error) {
    console.error(red('Error: Initialization failed.'))
    await execa.command('git reset --hard')
    await npmInstall()
    throw error
  }

  // await createSite(variables)
}

const npmInstall = async function () {
  await execa.command('npm install --loglevel error --no-audit --no-fund', {
    stdio: 'inherit',
  })
}

module.exports = { init }
