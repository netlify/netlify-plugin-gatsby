const username = require('username')
const execa = require('execa')

const { trim } = require('./trim.js')

// {{author}} template variable
const AUTHOR_VARIABLE = {
  name: 'author',
  description: 'Author name',
  // Try to guess current username
  async default() {
    const { stdout } = await execa.command('git config user.name', {
      reject: false,
    })
    if (stdout !== '') {
      return stdout
    }

    return username()
  },
  filter: trim,
}

module.exports = { AUTHOR_VARIABLE }
