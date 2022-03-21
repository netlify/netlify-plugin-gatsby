# Changelog

### [2.1.4](https://github.com/netlify/netlify-plugin-gatsby/compare/plugin-gatsby-v2.1.3...plugin-gatsby-v2.1.4) (2022-03-21)


### Bug Fixes

* resolve lmdb binaries correctly ([#327](https://github.com/netlify/netlify-plugin-gatsby/issues/327)) ([c6c162b](https://github.com/netlify/netlify-plugin-gatsby/commit/c6c162bc11b76cbe5ea63ff78f45f0f8dff626a5))

### [2.1.3](https://github.com/netlify/netlify-plugin-gatsby/compare/plugin-gatsby-v2.1.1...plugin-gatsby-v2.1.3) (2022-03-16)


### Bug Fixes

* **deps:** update dependency @netlify/ipx to ^1.0.1 ([#318](https://github.com/netlify/netlify-plugin-gatsby/issues/318)) ([f9e7a88](https://github.com/netlify/netlify-plugin-gatsby/commit/f9e7a8858ca91cbcd4572f5a9a403e1b602b4ba2))
* patch new lmdb binary location ([#322](https://github.com/netlify/netlify-plugin-gatsby/issues/322)) ([0abc3f9](https://github.com/netlify/netlify-plugin-gatsby/commit/0abc3f9492e56aa7070fb7c657046fcf873ac368))

### [2.1.1](https://github.com/netlify/netlify-plugin-gatsby/compare/plugin-gatsby-v2.1.0...plugin-gatsby-v2.1.1) (2022-03-02)


### Bug Fixes

* update image CDN docs and defaults ([#307](https://github.com/netlify/netlify-plugin-gatsby/issues/307)) ([0a7b223](https://github.com/netlify/netlify-plugin-gatsby/commit/0a7b223c4cf49b18261213b147d64c27ab60f9cd))

## [2.1.0](https://github.com/netlify/netlify-plugin-gatsby/compare/plugin-gatsby-v2.0.4...plugin-gatsby-v2.1.0) (2022-03-02)


### Features

* add support for `/_gatsby/file/*` redirects ([#305](https://github.com/netlify/netlify-plugin-gatsby/issues/305)) ([d071712](https://github.com/netlify/netlify-plugin-gatsby/commit/d07171265f41a527405a280e618934a3c243803e))
* image cdn support ([#303](https://github.com/netlify/netlify-plugin-gatsby/issues/303)) ([77b5aa4](https://github.com/netlify/netlify-plugin-gatsby/commit/77b5aa4a3b0e8d0ecbd6bf2935d4348324066ce0))


### Bug Fixes

* **deps:** update dependency fs-extra to v10.0.1 ([#299](https://github.com/netlify/netlify-plugin-gatsby/issues/299)) ([2e0c8fb](https://github.com/netlify/netlify-plugin-gatsby/commit/2e0c8fb116a6c9af19cbcb96d92f4cfb6963bf84))

### [2.0.4](https://github.com/netlify/netlify-plugin-gatsby/compare/plugin-gatsby-v2.0.3...plugin-gatsby-v2.0.4) (2022-02-23)


### Bug Fixes

* remove confusing error log ([#292](https://github.com/netlify/netlify-plugin-gatsby/issues/292)) ([ed5ab59](https://github.com/netlify/netlify-plugin-gatsby/commit/ed5ab59cc44ac6d5ac3a20524f96b0d61bcc35ac))

### [2.0.3](https://github.com/netlify/netlify-plugin-gatsby/compare/plugin-gatsby-v2.0.2...plugin-gatsby-v2.0.3) (2022-02-21)

### Bug Fixes

- **deps:** update dependency @netlify/functions to ^0.11.1
  ([#279](https://github.com/netlify/netlify-plugin-gatsby/issues/279))
  ([f2272b9](https://github.com/netlify/netlify-plugin-gatsby/commit/f2272b9033570038814b05a704a3504e4811f403))
- **deps:** update dependency @netlify/functions to v1
  ([#280](https://github.com/netlify/netlify-plugin-gatsby/issues/280))
  ([e9faecc](https://github.com/netlify/netlify-plugin-gatsby/commit/e9faecc79b24d5432409aa5dfbd3d19e15007901))
- **deps:** update dependency cookie to v0.4.2
  ([#263](https://github.com/netlify/netlify-plugin-gatsby/issues/263))
  ([d031e20](https://github.com/netlify/netlify-plugin-gatsby/commit/d031e201056847fed03c58c0710210dfd46d6fb5))
- support gatsby base dirs outside the site root
  ([#281](https://github.com/netlify/netlify-plugin-gatsby/issues/281))
  ([ccbec68](https://github.com/netlify/netlify-plugin-gatsby/commit/ccbec681bfce40598ca2a91945f29ee35b04603c))

## [2.0.0](https://github.com/netlify/netlify-plugin-gatsby/compare/v2.0.0-zz-beta.0...v2.0.0) (2022-01-31)

Version 2 of the Essential Gatsby build plugin adds support for the new render
modes introduced in Gatsby 4, as well as improved support for Gatsby functions.
For best results it should be installed alongside
[`gatsby-plugin-netlify`](https://github.com/netlify/gatsby-plugin-netlify/).
Beta support was available since Gatsby 4 was released, but with this stable
release it is ready for production use for everyone.

### Features

This version adds full support for the new Gatsby 4 render modes on Netlify.
Gatsby 4 introduced two render modes, alongside its original SSG mode. For a
detailed comparison of each mode
[see this blog post](https://www.netlify.com/blog/2021/09/16/run-gatsby-4-with-dsg-and-ssr-on-netlify-today/).

To support these new modes, the Essential Netlify build plugin generates three
serverless Netlify Functions that are automatically deployed alongside your
site:

- `__api`: used for Gatsby Functions
- `__dsg`: an
  [on-demand builder](https://docs.netlify.com/configure-builds/on-demand-builders/)
  used for DSG pages.
- `__ssr`: used for server-side rendered pages.

You do not need to configure or deploy these functions yourself: they are
automatically generated and deployed whenever you build.

You can see the logs for these functions in the "Functions" tabs in the Netlify
dashboard.

It will also generate Netlify rewrites to ensure that each route is handled by
the correct function.

### Installing

This version of the plugin will soon be installed automatically for all Gatsby
sites on Netlify. If you can't wait, you can
[install it manually](https://github.com/netlify/netlify-plugin-gatsby#installation)
using file-based plugin installation.

You should also install `gatsby-plugin-netlify` to enable all features. **It is
required if you are using SSR pages**. See
[how to install](https://github.com/netlify/netlify-plugin-gatsby#install-the-gatsby-plugin)

### Deploying your site

You do not need to do anything different to deploy your site if building on
Netlify: it will automatically deploy the functions when you build. If you are
deploying manually using the Netlify CLI, you must ensure that instead of
running `netlify build` then `netlify deploy` as separate commands, you run them
together as `netlify deploy --build`.

### Caveats

Currently you cannot use `StaticImage` or `gatsby-transformer-sharp` in SSR or
DSG pages. The best workaround is to use an image CDN such as
[Cloudinary](https://www.gatsbyjs.com/docs/how-to/images-and-media/using-cloudinary-image-service/)
or [imgix](https://github.com/imgix/gatsby) to host your images. This will give
you faster builds too.

### Feedback

If you have feedback or bug reports, join
[the discussion](https://github.com/netlify/netlify-plugin-gatsby/discussions)
or [open an issue](https://github.com/netlify/netlify-plugin-gatsby/issues)
