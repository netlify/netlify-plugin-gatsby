/**
 * Handler for Gatsby functions and SSR routes.
 */

import { createRequestObject, createResponseObject } from './utils'
import { gatsbyFunction } from './gatsbyFunction'

export async function handler(event, context) {
  // Create a fake Gatsby/Express Request object
  const req = createRequestObject({ event, context })

  return new Promise((onResEnd) => {
    // Create a stubbed Gatsby/Express Response object
    // onResEnd is the "resolve" cb for this Promise
    const res = createResponseObject({ onResEnd })
    try {
      // Try to call the actual function
      gatsbyFunction(req, res, event)
    } catch (e) {
      console.error(`Error executing ${event.path}`, e)
      onResEnd({ statusCode: 500 })
    }
  })
}
