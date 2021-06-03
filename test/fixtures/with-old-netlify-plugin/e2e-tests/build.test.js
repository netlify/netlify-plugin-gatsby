// eslint-disable-next-line node/no-unpublished-require
const { buildSite } = require('../../../helpers')
jest.setTimeout(60000)

describe('A site using netlify-plugin-gatsby-cache', () => {
  it('warns when running a build', async () => {
    const { logs, success } = await buildSite()
    expect(success).toBeTruthy()
    expect(logs.stderr.join('\n')).toMatch(
      "The plugin 'netlify-plugin-gatsby-cache' is no longer required and should be removed.",
    )
  })
})
