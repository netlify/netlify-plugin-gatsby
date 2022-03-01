import { createIPXHandler } from '@netlify/ipx'

export const handler = createIPXHandler({
  propsEncoding: 'base64',
  basePath: '/_gatsby/image/',
  bypassDomainCheck: true,
})
