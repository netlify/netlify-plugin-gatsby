import createRequestObject from './createRequestObject'
import createResponseObject from './createResponseObject'
import gatsbyFunction from './gatsbyFunction'

export async function handler(event, context) {
  const req = createRequestObject({ event, context })

  return new Promise((onResEnd) => {
    const res = createResponseObject({ onResEnd })
    try {
      gatsbyFunction(req, res, event)
    } catch (e) {
      console.error(`Error executing ${event.path}`, e)
      onResEnd({ statusCode: 500 })
    }
  })
}
