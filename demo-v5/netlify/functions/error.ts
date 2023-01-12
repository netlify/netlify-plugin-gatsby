import Sentry from '@sentry/serverless'
import { HandlerEvent, HandlerContext } from "@netlify/functions";

Sentry.AWSLambda.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});


const handler = Sentry.AWSLambda.wrapHandler(async (event: HandlerEvent, context: HandlerContext) => {
  throw Error('this is an error')
});

export { handler };
