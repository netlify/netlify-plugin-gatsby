import { Buffer } from 'buffer'

import { Handler, HandlerResponse } from '@netlify/functions'
import { createIPXHandler } from '@netlify/ipx'

type Event = Parameters<Handler>[0]

const ipxHandler = createIPXHandler({
  propsEncoding: 'base64',
  basePath: '/_gatsby/image/',
  bypassDomainCheck: true,
})

const QUERY_PARAM_IMAGE_REDIRECT_URL =
  /^\/\.netlify\/builders\/_ipx\/image_query_compat\/([^/]+?)\/([^/]+?)\/([^/]+?)\/?$/i
const QUERY_PARAM_FILE_REDIRECT_URL =
  /^\/\.netlify\/functions\/_ipx\/file_query_compat\/([^/]+?)\/([^/]+?)\/?$/i

function matchRequestTypeAndArguments(event: Event):
  | {
      type: `file`
      url: string
      originalHost: string
    }
  | {
      type: `image`
      event: Event
    }
  | undefined {
  const { pathname, host } = new URL(event.rawUrl)

  const queryParamImageMatch = pathname.match(QUERY_PARAM_IMAGE_REDIRECT_URL)
  if (queryParamImageMatch) {
    const [, urlEncodedArgs, urlEncodedUrl] = queryParamImageMatch
    const base64EncodedUrl = Buffer.from(
      decodeURIComponent(urlEncodedUrl),
      'utf8',
    ).toString('base64')
    const base64EncodedArgs = Buffer.from(
      decodeURIComponent(urlEncodedArgs),
      'utf8',
    ).toString('base64')

    return {
      type: `image`,
      event: {
        ...event,
        path: `/_gatsby/image/${base64EncodedUrl}/${base64EncodedArgs}`,
      },
    }
  }

  const queryParamFileMatch = pathname.match(QUERY_PARAM_FILE_REDIRECT_URL)
  if (queryParamFileMatch) {
    const [, encodedUrl] = queryParamFileMatch
    const url = decodeURIComponent(encodedUrl)

    return {
      type: `file`,
      url,
      originalHost: host,
    }
  }

  const [, , type, encodedUrl] = pathname.split('/')
  if (type === `file`) {
    return {
      type: `file`,
      url: Buffer.from(encodedUrl, 'base64').toString('utf8'),
      originalHost: host,
    }
  }
  if (type === `image`) {
    return {
      type: `image`,
      event,
    }
  }

  // no known matching
  return undefined
}

// eslint-disable-next-line require-await
export const handler: Handler = async (event, ...rest) => {
  const requestTypeAndArgs = matchRequestTypeAndArguments(event)
  if (!requestTypeAndArgs) {
    return {
      statusCode: 400,
      body: 'Invalid request',
    }
  }

  if (requestTypeAndArgs.type === `image`) {
    return ipxHandler(
      requestTypeAndArgs.event,
      ...rest,
    ) as Promise<HandlerResponse>
  }

  try {
    const urlString = requestTypeAndArgs.url
    // Validate it by parsing it
    const url = new URL(urlString)
    if (url.host === requestTypeAndArgs.originalHost) {
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
