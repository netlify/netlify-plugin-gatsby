/* eslint-disable max-lines */
import crypto from 'crypto'
import { createRequire } from 'module'
import { join } from 'path'

import { NetlifyConfig } from '@netlify/build'
import { readJSON, existsSync, writeJSON, remove } from 'fs-extra'

import type {
  EncryptionConfig,
  IMAGE_CDN_URL_PATTERN,
  ImageCDNConfig,
} from '../templates/ipx'

import { getCacheDirs, normalizedCacheDir } from './cache'
import { getGatsbyRoot } from './config'

// eslint-disable-next-line no-shadow
export enum ImageCdnImplementation {
  NETLIFY_IMAGE_CDN = 'NETLIFY_IMAGE_CDN',
  IPX = 'IPX',
  NONE = 'NONE',
}

function selectImageCdnImplementation({
  netlifyConfig,
}: {
  netlifyConfig: NetlifyConfig
}) {
  /* eslint-disable no-param-reassign */
  const { NETLIFY_IMAGE_CDN, GATSBY_CLOUD_IMAGE_CDN } =
    netlifyConfig.build.environment

  const imageCDNEnabled =
    GATSBY_CLOUD_IMAGE_CDN === '1' || GATSBY_CLOUD_IMAGE_CDN === 'true'

  if (NETLIFY_IMAGE_CDN === 'true') {
    if (!imageCDNEnabled) {
      // we do need to ensure GATSBY_CLOUD_IMAGE_CDN env var for Gatsby to not
      // transform images at build time
      netlifyConfig.build.environment.GATSBY_CLOUD_IMAGE_CDN = 'true'
    }
    return ImageCdnImplementation.NETLIFY_IMAGE_CDN
  }

  if (imageCDNEnabled) {
    return ImageCdnImplementation.IPX
  }

  return ImageCdnImplementation.NONE
  /* eslint-enable no-param-reassign */
}

export const ImageCdnUrlSyntax: Record<
  IMAGE_CDN_URL_PATTERN,
  IMAGE_CDN_URL_PATTERN
> = {
  QUERY_WITH_ENCRYPTED_URL: 'QUERY_WITH_ENCRYPTED_URL',
  QUERY: 'QUERY',
  BASE64: 'BASE64',
  NONE: 'NONE',
}

function getGatsbyPluginUtilsSyntax(contextRequire: NodeRequire) {
  try {
    const urlGeneratorExports = contextRequire(
      'gatsby-plugin-utils/polyfill-remote-file/utils/url-generator',
    )
    if (urlGeneratorExports.ImageCDNUrlKeys) {
      return urlGeneratorExports.ImageCDNUrlKeys.ENCRYPTED_URL
        ? ImageCdnUrlSyntax.QUERY_WITH_ENCRYPTED_URL
        : ImageCdnUrlSyntax.QUERY
    }

    return ImageCdnUrlSyntax.BASE64
  } catch {}

  return ImageCdnUrlSyntax.NONE
}

// list of known packages using Gatsby Image CDN that don't use their dedicated image transformation service
// compiled through manual inspection of https://github.com/search?q=addRemoteFilePolyfillInterface&type=code
const gatsbySourcePluginsUsingImageCdn = [
  // gatsby owned
  'gatsby-source-drupal',
  'gatsby-source-wordpress',
  // 3rd party
  'gatsby-source-sanity',
  'gatsby-plugin-remote-images',
  'gatsby-source-youtube-oembed',
  'gatsby-source-airtable-next',
  'gatsby-source-directus',
]

export type PrepareImageCdnResult = {
  postBuildCallback: () => Promise<void>
  imageCDNConfig: ImageCDNConfig
  imageCDNImplementation: ImageCdnImplementation
}

