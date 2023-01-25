import { AWSLambda, NodeOptions, captureException, captureMessage, configureScope} from '@sentry/serverless'
import { wrap, FunctionHandler, IntegrationHandler } from "@netlify/integrations";
import { HandlerEvent, HandlerContext } from "@netlify/functions";
import { basename } from 'path';
// import {SentryContext, withSentry} from '@netlify/sentry'

export type SentryConfig = {
  sentry?: NodeOptions
}
export interface SentryContext {
  sentry: {
    captureException: typeof captureException
    captureMessage: typeof captureMessage
  };
}

export const setDefaultTransactionName = (handler: FunctionHandler<SentryContext>) => {
  const setTransactionNameMethod = `configureScope(scope => scope.setTransactionName("netlify/functions/${basename(__filename)}"))`;

  const stringifiedHander = handler.toString()
  const regex = /(async).+\{/g
  const match = stringifiedHander.match(regex)
  const modifiedHandlerCode = `  
  return ${match}\n
    ${setTransactionNameMethod}\n
  `
  const modifiedHandler = new Function('configureScope', stringifiedHander.replace(regex, modifiedHandlerCode))
  return modifiedHandler(configureScope)
}

export const withSentry: IntegrationHandler<SentryContext, SentryConfig> = (
  handler,
  config?,
) => {
  const sentry = {
    captureException,
    captureMessage,
  }

  const sentryConfigUserOverrides: NodeOptions = config?.sentry || {}
  
  AWSLambda.init({
    dsn: process.env.SENTRY_DSN,
    // This value means that all events are sent to Sentry. While
    // this is not ideal for functions with higher numbers of invocations
    // it will ensure that those just getting started will see their events
    // be sent immediately to Sentry
    tracesSampleRate: 1.0,
    ...sentryConfigUserOverrides
  });

  return AWSLambda.wrapHandler(async (event, context) => {
    // const updatedHandler = setDefaultTransactionName(handler)
    configureScope(scope => scope.setTransactionName(`netlify/functions/${basename(__filename)}`))

    return handler(event, { ...context, sentry });
  }) as FunctionHandler;
};

const withIntegrations = wrap(withSentry)

const handler = 
withIntegrations(async (event: HandlerEvent, context: HandlerContext & SentryContext) => {
  throw Error('yet another error')
});

export { handler };
