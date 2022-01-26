![Netlify Build plugin Gatsby – Run Gatsby seamlessly on Netlify](netlify-gatsby-plugin.png)

# Essential Gatsby Plugin - v2

The Essential Gatsby build plugin enables caching of builds, SSR and DSG
[render modes](https://v4.gatsbyjs.com/docs/conceptual/rendering-options/) and
Gatsby Functions. It is installed automatically for all new Gatsby sites.

> **Note:**
>
> - Essential Gatsby includes functionality from the
>   [Gatsby Cache build plugin](https://github.com/jlengstorf/netlify-plugin-gatsby-cache).
>   If you already have the Gatsby Cache plugin installed on your Netlify site,
>   you should
>   [remove it](https://docs.netlify.com/configure-builds/build-plugins/#remove-a-plugin)
>   before installing this plugin.
> - Essential Gatsby is not compatible with the Gatsby community plugin
>   [gatsby-plugin-netlify-cache](https://www.gatsbyjs.com/plugins/gatsby-plugin-netlify-cache/).

## Installation

Gatsby sites need two plugins to support all features.

1. The Netlify build plugin, called "Essential Gatsby" or
   `@netlify/plugin-gatsby`. This is installed automatically for all Gatsby
   sites deployed to Netlify.
2. The Gatsby plugin `gatsby-plugin-netlify`. This needs to be manually
   installed.

### Installing the Netlify build plugin

New Gatsby sites on Netlify automatically install the Essential Gatsby build plugin. You can confirm this in the build logs. If you need to install it
manually, you have two options:

- [The Netlify UI](https://docs.netlify.com/configure-builds/build-plugins/#ui-installation). Here, you can search for "Essential Gatsby" and install the plugin.

- [File-based plugin installation](https://docs.netlify.com/configure-builds/build-plugins/#file-based-installation). You can install the plugin as `@netlify/plugin-gatsby` in your `netlify.toml` file.
   

### Install the Gatsby Plugin

You should also install the Gatsby plugin
[gatsby-plugin-netlify](https://www.gatsbyjs.org/plugins/gatsby-plugin-netlify/).
This is required for SSR pages, and adds support for Gatsby redirects and asset
caching rules:

1. Add the package as a dependency:

```shell
npm install -D gatsby-plugin-netlify
```

2. Then add the following to your `gatsby-config.js` file:

```js
module.exports = {
  plugins: ['gatsby-plugin-netlify'],
}
```

See
[the gatsby-plugin-netlify docs](https://github.com/netlify/gatsby-plugin-netlify/)
for more information, including optional plugin configuration.

### Disabling Netlify functions

In order to support Gatsby Functions and DSG and SSR render modes, this plugin
generates three Netlify Functions called `__api`, `__ssr` and `__dsg`. If you
are not using any of these modes, then you can disable the creation of these
functions. If you are using the latest version of `gatsby-plugin-netlify` then
this will be handled automatically, disabling functions if the site has no
Gatsby Functions, or DSG/SSR pages. Otherwise, you can do this manually by
setting the environment variable `NETLIFY_SKIP_GATSBY_FUNCTIONS` to `true`. Be
aware that if you do this, any DSG or SSR pages will not work, and nor will any
Gatsby Functions.

### Caveats

Currently you cannot use `StaticImage` or `gatsby-transformer-sharp` in SSR or
DSG pages. The best workaround is to use an image CDN such as
[Cloudinary](https://www.gatsbyjs.com/docs/how-to/images-and-media/using-cloudinary-image-service/)
or [imgix](https://github.com/imgix/gatsby) to host your images. This will give
you faster builds and rendering too.

### Local development

When developing Gatsby Functions it is usually easier to use the built-in
`gatsby develop` functions server. However if you want to try the Netlify
functions wrapper it will run via `netlify dev`. You should be sure to run
`netlify build` first, so that the wrappers are generated and the functions
copied across.
