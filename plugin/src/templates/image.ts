import { Buffer } from 'buffer'

import { Handler } from '@netlify/functions'

type Event = Parameters<Handler>[0]

function generateURLFromQueryParamsPath(uParam, cdParam, argsParam) {
  const newURL = new URL('.netlify/images', 'https://example.com')
  newURL.searchParams.set('url', uParam)
  newURL.searchParams.set('cd', cdParam)

  // Parse the args parameter and add them to the new URL
  const aParams = new URLSearchParams(argsParam)
  aParams.forEach((value, key) => {
    newURL.searchParams.set(key, value)
  })

  return newURL.pathname + newURL.search
}

function generateURLFromBase64EncodedPath(path) {
  const [, , , , encodedUrl] = path.split('/')
  const sourceURL = new URL(Buffer.from(encodedUrl, 'base64').toString('utf8'))

  const newURL = new URL('.netlify/images', 'https://example.com')
  sourceURL.searchParams.forEach((value, key) => {
    newURL.searchParams.append(key, value)
  })

  const urlParam = sourceURL.origin + sourceURL.pathname
  newURL.searchParams.set('url', urlParam)

  return newURL.pathname + newURL.search
}

export const handler: Handler = async (event: Event) => {
  const queryParamPattern =
    /^\/\.netlify\/builders\/__image\/image_query_compat\?(.*)$/

  const match = event.path.match(queryParamPattern)

  let newURL

  if (match) {
    // Extract the query parameters
    const {
      url: uParam,
      cd: cdParam,
      args: argsParam,
    } = event.queryStringParameters

    newURL = await generateURLFromQueryParamsPath(uParam, cdParam, argsParam)
  } else {
    newURL = await generateURLFromBase64EncodedPath(event.path)
  }
  // Redirect to the new URL
  return {
    statusCode: 301,
    headers: {
      Location: newURL,
    },
  }
}
