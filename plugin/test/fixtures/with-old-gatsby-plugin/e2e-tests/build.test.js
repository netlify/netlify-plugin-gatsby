// eslint-disable-next-line node/no-unpublished-require
const { buildSite } = require('../../../helpers')

jest.setTimeout(60000)

describe('A site using gatsby-plugin-netlify-cache', () => {
  it('bails when running a build', async () => {
    const { logs, success, severityCode } = await buildSite()
    expect(success).toBeFalsy()
    expect(severityCode).toEqual(2)
    expect(logs.stderr.join('\n')).toMatch(
      "The plugin 'gatsby-plugin-netlify-cache' is not compatible with the Gatsby build plugin",
    )
  })
})
