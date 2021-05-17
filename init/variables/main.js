const inquirer = require('inquirer')
const inquirerAutocomplete = require('inquirer-autocomplete-prompt')
const { bold } = require('chalk')

const { NAME_VARIABLE } = require('./name.js')
const { DESCRIPTION_VARIABLE } = require('./description.js')
const { AUTHOR_VARIABLE } = require('./author.js')
const { EMAIL_VARIABLE } = require('./email.js')
const { LICENSE_VARIABLE } = require('./license.js')
const { REPO_VARIABLE } = require('./repo.js')
const { NODE_VERSION_VARIABLE } = require('./node_version.js')

inquirer.registerPrompt('autocomplete', inquirerAutocomplete)

// Retrieve all template variables from either options or CLI interactive prompt
const getVariables = async function (options) {
  console.log(bold('\nWhich Netlify Build plugin would you like to create?\n'))

  const questions = VARIABLES.filter(
    ({ name }) => options[name] === undefined,
  ).map(getQuestion)
  const values = await inquirer.prompt(questions)
  const year = getCurrentYear()
  return { ...values, year }
}

// Each template variable
const VARIABLES = [
  NAME_VARIABLE,
  DESCRIPTION_VARIABLE,
  AUTHOR_VARIABLE,
  EMAIL_VARIABLE,
  LICENSE_VARIABLE,
  REPO_VARIABLE,
  NODE_VERSION_VARIABLE,
]

// Retrieve inquirer question
const getQuestion = function ({
  type = 'input',
  name,
  description,
  default: defaultValue,
  source,
  filter,
  validate,
}) {
  return {
    type,
    name,
    message: description,
    default: defaultValue,
    source,
    filter,
    validate: validateAnswer.bind(null, validate),
  }
}

// All questions are required
const validateAnswer = function (validate, value) {
  if (value === '') {
    return 'Required'
  }

  if (validate === undefined) {
    return true
  }

  const message = validate(value)
  if (message === undefined) {
    return true
  }
  return message
}

const getCurrentYear = function () {
  return String(new Date().getYear() + YEAR_BASE)
}

const YEAR_BASE = 1900

module.exports = { getVariables, VARIABLES }
