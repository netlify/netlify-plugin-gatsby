const createRequestObject = require('./createRequestObject')
const createResponseObject = require('./createResponseObject')
const gatsbyFunction = require('./gatsbyFunction')
const { proxyRequest } = require('./functions')

exports.handler = async function handler(event, context) {
  if (process.env.NETLIFY_DEV) {
    return proxyRequest(event)
  }

  const req = createRequestObject({ event, context })
  let functions
  try {
    // This is generated in the user's site
    // eslint-disable-next-line node/no-missing-require, node/no-unpublished-require
    functions = require('./functions/manifest.json')
  } catch (e) {
    return {
      statusCode: 404,
      body: 'Could not load function manifest',
    }
  }

  return new Promise((onResEnd) => {
    const res = createResponseObject({ onResEnd })
    try {
      gatsbyFunction(req, res, functions)
    } catch (e) {
      console.error(`Error executing ${event.path}`, e)
      onResEnd({ statusCode: 500 })
    }
  })
}
