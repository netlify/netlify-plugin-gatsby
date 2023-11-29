# Gatsby Image CDN on Netlify

Gatsby Image CDN is a feature available since Gatsby v4.10.0. Instead of
downloading and processing images at build time, it defers processing until
request time. This can greatly improve build times for sites with remote images,
such as those that use a CMS. Netlify includes full support for Image CDN, on
all plans.

## Enabling the Image CDN

To enable the Image CDN, you should set the environment variable
`NETLIFY_IMAGE_CDN` to `true`. You will also need to declare allowed image URL
patterns in `netlify.toml`:

```toml
[build.environment]
NETLIFY_IMAGE_CDN = "true"

[images]
remote_images = [
  'https://example1.com/*',
  'https://example2.com/*'
]
```

Exact URL patterns to use will depend on CMS you use and possibly your
configuration of it.

- `gatsby-source-contentful`:

  ```toml
  [images]
  remote_images = [
    # <your-contentful-space-id> is specified in the `spaceId` option for the
    # gatsby-source-contentful plugin in your gatsby-config file.
    "https://images.ctfassets.net/<your-contentful-space-id>/*"
  ]
  ```

- `gatsby-source-drupal`:

  ```toml
  [images]
  remote_images = [
    # <your-drupal-base-url> is speciafied in the `baseUrl` option for the
    # gatsby-source-drupal plugin in your gatsby-config file.
    "<your-drupal-base-url>/*"
  ]
  ```

- `gatsby-source-wordpress`:

  ```toml
  [images]
  remote_images = [
    # <your-wordpress-url> is specified in the `url` option for the
    # gatsby-source-wordpress plugin in your gatsby-config file.
    # There is no need to include `/graphql in the path here`
    "<your-wordpress-url>/*"
  ]
  ```

Above examples are the most likely ones to be needed. However if you configure
your CMS to host assets on different domain or path, you might need to adjust
the patterns accordingly.

## How it works

When using the Image CDN, Gatsby generates URLs of the form
`/_gatsby/image/...`. On Netlify, these are served by a function that translates
Gatsby Image CDN URLs into Netlify Image CDN compatible URL of the form
`/.netlify/images/...`. For more information about Netlify Image CDN,
documentation can be found [here](https://docs.netlify.com/image-cdn).
