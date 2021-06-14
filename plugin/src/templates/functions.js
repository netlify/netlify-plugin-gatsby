// @ts-check

const { default: fetch, Headers } = require('node-fetch')

/**
 * During `netlify dev` we proxy requests to the `gatsby develop` server instead of
 * serving them ourselves.
 *
 * @param {import("@netlify/functions").HandlerEvent} event
 * @returns {Promise<import("@netlify/functions").HandlerResponse>}
 */
exports.proxyRequest = async function (event) {
  // todo: get this from config
  const port = `8000`

  const url = new URL(event.path, `http://localhost:${port}`)

  Object.entries(event.multiValueQueryStringParameters).forEach(
    ([name, values]) =>
      values.forEach((value) => url.searchParams.append(name, value)),
  )

  const headers = new Headers()

  // Multi-value headers have an array of values, so we need to loop through them and append them to the Headers object
  Object.entries(event.multiValueHeaders).forEach(([name, val]) =>
    val.forEach((header) => headers.append(name, header)),
  )

  const response = await fetch(url, {
    method: event.httpMethod,
    headers,
    body: event.body,
    redirect: 'manual',
  })

  const responseHeaders = new Headers(response.headers)

  if (response.status === 302) {
    let location = responseHeaders.get('location') || ''
    // Local redirects will have the gatsby develop port, not the ntl dev one so we replace them
    if (location.startsWith(`http://localhost:${port}`)) {
      location = location.replace(
        `http://localhost:${port}`,
        `http://${event.headers.host}`,
      )
      responseHeaders.set('location', location)
    }
  }

  let body = ''

  if (response.body) {
    body = Buffer.from(await response.arrayBuffer()).toString('base64')
  }

  // We will already have decoded the fetch response, so these won't be accurate
  responseHeaders.delete('content-encoding')
  responseHeaders.delete('transfer-encoding')

  return {
    statusCode: response.status,
    isBase64Encoded: body !== '',
    body,
    multiValueHeaders: responseHeaders.raw(),
  }
}
