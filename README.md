![Netlify Build plugin Gatsby – Run Gatsby seamlessly on Netlify](netlify-gatsby-plugin.png)

# Essential Gatsby Plugin - v2 beta

This version of the Essential Gatsby build plugin is an beta release, supporting the new features of Gatsby 4 including the SSR and DSG [render modes](https://www.gatsbyjs.com/docs/conceptual/rendering-options).
For older versions of Gatsby, please use version 1.x of the build plugin, which
is installed automatically for new Gatsby sites.

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


## Installation and Configuration

<!-- All sites deployed to Netlify with Gatsby will automatically install this plugin
for a seamless experience.

This means that you don't have to do anything — just build and deploy your site
to Netlify as usual and we'll handle the rest.

You're able to
[remove the plugin](https://docs.netlify.com/configure-builds/build-plugins/#remove-a-plugin)
at any time by visiting the **Plugins** tab for your site in the Netlify UI. -->

There are three steps to enable support for Gatsby 4 in your Netlify site. This includes installing _two_ plugins: a Netlify build plugin called "Essential Gatsby Plugin", and a Gatsby plugin called "gatsby-plugin-netlify":

- [Install version 2 beta of `@netlify/plugin-gatsby`](#install-the-netlify-build-plugin) (the Netlify build plugin)
- [Install version 4 of `gatsby-plugin-netlify`](#install-the-gatsby-plugin) (the Gatsby plugin)
- [Configure your build to use the correct build image and Node.js runtime](#build-configuration)
### Install the Netlify build plugin

1. Create a `netlify.toml` in the root of your project. Your file should include
   the plugins section below:

```toml
[[plugins]]
package = "@netlify/plugin-gatsby"
```

2. From your project's base directory, add this plugin to `devDependencies` in
   `package.json`.

```shell
npm install -D @netlify/plugin-gatsby@^2.0.0-beta
```

Read more about
[file-based plugin installation](https://docs.netlify.com/configure-builds/build-plugins/#file-based-installation)
in our docs.

## Install the Gatsby Plugin
To use SSR pages you must install version 4 of [gatsby-plugin-netlify](https://www.gatsbyjs.org/plugins/gatsby-plugin-netlify/):

```shell
npm install -D gatsby-plugin-netlify
```

Then add the following to your `gatsby-config.js` file:

```js
module.exports = {
   plugins: [
      "gatsby-plugin-netlify"
   ]
}
```
See [the gatsby-plugin-netlify docs](https://www.gatsbyjs.org/plugins/gatsby-plugin-netlify/) for more information, including optional plugin configuration.
### Build configuration
During the beta phase there are some changes that need to be made manually in your build configuration. 

- Set the build image to "Ubuntu Xenial 16.04". Read the docs on [how to select a build image](https://docs.netlify.com/configure-builds/get-started/#build-image-selection).
- Gatsby now requires Node 14 for building and SSR/DSG. For this to work you must set the environment variable `AWS_LAMBDA_JS_RUNTIME` to `nodejs14.x`. This must be done in the Netlify UI, not in the `netlify.toml`. Read the docs on [choosing a functions runtime](https://docs.netlify.com/functions/build-with-javascript/#runtime-settings).

### Caveats
Currently you cannot use `StaticImage` or `gatsby-transformer-sharp` in SSR or DSG pages. The best workaround is to use an image CDN such as [Cloudinary](https://www.gatsbyjs.com/docs/how-to/images-and-media/using-cloudinary-image-service/) or [imgix](https://github.com/imgix/gatsby) to host your images. This will give you faster builds and rendering too. 

### Beta feedback
TODO: forums link

### Local development

When developing Gatsby Functions it is usually easier to use the built-in
`gatsby develop` functions server. However if you want to try the Netlify
functions wrapper it will run via `netlify dev`. You should be sure to
run `netlify build` first, so that the wrappers are generated and the functions
copied across.
