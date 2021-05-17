const spdxLicenseList = require('spdx-license-list')
const fuzzy = require('fuzzy')

// {{license}} template variable.
// Autocompleted from the list of valid SPDX licenses.
const LICENSE_VARIABLE = {
  type: 'autocomplete',
  name: 'license',
  description: 'Software license',
  default: 'MIT',
  async source(answers, value = '') {
    const result = fuzzy.filter(value, LICENSES)
    return result.map(({ original }) => original)
  },
}

const LICENSES = [
  // Most common licenses first
  'MIT',
  'Apache-2.0',
  'BSD-3-Clause',
  ...Object.keys(spdxLicenseList),
]

module.exports = { LICENSE_VARIABLE }
