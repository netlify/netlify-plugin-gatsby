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
  
  return AWSLambda.wrapHandler(handler) as FunctionHandler;
};

const withIntegrations = wrap(withSentry) 

const handler = 
withIntegrations(async (event: HandlerEvent, context: HandlerContext) => {
  throw Error('this is an error')
});

export { handler };