function detectImageCdnUrlPatterns({
  publish,
  imageCDNImplementation,
}: {
  publish: string
  imageCDNImplementation: ImageCdnImplementation
}) {
  const detectedSyntaxes = new Set<IMAGE_CDN_URL_PATTERN>()
  const siteRequire = createRequire(`${getGatsbyRoot(publish)}/:internal:`)

  try {
    detectedSyntaxes.add(getGatsbyPluginUtilsSyntax(siteRequire))
  } catch {}

  for (const packageUsingGatsbyImageCdn of gatsbySourcePluginsUsingImageCdn) {
    try {
      const packageRequire = createRequire(
        siteRequire.resolve(packageUsingGatsbyImageCdn),
      )
      detectedSyntaxes.add(getGatsbyPluginUtilsSyntax(packageRequire))
    } catch {}
  }

  // we only have NONE, because we need to return something from detection helper, so let's remove it from the list
  detectedSyntaxes.delete(ImageCdnUrlSyntax.NONE)
  if (detectedSyntaxes.size === 0) {
    // automatic detection is not ideal, so it might not find gatsby-plugin-utils even it it is actually used
    // in this case we fall back to the most recent and safe one
    detectedSyntaxes.add(ImageCdnUrlSyntax.QUERY_WITH_ENCRYPTED_URL)
  }

  if (
    imageCDNImplementation === ImageCdnImplementation.NETLIFY_IMAGE_CDN &&
    detectedSyntaxes.has(ImageCdnUrlSyntax.QUERY_WITH_ENCRYPTED_URL)
  ) {
    // Netlify Image CDN can't handle encrypted URLs, but it uses allowlist instead, so we replace QUERY_WITH_ENCRYPTED_URL with QUERY
    // Remote urls Allow list is required form Netlify Image CDN to work, so this should ensure no unauthorized remote urls can be
    // used successfully
    detectedSyntaxes.delete(ImageCdnUrlSyntax.QUERY_WITH_ENCRYPTED_URL)
    detectedSyntaxes.add(ImageCdnUrlSyntax.QUERY)
  }

  return [...detectedSyntaxes]
}

const IMAGE_CDN_ENCRYPTION_SECRET_KEY_LENGTH = 32
const IMAGE_CDN_ENCRYPTION_IV_LENGTH = 16

function setupImageCdnUrlEncryption({
  previousImageCdnConfig,
  netlifyConfig,
  imageCDNImplementation,
  enabledUrlPatterns,
}: {
  previousImageCdnConfig: ImageCDNConfig | undefined
  netlifyConfig: NetlifyConfig
  imageCDNImplementation: ImageCdnImplementation
  enabledUrlPatterns: IMAGE_CDN_URL_PATTERN[]
}): EncryptionConfig | undefined {
  const shouldUseUrlEncryption =
    imageCDNImplementation === ImageCdnImplementation.IPX &&
    enabledUrlPatterns.includes(ImageCdnUrlSyntax.QUERY_WITH_ENCRYPTED_URL)

  if (!shouldUseUrlEncryption) {
    return
  }

  // if environment variables are already set - use them
  if (
    netlifyConfig.build.environment.IMAGE_CDN_ENCRYPTION_SECRET_KEY &&
    netlifyConfig.build.environment.IMAGE_CDN_ENCRYPTION_IV
  ) {
    return {
      IMAGE_CDN_ENCRYPTION_SECRET_KEY:
        netlifyConfig.build.environment.IMAGE_CDN_ENCRYPTION_SECRET_KEY,
      IMAGE_CDN_ENCRYPTION_IV:
        netlifyConfig.build.environment.IMAGE_CDN_ENCRYPTION_IV,
    }
  }

  let encryptionConfig = previousImageCdnConfig?.encryptionConfig

  if (!encryptionConfig) {
    // if we don't yet have encryption config, generate new one
    encryptionConfig = {
      IMAGE_CDN_ENCRYPTION_SECRET_KEY: crypto
        .randomBytes(IMAGE_CDN_ENCRYPTION_SECRET_KEY_LENGTH)
        .toString(`hex`),
      IMAGE_CDN_ENCRYPTION_IV: crypto
        .randomBytes(IMAGE_CDN_ENCRYPTION_IV_LENGTH)
        .toString(`hex`),
    }
  }

  // eslint-disable-next-line no-param-reassign
  netlifyConfig.build.environment.IMAGE_CDN_ENCRYPTION_SECRET_KEY =
    encryptionConfig.IMAGE_CDN_ENCRYPTION_SECRET_KEY
  // eslint-disable-next-line no-param-reassign
  netlifyConfig.build.environment.IMAGE_CDN_ENCRYPTION_IV =
    encryptionConfig.IMAGE_CDN_ENCRYPTION_IV

  return encryptionConfig
}

