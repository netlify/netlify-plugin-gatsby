import { default as fetch, Headers } from 'node-fetch'
import { HandlerEvent } from '@netlify/functions'
/**
 * During `netlify dev` we proxy requests to the `gatsby develop` server instead of
 * serving them ourselves.
 */
export async function proxyRequest(event: HandlerEvent, res) {
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
  ;[...response.headers.entries()].forEach(([name, value]) =>
    res.setHeader(name, value),
  )
  res.setHeader('x-forwarded-host', url.host)

  res.statusCode = response.status

  if (response.status === 302) {
    let location = response.headers.get('location') || ''
    // Local redirects will have the gatsby develop port, not the ntl dev one so we replace them
    if (location.startsWith(`http://localhost:${port}`)) {
      location = location.replace(
        `http://localhost:${port}`,
        `http://${event.headers.host}`,
      )
      res.redirect(location)
    }
  }

  res.write(await response.buffer())
  res.send()
}
