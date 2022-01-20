// eslint-disable-next-line node/no-unpublished-require
const { buildSite } = require('../../../helpers')

jest.setTimeout(60_000)
describe('A site with no functions', () => {
  it('successfully builds', async () => {
    const { success } = await buildSite()
    expect(success).toBeTruthy()
  })
})
