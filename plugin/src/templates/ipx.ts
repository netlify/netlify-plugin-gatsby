import { Buffer } from 'buffer'
import { tmpdir } from 'os'
import { join } from 'path'
import { inspect } from 'util'

import { Handler, HandlerResponse } from '@netlify/functions'
import { createIPXHandler } from '@netlify/ipx'
import directoryTree from 'directory-tree'

type Event = Parameters<Handler>[0]

const myTMPDIR = tmpdir()

console.log(`init module`, { myTMPDIR })

const ipxHandler = createIPXHandler({
  cacheDir: join(myTMPDIR, 'ipx-cache'),
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
    console.log(
      inspect(
        {
          step: `before`,
          dir: myTMPDIR,
          tree: directoryTree(myTMPDIR, { attributes: ['size', 'birthtime'] }),
        },
        { depth: Number.POSITIVE_INFINITY },
      ),
    )

    const result = ipxHandler(requestTypeAndArgs.event, ...rest)

    if (!result) {
      return {
        statusCode: 500,
        body: 'No result',
      }
    }

    // eslint-disable-next-line promise/catch-or-return, promise/prefer-await-to-then, promise/always-return
    result.then(() => {
      console.log(
        inspect(
          {
            step: `after`,
            dir: myTMPDIR,
            tree: directoryTree(myTMPDIR, {
              attributes: ['size', 'birthtime'],
            }),
          },
          { depth: Number.POSITIVE_INFINITY },
        ),
      )
    })

    return result
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
