import { GatsbyFunctionRequest } from 'gatsby'
import { HandlerEvent, HandlerContext } from '@netlify/functions'
import Stream from 'stream'
import type { Socket } from 'net'
import http from 'http'
import cookie from 'cookie'

interface NetlifyFunctionParams {
  event: HandlerEvent
  context: HandlerContext
}

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

  // Expose Netlify Function event and callback on request object.
  // This makes it possible to access the clientContext, for example.
  // See: https://github.com/netlify/next-on-netlify/issues/20
  // It also allows users to change the behavior of waiting for empty event
  // loop.
  // See: https://github.com/netlify/next-on-netlify/issues/66#issuecomment-719988804
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
