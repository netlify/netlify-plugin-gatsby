const { validate: validateEmail } = require('email-validator')
const execa = require('execa')

const { trim } = require('./trim.js')

// {{email}} template variable
const EMAIL_VARIABLE = {
  name: 'email',
  description: 'Author email address',
  // Try guessing current user's development email
  async default() {
    const { stdout } = await execa.command('git config user.email', {
      reject: false,
    })
    if (stdout !== '') {
      return stdout
    }

    return 'name@example.com'
  },
  filter: trim,
  validate(value) {
    if (!validateEmail(value)) {
      return 'Invalid email address'
    }
  },
}

module.exports = { EMAIL_VARIABLE }
