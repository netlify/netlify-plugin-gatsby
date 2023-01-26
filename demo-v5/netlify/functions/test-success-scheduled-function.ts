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
    cronMonitoring: {
      enable: true,
      monitorId: process.env.SENTRY_CRON_MONITOR_SUCCESS_ID
    }
  }
}

const handlerWithIntegrations = withIntegrations(myHandler, config)

const handler = schedule("@hourly", handlerWithIntegrations)

export { handler };
