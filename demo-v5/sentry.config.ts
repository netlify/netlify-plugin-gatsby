import * as Sentry from "@sentry/gatsby";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0, // Adjust this value in production
  // beforeSend(event) {
  //   // Modify the event here
  //   if (event.user) {
  //     // Don't send user's email address
  //     delete event.user.email;
  //   }
  //   return event;
  // },
  // ...
});
