import {AWSLambda} from '@sentry/serverless'
import { HandlerEvent, HandlerContext } from "@netlify/functions";

AWSLambda.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});


const handler = AWSLambda.wrapHandler(async (event: HandlerEvent, context: HandlerContext) => {
  throw Error('this is an error')
});

export { handler };
