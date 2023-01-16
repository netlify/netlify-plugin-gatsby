import { Handler, HandlerEvent, HandlerContext, schedule } from "@netlify/functions";

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

const myHandler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  await startSentryCheckIn()
  console.log("Received event:", event);
  await completeSentryCheckIn()

  return {
      statusCode: 200,
  };
};

const handler = schedule("@hourly", myHandler)

export { handler };
