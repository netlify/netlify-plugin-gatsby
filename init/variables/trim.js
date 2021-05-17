// Trim a string and Titleize it
const trimTitleize = function (string) {
  const stringA = string.trim()

  if (stringA === '') {
    return ''
  }

  return `${stringA[0].toUpperCase()}${stringA.slice(1)}`
}

const trim = function (string) {
  return string.trim()
}

module.exports = { trimTitleize, trim }
