import { Buffer } from 'buffer'

import { Handler } from '@netlify/functions'

type Event = Parameters<Handler>[0]

function generateURLFromQueryParamsPath(uParam, cdParam, argsParam) {
  try {
    const newURL = new URL('.netlify/images', 'https://example.com')
    newURL.searchParams.set('url', uParam)
    newURL.searchParams.set('cd', cdParam)

    const aParams = new URLSearchParams(argsParam)
    aParams.forEach((value, key) => {
      newURL.searchParams.set(key, value)
    })

    return newURL.pathname + newURL.search
  } catch (error) {
    console.error('Error constructing URL:', error)
    return null
  }
}

function generateURLFromBase64EncodedPath(path) {
  const [, , , encodedUrl, encodedArgs] = path.split('/')

  const decodedUrl = Buffer.from(encodedUrl, 'base64').toString('utf8')
  const decodedArgs = Buffer.from(encodedArgs, 'base64').toString('utf8')

  let sourceURL
  try {
    sourceURL = new URL(decodedUrl)
  } catch (error) {
    console.error('Decoded string is not a valid URL:', error)
    return
  }

  const newURL = new URL('.netlify/images', 'https://example.com')
  newURL.searchParams.set('url', sourceURL.href)

  const aParams = new URLSearchParams(decodedArgs)
  aParams.forEach((value, key) => {
    newURL.searchParams.set(key, value)
  })

  return newURL.pathname + newURL.search
}

// eslint-disable-next-line require-await
export const handler: Handler = async (event: Event) => {
  const QUERY_PARAM_PATTERN =
    /^\/\.netlify\/functions\/__image\/image_query_compat\/?$/i

  const { pathname } = new URL(event.rawUrl)
  const match = pathname.match(QUERY_PARAM_PATTERN)

  let newURL

  if (match) {
    // Extract the query parameters
    const {
      url: uParam,
      cd: cdParam,
      args: argsParam,
    } = event.queryStringParameters

    newURL = generateURLFromQueryParamsPath(uParam, cdParam, argsParam)
  } else {
    newURL = generateURLFromBase64EncodedPath(pathname)
  }

  const cachingHeaders = {
    'Netlify-CDN-Cache-Control': 'public,max-age=31536000,immutable',
    'Netlify-Vary': 'query',
  }

  return newURL
    ? {
        statusCode: 301,
        headers: {
          Location: newURL,
          ...cachingHeaders,
        },
      }
    : { statusCode: 400, body: 'Invalid request', headers: cachingHeaders }
}
