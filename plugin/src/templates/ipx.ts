import { Buffer } from 'buffer'
import crypto from 'crypto'

import { Handler, HandlerResponse } from '@netlify/functions'
import { createIPXHandler } from '@netlify/ipx'

/**
 * @type {import('./config').IpxWrapperConfig}
 */
import {
  config as untypedRawConfig,
  // @ts-expect-error This file is generated
} from './config'

export type EncryptionConfig = {
  IMAGE_CDN_ENCRYPTION_SECRET_KEY: string
  IMAGE_CDN_ENCRYPTION_IV: string
}

export type IMAGE_CDN_URL_PATTERN =
  | 'QUERY_WITH_ENCRYPTED_URL'
  | 'QUERY'
  | 'BASE64'
  | 'NONE'

export type ImageCDNConfig = {
  allowedRemoteUrls?: string[]
  encryptionConfig?: EncryptionConfig
  enabledUrlPatterns: IMAGE_CDN_URL_PATTERN[]
}

const rawConfig = untypedRawConfig as ImageCDNConfig

const config = {
  ...rawConfig,
  remoteUrls: rawConfig.allowedRemoteUrls?.map(
    (remoteUrl) => new RegExp(remoteUrl),
  ),
}

type Event = Parameters<Handler>[0]

const ipxHandler = createIPXHandler({
  propsEncoding: 'base64',
  basePath: '/_gatsby/image/',
  bypassDomainCheck: true,
})

function decryptUrl(url: string): string {
  if (config.encryptionConfig) {
    const key = Buffer.from(
      config.encryptionConfig.IMAGE_CDN_ENCRYPTION_SECRET_KEY,
      `hex`,
    )
    const iv = Buffer.from(
      config.encryptionConfig.IMAGE_CDN_ENCRYPTION_IV,
      `hex`,
    )

    const decipher = crypto.createDecipheriv(`aes-256-ctr`, key, iv)

    const decrypted = decipher.update(Buffer.from(url, `hex`))
    const clearText = Buffer.concat([decrypted, decipher.final()]).toString()
    const [
      // padding is delimited by a ":"
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _randomPadding,
      // urls also contain ":"
      ...urlParts
    ] = clearText.split(`:`)

    const decodedUrl = urlParts.join(`:`)

    return decodedUrl
  }

  throw new Error(`No encryption config found`)
}

const QUERY_PARAM_IMAGE_REDIRECT_URL =
  /^\/\.netlify\/builders\/_ipx\/image_query_compat(?<eu>_eu)?\/(?<args>[^/]+?)\/(?<url>[^/]+?)\/([^/]+?)\/?$/i
const QUERY_PARAM_FILE_REDIRECT_URL =
  /^\/\.netlify\/functions\/_ipx\/file_query_compat(?<eu>_eu)?\/(?<url>[^/]+?)\/([^/]+?)\/?$/i

function matchRequestTypeAndArguments(event: Event):
  | {
      type: `file`
      url: string
      originalHost: string
      urlPattern: IMAGE_CDN_URL_PATTERN
    }
  | {
      type: `image`
      url: string
      event: Event
      urlPattern: IMAGE_CDN_URL_PATTERN
    }
  | undefined {
  const { pathname, host } = new URL(event.rawUrl)

  const queryParamImageMatch = pathname.match(QUERY_PARAM_IMAGE_REDIRECT_URL)
  if (queryParamImageMatch?.groups) {
    const url = queryParamImageMatch.groups.eu
      ? decryptUrl(queryParamImageMatch.groups.url)
      : decodeURIComponent(queryParamImageMatch.groups.url)

    const base64EncodedUrl = Buffer.from(url, 'utf8').toString('base64')
    const base64EncodedArgs = Buffer.from(
      decodeURIComponent(queryParamImageMatch.groups.args),
      'utf8',
    ).toString('base64')

    return {
      type: `image`,
      url,
      event: {
        ...event,
        path: `/_gatsby/image/${base64EncodedUrl}/${base64EncodedArgs}`,
      },
      urlPattern: queryParamImageMatch.groups.eu
        ? 'QUERY_WITH_ENCRYPTED_URL'
        : 'QUERY',
    }
  }

  const queryParamFileMatch = pathname.match(QUERY_PARAM_FILE_REDIRECT_URL)
  if (queryParamFileMatch?.groups) {
    const url = queryParamFileMatch.groups.eu
      ? decryptUrl(queryParamFileMatch.groups.url)
      : decodeURIComponent(queryParamFileMatch.groups.url)

    return {
      type: `file`,
      url,
      originalHost: host,
      urlPattern: queryParamFileMatch.groups.eu
        ? 'QUERY_WITH_ENCRYPTED_URL'
        : 'QUERY',
    }
  }

  const [, , type, encodedUrl] = pathname.split('/')
  const url = Buffer.from(encodedUrl, 'base64').toString('utf8')
  if (type === `file`) {
    return {
      type: `file`,
      url,
      originalHost: host,
      urlPattern: 'BASE64',
    }
  }
  if (type === `image`) {
    return {
      type: `image`,
      url,
      event,
      urlPattern: 'BASE64',
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

  if (!config.enabledUrlPatterns.includes(requestTypeAndArgs.urlPattern)) {
    return {
      statusCode: 400,
      body: 'Invalid request',
    }
  }

  if (
    config.remoteUrls &&
    !config.remoteUrls.some((remoteUrl) =>
      remoteUrl.test(requestTypeAndArgs.url),
    )
  ) {
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
    return {
      statusCode: 400,
      body: JSON.stringify({
        msg: `Redirecting to ${requestTypeAndArgs.url} failed`,
        error,
      }),
    }
  }
}
