import {AWSLambda, NodeOptions} from '@sentry/serverless'
import { wrap } from "@netlify/integrations";
import { HandlerEvent, HandlerContext, HandlerResponse } from "@netlify/functions";

// Todo: Consider making this an accessible type through @netlify/integrations
type FunctionHandler<Context = unknown> = (
  event: HandlerEvent,
  context: HandlerContext & Context,
) => Promise<HandlerResponse>

const withSentry = (
  handler,
  sentryConfiguration?: NodeOptions
) => {
  // Provide sensible defaults or allow user to override Sentry configuration
  // when calling the method
  AWSLambda.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    ...sentryConfiguration
  });

  // Throwing an error is the only way to get access to the stack trace
  try{
    throw Error()
  } catch(err) {
    // The string at index 2 is the function calling withSentry
    const withSentryCallingFunction = err.stack.split('at ')[2].trim()
    // Regex to pull the file name out of the string
    const regex = /[^.](netlify\/functions\/.+[^\:\d])/g
    const result = withSentryCallingFunction.match(regex)

    if (result.length) {
      const filename = result[0].split('/').pop()
      console.log('FILENAME', filename)
      // Configure the scope with the function file name so that transactions
      // (in the Sentry performance context) can be grouped
      AWSLambda.configureScope(scope => scope.setTransactionName(`netlify/functions/${filename}`));
    }
  }
  
  return AWSLambda.wrapHandler(handler) as FunctionHandler;
};

const withIntegrations = wrap(withSentry) 

const handler = 
withIntegrations(async (event: HandlerEvent, context: HandlerContext) => {
  throw Error('this is an error')
});

export { handler };