// eslint-disable-next-line max-statements
export async function prepareImageCdn({
  publish,
  netlifyConfig,
}: {
  publish: string
  netlifyConfig: NetlifyConfig
}): Promise<PrepareImageCdnResult> {
  const cacheDir = normalizedCacheDir(publish)
  // private location that is cached between builds, but not exposed to public
  const imageCdnConfigFile = join(cacheDir, 'imageCdnEncryptionConfig.json')

  let previousImageCdnConfig: ImageCDNConfig | undefined

  try {
    previousImageCdnConfig = await readJSON(imageCdnConfigFile)
  } catch {}

  const imageCDNImplementation = await selectImageCdnImplementation({
    netlifyConfig,
  })

  const enabledUrlPatterns = await detectImageCdnUrlPatterns({
    publish,
    imageCDNImplementation,
  })

  const encryptionConfig = await setupImageCdnUrlEncryption({
    previousImageCdnConfig,
    netlifyConfig,
    imageCDNImplementation,
    enabledUrlPatterns,
  })

  const allowedRemoteUrls =
    // use defined remote images if user configured them
    netlifyConfig.images?.remote_images ??
    // if they are not configured and user
    //  - is using Netlify Image CDN - we should use empty array to disallow any remote url
    //  - is using IPX - we should not setup remote urls as IPX/Gatsby Cloud never required them and this would be breaking change
    imageCDNImplementation === ImageCdnImplementation.NETLIFY_IMAGE_CDN
      ? []
      : undefined

  const imageCDNConfig: ImageCDNConfig = {
    enabledUrlPatterns,
    encryptionConfig,
    allowedRemoteUrls,
  }

  // some configuration change require to throw away previous build artifacts to prevent gatsby from reusing
  // previous html/json files that would contain old urls that would not work with new configuration
  // so we need to ensure fresh builds when at least one of the following changed since last build:
  // - enabledUrlPatterns changed
  // - encryption changed
  const enabledUrlPatternsChanged =
    JSON.stringify(previousImageCdnConfig?.enabledUrlPatterns) !==
    JSON.stringify(imageCDNConfig.enabledUrlPatterns)
  const encryptionConfigChanged =
    JSON.stringify(previousImageCdnConfig?.encryptionConfig) !==
    JSON.stringify(imageCDNConfig.encryptionConfig)

  if (enabledUrlPatternsChanged || encryptionConfigChanged) {
    const dirsToClean = getCacheDirs(publish).filter(existsSync)
    if (dirsToClean.length !== 0) {
      console.log(
        `Image CDN configuration changed:${
          enabledUrlPatternsChanged ? `\n - enabledUrlPatterns` : ''
        }${
          encryptionConfigChanged ? `\n - encryptionConfig` : ''
        }\nCleaning previous build and building fresh.`,
      )
      for (const dirToClean of dirsToClean) {
        await remove(dirToClean)
      }
    }
  }

  return {
    imageCDNConfig,
    imageCDNImplementation,
    postBuildCallback: async () => {
      // .cache directory might not exist yet, so to not mess with Gatsby itself
      // we delay storing the config for future build until after the build
      await writeJSON(imageCdnConfigFile, imageCDNConfig)
    },
  }
}
/* eslint-enable max-lines */
