import { Buffer } from 'buffer'

import { Handler, HandlerResponse } from '@netlify/functions'
import { createIPXHandler } from '@netlify/ipx'

const ipxHandler = createIPXHandler({
  propsEncoding: 'base64',
  basePath: '/_gatsby/image/',
  bypassDomainCheck: true,
})

// eslint-disable-next-line require-await
export const handler: Handler = async (event, ...rest) => {
  const { pathname, host } = new URL(event.rawUrl)

  const segments = pathname.split('/')

  // newer version of Gatsby's IMAGE CDN are using query params and as-is are currently
  // not usable with ODB as it will cache solely based on path part of URL and ignore
  // query params. To workaround this we are using redirects to rewrite URL to custom
  // format which we are massaging here to ensure old IMAGE CDN url structure and
  // query params redirect are handled
  let type, encodedUrl
  if (segments.length >= 6 && segments[4] === 'image_query_compat') {
    type = 'image'

    const url = decodeURIComponent(segments[6])
    const args = decodeURIComponent(segments[5])

    // rewrite "request" path to old syntax that `@netlify/ipx` supports
    event.path = `/_gatsby/image/${Buffer.from(url, 'utf8').toString(
      'base64',
    )}/${Buffer.from(args, 'utf8').toString('base64')}`
  } else if (segments.length >= 5 && segments[4] === 'file_query_compat') {
    type = 'file'
    encodedUrl = Buffer.from(decodeURIComponent(segments[5]), 'utf8').toString(
      'base64',
    )
  } else {
    type = segments[2]
    encodedUrl = segments[3]
  }

  if (type === 'image') {
    return ipxHandler(event, ...rest) as Promise<HandlerResponse>
  }

  try {
    const urlString = Buffer.from(encodedUrl, 'base64').toString('utf8')
    // Validate it by parsing it
    const url = new URL(urlString)
    if (url.host === host) {
      return {
        statusCode: 400,
        body: 'File cannot be served from the same host as the original request',
      }
    }
    console.log(`Redirecting to ${urlString}`)
    return {
      statusCode: 301,
      headers: {
        Location: url.toString(),
      },
      body: '',
    }
  } catch (error) {
    console.error(error)
    return {
      statusCode: 400,
      body: 'Invalid request',
    }
  }
}
