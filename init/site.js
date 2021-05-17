const execa = require('execa')
const { bold } = require('chalk')
const stripAnsi = require('strip-ansi')

const { getRepo } = require('./variables/repo.js')
const { applyTemplates } = require('./template.js')

// Create a Netlify Site for the new repository
const createSite = async function ({ name }) {
  try {
    console.log(bold(`\nCreating a new Netlify Site...\n`))
    await login()
    const username = await getUsername()
    const siteId = await createNewSite(name, username)
    await applyTemplates({ siteId, username })
  } catch (error) {
    throw new Error(
      `Could not create a new Netlify Site.
Please create it manually on https://app.netlify.com/sites/
${error.message}`,
    )
  }
}

// Login to Netlify, if needed
const login = async function () {
  if (await isLoggedIn(false)) {
    return
  }

  await execa.command('netlify login', { stdio: 'inherit' })

  await isLoggedIn(true)
}

const isLoggedIn = async function (reject) {
  const { failed } = await execa.command(
    'netlify api getCurrentUser --data {}',
    { reject },
  )
  return !failed
}

// Retrieve GitHub username
const getUsername = async function () {
  const repo = await getRepo()
  if (repo === undefined) {
    return
  }
  const [username] = repo.split('/')
  return username
}

// Create a new Netlify Site, if needed
const createNewSite = async function (name, username) {
  const { all } = await execa.command('netlify status', { all: true })
  const result = getSiteId(all)
  if (result.siteId !== undefined) {
    return result.siteId
  }

  const accountSlug = getAccountSlug(username)
  const {
    all: allA,
  } = await execa.command(
    `netlify sites:create --name netlify-plugin-${name} ${accountSlug}`,
    { all: true },
  )
  const siteId = getSiteId(allA)
  if (siteId === undefined) {
    throw new Error(allA)
  }

  await execa.command(`netlify link --id ${siteId}`, { stdio: 'inherit' })

  return siteId
}

const getSiteId = function (all) {
  const results = SITE_ID_REGEXP.exec(stripAnsi(all))
  if (results === null) {
    return { all }
  }
  const [, siteId] = results
  return { siteId }
}

const SITE_ID_REGEXP = /Site Id:\s+(.+)/i

const getAccountSlug = function (username) {
  if (username === undefined) {
    return ''
  }
  return `--account-slug=${username}`
}

module.exports = { createSite }
