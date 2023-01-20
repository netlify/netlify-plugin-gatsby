import { Handler, HandlerEvent, HandlerContext, schedule } from "@netlify/functions";
import { wrap } from "@netlify/integrations";

// Todo: Can encapsulate this better
const requestHeaders = new Headers()
requestHeaders.set('Authorization', `DSN ${process.env.SENTRY_DSN}`)
requestHeaders.set('Content-Type', "application/json")

const startSentryCheckIn = async () => {
  await fetch(`https://sentry.io/api/0/monitors/${process.env.SENTRY_CRON_MONITOR_SUCCESS_ID}/checkins/`, {
    method: "POST",
    headers: requestHeaders,
    body: JSON.stringify({status: "in_progress"})
  })
}

const completeSentryCheckIn = async () => {
  await fetch(`https://sentry.io/api/0/monitors/${process.env.SENTRY_CRON_MONITOR_SUCCESS_ID}/checkins/`, {
    method: "POST",
    headers: requestHeaders,
    body: JSON.stringify({status: "ok"})
  })
}

const withSentryHandler = async (
  handler,
) => {
  await startSentryCheckIn()  
  const response = await handler()
  await completeSentryCheckIn()
  return response
};


const myHandler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  console.log("Received event:", event);
  
  return {
      statusCode: 200,
  };
};

const handler = schedule("@hourly", withSentryHandler)

export { handler };
