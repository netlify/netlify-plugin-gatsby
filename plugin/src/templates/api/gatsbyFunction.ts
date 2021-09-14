import pathToRegexp from 'path-to-regexp'
import bodyParser from 'co-body'
import multer from 'multer'
import path from 'path'
import { existsSync } from 'fs'
import { proxyRequest } from './utils'
import {
  AugmentedGatsbyFunctionResponse,
  AugmentedGatsbyFunctionRequest,
} from './utils'
import { HandlerEvent } from '@netlify/functions'

const parseForm = multer().any()

/**
 * Execute a Gatsby function
 */
export async function gatsbyFunction(
  req: AugmentedGatsbyFunctionRequest,
  res: AugmentedGatsbyFunctionResponse<any>,
  event: HandlerEvent,
) {
  // Multipart form data middleware. because co-body can't handle it

  // @ts-ignore As we're using a fake Express handler we need to ignore the type to keep multer happy
  await new Promise((next) => parseForm(req, res, next))
  try {
    // If req.body is populated then it was multipart data
    if (
      !req.files &&
      !req.body &&
      req.method !== 'GET' &&
      req.method !== 'HEAD'
    ) {
      req.body = await bodyParser(req as unknown as Request)
    }
  } catch (e) {
    console.log('Error parsing body', e, req)
  }

  let pathFragment = decodeURIComponent(req.url).replace('/api/', '')

  let functions
  try {
    // @ts-ignore This is generated in the user's site
    functions = require('../../../.cache/functions/manifest.json') // eslint-disable-line node/no-missing-require, node/no-unpublished-require
  } catch (e) {
    return {
      statusCode: 404,
      body: 'Could not load function manifest',
    }
  }

  // Check first for exact matches.
  let functionObj = functions.find(
    ({ functionRoute }) => functionRoute === pathFragment,
  )

  if (!functionObj) {
    // Check if there's any matchPaths that match.
    // We loop until we find the first match.

    functions.some((f) => {
      let exp
      const keys = []
      if (f.matchPath) {
        exp = pathToRegexp(f.matchPath, keys, {})
      }
      if (exp && exp.exec(pathFragment) !== null) {
        functionObj = f
        const matches = [...pathFragment.match(exp)].slice(1)
        const newParams = {}
        matches.forEach((match, index) => (newParams[keys[index].name] = match))
        req.params = newParams

        return true
      } else {
        return false
      }
    })
  }

  if (functionObj) {
    console.log(`Running ${functionObj.functionRoute}`)
    const start = Date.now()

    const pathToFunction = process.env.NETLIFY_DEV
      ? // During develop, the absolute path is correct
        functionObj.absoluteCompiledFilePath
      : // ...otherwise we need to use a relative path, as we're in a lambda
        path.join(
          __dirname,
          '..',
          '..',
          '..',
          // ...We got there in the end
          '.cache',
          'functions',
          functionObj.relativeCompiledFilePath,
        )

    if (process.env.NETLIFY_DEV && !existsSync(pathToFunction)) {
      // Functions are sometimes lazily-compiled, so we check and proxy the request if needed
      console.log(
        'No compiled function found. Proxying to gatsby develop server',
      )
      return proxyRequest(event, res)
    }

    try {
      // Make sure it's hot and fresh from the filesystem
      delete require.cache[require.resolve(pathToFunction)]
      const fn = require(pathToFunction)

      const fnToExecute = (fn && fn.default) || fn

      await Promise.resolve(fnToExecute(req, res))
    } catch (e) {
      console.error(e)
      // Don't send the error if that would cause another error.
      if (!res.headersSent) {
        res
          .status(500)
          .send(
            `Error when executing function "${functionObj.originalRelativeFilePath}": "${e.message}"`,
          )
      }
    }

    const end = Date.now()
    console.log(
      `Executed function "/api/${functionObj.functionRoute}" in ${
        end - start
      }ms`,
    )
  } else {
    res.status(404).send('Not found')
  }
}
