# Gatsby Image CDN on Netlify

Gatsby Image CDN is a new feature available in the prerelease version of Gatsby.
Instead of downloading and processing images at build time, it defers processing
until request time. This can greatly improve build times for sites with remote
images, such as those that use a CMS. Netlify includes full support for Image
CDN, on all plans.

When using the image CDN, Gatsby generates URLs of the form
`/_gatsby/image/...`. On Netlify, these are served by a
[builder function](https://docs.netlify.com/configure-builds/on-demand-builders/),
powered by [sharp](https://sharp.pixelplumbing.com/) and Nuxt's
[ipx image server](https://github.com/unjs/ipx/). It supports all image formats
supported by Gatsby, including AVIF and WebP.

On first load there will be a one-time delay while the image is resized, but
subsequent requests will be super-fast as they are served from the edge cache.

## Enabling the Image CDN

To enable the Image CDN during the beta period, you should set the environment
variable `GATSBY_CLOUD_IMAGE_CDN` to `true`.

Image CDN currently requires the beta version of Gatsby. This can be installed
using the `next` tag:

```shell
npm install gatsby@next gatsby-plugin-image@next gatsby-plugin-sharp@next gatsby-transformer-sharp@next
```

Currently Image CDN supports Contentful and WordPress, and these source plugins
should also be installed using the `next` tag:

```shell
npm install gatsby-source-wordpress@next
```

or

```shell
npm install gatsby-source-contentful@next
```

Gatsby will be adding support to more source plugins during the beta period.
These should work automatically as soon as they are added.

## Using the Image CDN

Your GraphQL queries will need updating to use the image CDN. The details vary
depending on the source plugin. For more details see
[the Gatsby docs](https://support.gatsbyjs.com/hc/en-us/articles/4522338898579)
