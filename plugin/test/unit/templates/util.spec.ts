import { tmpdir } from 'os'
import { join, dirname } from 'path'

import { ensureDir, existsSync, readFileSync, unlink } from 'fs-extra'

import { downloadFile } from '../../../src/templates/utils'

describe('downloadFile', () => {
  it('downloadFile can download a file', async () => {
    const url =
      'https://raw.githubusercontent.com/netlify/netlify-plugin-gatsby/cc33cf55913eca9e81f5a4c8face96312ac29ee6/plugin/manifest.yml'
    const tmpFile = join(tmpdir(), 'gatsby-test', 'downloadfile.txt')
    await ensureDir(dirname(tmpFile))
    await downloadFile(url, tmpFile)
    expect(existsSync(tmpFile)).toBeTruthy()
    expect(readFileSync(tmpFile, 'utf8')).toMatchInlineSnapshot(`
      "name: '@netlify/plugin-gatsby'
      inputs: []
      # Example inputs:
      #  - name: example
      #    description: Example description
      #    default: 5
      #    required: false
      "
    `)
    await unlink(tmpFile)
  })

  it('downloadFile throws on bad domain', async () => {
    const url = 'https://nonexistentdomain.example'
    const tmpFile = join(tmpdir(), 'gatsby-test', 'downloadfile.txt')
    await ensureDir(dirname(tmpFile))
    await expect(
      downloadFile(url, tmpFile),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"getaddrinfo ENOTFOUND nonexistentdomain.example"`,
    )
  })
})
