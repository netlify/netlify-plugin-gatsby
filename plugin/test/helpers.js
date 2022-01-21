const execa = require('execa')

module.exports.buildSite = async () => {
  const { exitCode, stdout, stderr } = await execa(
    'netlify',
    ['build', '--offline'],
    { reject: false },
  )
  return {
    logs: { stdout, stderr },
    success: exitCode === 0,
    severityCode: exitCode,
  }
}
