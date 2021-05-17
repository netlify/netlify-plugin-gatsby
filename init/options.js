const { getVariables } = require('./variables/main.js')

// Retrieve options and apply default values
const getOptions = async function (options = {}) {
  const optionsA = { ...DEFAULT_OPTIONS, ...options }
  const variables = await getVariables(optionsA)
  return { ...optionsA, variables }
}

const DEFAULT_OPTIONS = {}

module.exports = { getOptions }
