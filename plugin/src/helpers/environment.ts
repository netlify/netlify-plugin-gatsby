import process from 'process'

const MAX_BUILD_IMAGE_VERSION = 16
const REQUIRED_RUNTIME = 'nodejs14.x'

export async function checkEnvironment({ utils }): Promise<void> {
  console.log('Checking build image version...')
  // const { stdout: ubuntuVersion } = await utils.run(`lsb_release`, ['-sr'])
  // const [major] = ubuntuVersion.split('.')
  // if (Number.parseInt(major) > MAX_BUILD_IMAGE_VERSION) {
  //   utils.build.failBuild(
  //     `The Gatsby build plugin does not current support building on Ubuntu ${ubuntuVersion}. Please change your build image to "Ubuntu Xenial". See https://docs.netlify.com/configure-builds/get-started/#build-image-selection`,
  //   )
  // }
  if (process.env.AWS_LAMBDA_JS_RUNTIME !== REQUIRED_RUNTIME) {
    utils.build.failBuild(
      `The Gatsby build plugin requires AWS Lambda to be configured to use NodeJS 14.x. Please set "AWS_LAMBDA_JS_RUNTIME" to ${REQUIRED_RUNTIME} in the site UI (not netlify.toml). See https://docs.netlify.com/functions/build-with-javascript/#runtime-settings`,
    )
  }
}
