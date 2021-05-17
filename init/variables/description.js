const { trimTitleize } = require('./trim.js')

// {{description}} template variable
const DESCRIPTION_VARIABLE = {
  name: 'description',
  description: 'Description',
  default: 'Example description',
  filter: trimTitleize,
}

module.exports = { DESCRIPTION_VARIABLE }
