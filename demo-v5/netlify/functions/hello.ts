import {AWSLambda} from '@sentry/serverless'
import { HandlerEvent, HandlerContext } from "@netlify/functions";

AWSLambda.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});


const handler = AWSLambda.wrapHandler(async (event: HandlerEvent, context: HandlerContext) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Hello World" }),
  };
});

export { handler };
