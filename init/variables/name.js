const { getRepo } = require('./repo.js')

// {{name}} template variable
const NAME_VARIABLE = {
  name: 'name',
  description: 'Plugin name',
  async default() {
    const repo = await getRepo()
    if (repo === undefined) {
      return 'example'
    }
    const [, repoName] = repo.split('/')
    return repoName
  },
  filter(value) {
    const valueA = value.trim()
    return NAME_DENYLIST.reduce(filterValue, valueA)
  },
  // Try to enforce netlify-plugin-* convention
  validate(value) {
    const deniedWord = NAME_DENYLIST.find((word) =>
      value.toLowerCase().includes(word),
    )
    if (deniedWord !== undefined) {
      return `Cannot contain the word ${deniedWord}`
    }
  },
}

const filterValue = function (value, word) {
  const regExp = new RegExp(`[^\\w]?${word}[^\\w]?`, 'g')
  return value.replace(regExp, '')
}

const NAME_DENYLIST = ['netlify', 'build', 'plugin', 'addon']

module.exports = { NAME_VARIABLE }
