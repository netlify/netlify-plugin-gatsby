import { wrap } from "@netlify/integrations";
import {SentryContext, withSentry} from '@netlify/sentry'
import { Handler, HandlerEvent, HandlerContext, schedule } from "@netlify/functions";

const myHandler = async (event: HandlerEvent, context: HandlerContext & SentryContext) => {
  console.log("Received event:", event);
  
  return {
      statusCode: 200,
  };
};

const withIntegrations = wrap(withSentry)

const config = {
  sentry: {
    enableCronMonitoring: true
  }
}

const handlerWithIntegrations = withIntegrations(myHandler, config) as Handler

const handler = schedule("@hourly", handlerWithIntegrations)

export { handler };
