// eslint-disable-next-line node/no-unpublished-require
const { buildSite } = require('../../../../helpers')
const { readFileSync } = require('fs')

jest.setTimeout(120_000)
describe('A site using gatsby version with adapters', () => {
  it('successfully builds and disables @netlify/plugin-gatsby and gatsby-plugin-netlify', async () => {
    const {
      success,
      logs: { stdout },
    } = await buildSite()
    expect(success).toBeTruthy()

    expect(stdout).toContain(
      'Skipping @netlify/plugin-gatsby work, because used Gatsby version supports adapters.',
    )
    expect(stdout).toContain('Disabling plugin "gatsby-plugin-netlify"')

    const _redirectsContent = readFileSync('public/_redirects', 'utf8')

    expect(_redirectsContent).not.toContain(
      '# @netlify/plugin-gatsby redirects start',
    )
    expect(_redirectsContent).not.toContain(
      '## Created with gatsby-plugin-netlify',
    )
    expect(_redirectsContent).toContain('# gatsby-adapter-netlify start')
  })
})
