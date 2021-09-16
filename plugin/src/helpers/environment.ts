import process from 'process'

const REQUIRED_RUNTIME = 'nodejs14.x'

export function checkEnvironment({ utils }): void {
  if (process.env.AWS_LAMBDA_JS_RUNTIME !== REQUIRED_RUNTIME) {
    utils.build.failBuild(
      `The Gatsby build plugin requires AWS Lambda to be configured to use NodeJS 14.x. Please set "AWS_LAMBDA_JS_RUNTIME" to ${REQUIRED_RUNTIME} in the site UI (not netlify.toml). See https://docs.netlify.com/functions/build-with-javascript/#runtime-settings`,
    )
  }
}
