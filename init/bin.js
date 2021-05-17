#!/usr/bin/env node
// eslint-disable-next-line node/shebang
const { exit } = require('process')

const yargs = require('yargs')
const filterObj = require('filter-obj')

const { init } = require('./main.js')
const { VARIABLES } = require('./variables/main.js')

// CLI entry point of `npm run init`
const runCli = async function () {
  const flags = parseFlags()
  const flagsA = filterObj(flags, isUserFlag)

  try {
    await init(flagsA)
  } catch (error) {
    console.error(`${error.message}\n`)
    exit(1)
  }
}

// Parse CLI flags
const parseFlags = function () {
  return yargs.options(FLAGS).usage(USAGE).parse()
}

// Retrieve CLI flags
const getVariablesFlags = function () {
  return Object.assign(...VARIABLES.map(getVariableFlag))
}

const getVariableFlag = function ({
  name,
  description,
  default: defaultValue,
}) {
  return {
    [name]: {
      string: true,
      describe: `${description}.\nDefault: ${defaultValue}`,
    },
  }
}

const FLAGS = {
  ...getVariablesFlags(),
}

// TODO
const USAGE = ``

// Remove `yargs`-specific options, shortcuts, dash-cased and aliases
const isUserFlag = function (key, value) {
  return (
    value !== undefined &&
    !INTERNAL_KEYS.includes(key) &&
    key.length !== 1 &&
    !key.includes('-')
  )
}

const INTERNAL_KEYS = ['help', 'version', '_', '$0']

runCli()
