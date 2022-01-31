# Changelog

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
