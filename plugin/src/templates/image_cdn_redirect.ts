import { Handler } from '@netlify/functions'

type Event = Parameters<Handler>[0]

function rewriteToNetlifyImageCdnPath(uParam, cdParam, argsParam) {
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

export const handler: Handler = async (event: Event) => {
  // Extract the query parameters
  const {
    url: uParam,
    cd: cdParam,
    args: argsParam,
  } = event.queryStringParameters

  // Construct the new URL
  const newURL = await rewriteToNetlifyImageCdnPath(uParam, cdParam, argsParam)

  // Redirect to the new URL
  return {
    statusCode: 301,
    headers: {
      Location: newURL,
    },
  }
}
