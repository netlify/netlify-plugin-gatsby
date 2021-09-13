/**
 * Handler for Gatsby functions
 */

import {
  HandlerContext,
  HandlerEvent,
  HandlerResponse,
} from '@netlify/functions'

import { gatsbyFunction } from './gatsbyFunction'
import { createRequestObject, createResponseObject } from './utils'

export function handler(
  event: HandlerEvent,
  context: HandlerContext,
): Promise<HandlerResponse> {
  // Create a fake Gatsby/Express Request object
  const req = createRequestObject({ event, context })

  return new Promise((resolve) => {
    // Create a stubbed Gatsby/Express Response object
    // onResEnd is the "resolve" cb for this Promise
    const res = createResponseObject({ onResEnd: resolve })
    try {
      // Try to call the actual function
      gatsbyFunction(req, res, event)
    } catch (error) {
      console.error(`Error executing ${event.path}`, error)
      resolve({ statusCode: 500 })
    }
  })
}
