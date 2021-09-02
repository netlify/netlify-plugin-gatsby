import { default as fetch, Headers } from 'node-fetch'
import {
  HandlerEvent,
  HandlerResponse,
  HandlerContext,
} from '@netlify/functions'
import type { GatsbyFunctionResponse } from 'gatsby'
import type { OutgoingHttpHeaders } from 'http'
import { GatsbyFunctionRequest } from 'gatsby'
import Stream from 'stream'
import type { Socket } from 'net'
import http from 'http'
import cookie from 'cookie'

interface NetlifyFunctionParams {
  event: HandlerEvent
  context: HandlerContext
}

// Gatsby Function 🤝 Netlify Function
export interface AugmentedGatsbyFunctionRequest extends GatsbyFunctionRequest {
  multiValueQuery?: HandlerEvent['multiValueQueryStringParameters']
  netlifyFunctionParams?: NetlifyFunctionParams
  getHeader: (name: string) => string | string[]
  getHeaders: () => http.IncomingHttpHeaders
  originalUrl: string
  connection: Socket
  files?: Express.Multer.File[]
}

// Mock a HTTP IncomingMessage object from the Netlify Function event parameters
// Based on API Gateway Lambda Compat
// Source: https://github.com/serverless-nextjs/serverless-next.js/blob/master/packages/compat-layers/apigw-lambda-compat/lib/compatLayer.js

export function createRequestObject({
  event,
  context,
}: NetlifyFunctionParams): AugmentedGatsbyFunctionRequest {
  const {
    rawUrl = {},
    path = '',
    multiValueQueryStringParameters,
    queryStringParameters,
    httpMethod,
    multiValueHeaders = {},
    body,
    isBase64Encoded,
  } = event

  const newStream = new Stream.Readable()
  const req = Object.assign(
    newStream,
    http.IncomingMessage.prototype,
  ) as Partial<AugmentedGatsbyFunctionRequest>
  req.url = path
  req.originalUrl = req.url

  req.query = queryStringParameters
  req.multiValueQuery = multiValueQueryStringParameters

  req.method = httpMethod
  req.rawHeaders = []
  req.headers = {}

  // Expose Netlify Function event and context on request object.

  req.netlifyFunctionParams = { event, context }

  for (const key of Object.keys(multiValueHeaders)) {
    for (const value of multiValueHeaders[key]) {
      req.rawHeaders.push(key)
      req.rawHeaders.push(value)
    }
    req.headers[key.toLowerCase()] = multiValueHeaders[key].toString()
  }

  req.getHeader = (name) => {
    return req.headers[name.toLowerCase()]
  }
  req.getHeaders = () => {
    return req.headers
  }

  // Gatsby includes cookie middleware

  const cookies = req.headers.cookie

  if (cookies) {
    req.cookies = cookie.parse(cookies)
  }

  // req.connection = {}

  if (body) {
    req.push(body, isBase64Encoded ? 'base64' : undefined)
  }

  req.push(null)

  return req as AugmentedGatsbyFunctionRequest
}

export interface AugmentedGatsbyFunctionResponse<T = any>
  extends GatsbyFunctionResponse<T> {
  headers: OutgoingHttpHeaders
  writableEnded: boolean
  multiValueHeaders: string | number | boolean
}

/**
 * We futz around a bit with the Netlify function response during execution
 */
interface IntermediateHandlerResponse
  extends Partial<Omit<HandlerResponse, 'body'>> {
  body?: string | Buffer
  multiValueHeaders?: Record<string, Array<string | string | boolean>>
}

// Mock a HTTP ServerResponse object that returns a Netlify Function-compatible
// response via the onResEnd callback when res.end() is called.
// Based on API Gateway Lambda Compat
// Source: https://github.com/serverless-nextjs/serverless-next.js/blob/master/packages/compat-layers/apigw-lambda-compat/lib/compatLayer.js

export function createResponseObject({ onResEnd }) {
  const response: IntermediateHandlerResponse = {
    isBase64Encoded: true,
    multiValueHeaders: {},
  }

  const res = new Stream() as AugmentedGatsbyFunctionResponse
  Object.defineProperty(res, 'statusCode', {
    get() {
      return response.statusCode
    },
    set(statusCode) {
      response.statusCode = statusCode
    },
  })
  res.headers = { 'content-type': 'text/plain; charset=utf-8' }

  res.writeHead = (status, headers) => {
    response.statusCode = status
    if (headers) {
      res.headers = Object.assign(res.headers, headers)
    }

    // Return res object to allow for chaining
    // Fixes: https://github.com/netlify/next-on-netlify/pull/74
    return res
  }

  res.write = (chunk): boolean => {
    if (!response.body) {
      response.body = Buffer.from('')
    }

    response.body = Buffer.concat([
      Buffer.isBuffer(response.body)
        ? response.body
        : Buffer.from(response.body),
      Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk),
    ])
    return true
  }
  res.setHeader = (name, value: string | number | string[]) => {
    res.headers[name.toLowerCase()] = value
    return res
  }
  res.removeHeader = (name) => {
    delete res.headers[name.toLowerCase()]
  }
  res.getHeader = (name) => {
    return res.headers[name.toLowerCase()]
  }
  res.getHeaders = () => {
    return res.headers
  }
  res.hasHeader = (name) => {
    return !!res.getHeader(name)
  }
  res.end = (text) => {
    if (text) res.write(text)
    if (!res.statusCode) {
      res.statusCode = 200
    }

    if (response.body) {
      response.body = Buffer.from(response.body).toString('base64')
    }
    // @ts-ignore TODO Sort out converting this
    response.multiValueHeaders = res.headers
    res.writeHead(response.statusCode)

    // Convert all multiValueHeaders into arrays
    for (const key of Object.keys(response.multiValueHeaders)) {
      const header = response.multiValueHeaders[key] as unknown as
        | string
        | boolean
        | Array<string | string | number | boolean>
      if (!Array.isArray(header)) {
        response.multiValueHeaders[key] = [header]
      }
    }

    res.finished = true
    res.writableEnded = true
    // Call onResEnd handler with the response object
    onResEnd(response)
  }

  // Gatsby Functions additions

  res.send = (data) => {
    if (res.finished) {
      return res
    }
    res.end(data)
    return res
  }

  res.json = (data) => {
    if (res.finished) {
      return res
    }
    res.setHeader('content-type', 'application/json')
    res.send(JSON.stringify(data))
    return res
  }

  res.status = (code: number | string) => {
    const numericCode = parseInt(code as string, 10)
    if (!isNaN(numericCode)) {
      response.statusCode = numericCode
    }
    return res
  }

  res.redirect = (statusCode: number | string, url?: string) => {
    if (!url && typeof statusCode === 'string') {
      url = statusCode
      statusCode = 302
    }
    res.writeHead(statusCode as number, { Location: url })
    res.end()
    return res
  }

  return res
}

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
