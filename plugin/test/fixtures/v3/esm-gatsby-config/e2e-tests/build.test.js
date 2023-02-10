// eslint-disable-next-line node/no-unpublished-require
const { buildSite } = require('../../../../helpers')

jest.setTimeout(120_000)
describe('A site with "--require esm" and gatsby-config.js authored in ESM', () => {
  it('successfully builds and warns that is unable to validate gatsby-config', async () => {
    const { success, logs } = await buildSite()
    expect(success).toBeTruthy()
    expect(logs.stderr)
      .toMatch(`Could not load gatsby-config.js: Cannot use import statement outside a module

Unable to validate if 'gatsby-plugin-netlify' is setup correctly.`)
  })
})
