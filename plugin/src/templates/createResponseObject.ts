import { HandlerResponse } from '@netlify/functions'
import Stream from 'stream'
import type { GatsbyFunctionResponse } from 'gatsby'
import type { OutgoingHttpHeaders } from 'http'
export interface AugmentedGatsbyFunctionResponse<T = any>
  extends GatsbyFunctionResponse<T> {
  headers: OutgoingHttpHeaders
  writableEnded: boolean
  multiValueHeaders: string | number | boolean
}

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
    if (headers) res.headers = Object.assign(res.headers, headers)

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
