![Netlify Build plugin Gatsby – Run Gatsby seamlessly on Netlify](netlify-gatsby-plugin.png)

# Essential Gatsby Plugin

This build plugin is a utility for supporting Gatsby on Netlify. To support
build caching and Gatsby functions on Netlify, you will need to install this
plugin for your app.

> **Note:** Essential Gatsby includes functionality from the [Gatsby cache build plugin](https://github.com/jlengstorf/netlify-plugin-gatsby-cache). If you already have the Gatsby cache plugin installed, you should [remove it](https://docs.netlify.com/configure-builds/build-plugins/#remove-a-plugin) before installing this plugin.

## Table of Contents

- [Installation and Configuration](#installation-and-configuration)
- [CLI Usage](#cli-usage)
- [Using Gatsby Functions](#using-gatsby-functions)
- [Credits](#credits)

## Installation and Configuration

<!-- All sites deployed to Netlify with Gatsby will automatically install this plugin
for a seamless experience.

This means that you don't have to do anything — just build and deploy your site
to Netlify as usual and we'll handle the rest.

You're able to
[remove the plugin](https://docs.netlify.com/configure-builds/build-plugins/#remove-a-plugin)
at any time by visiting the **Plugins** tab for your site in the Netlify UI. -->

### Manual Installation

1. Create a `netlify.toml` in the root of your project. Your file should include
   the plugins section below:

```toml
[build]
command = "npm run build"
publish = "public/"

[[plugins]]
package = "@netlify/plugin-gatsby"
```

2. From your project's base directory, add this plugin to `devDependencies` in
   `package.json`.

```bash
# yarn add -D @netlify/plugin-gatsby
npm install -D @netlify/plugin-gatsby
```

Read more about
[file-based plugin installation](https://docs.netlify.com/configure-builds/build-plugins/#file-based-installation)
in our docs.

## CLI Usage

If you'd like to build and deploy your project using the
[Netlify CLI](https://docs.netlify.com/cli/get-started/), we recommend this
workflow to manage git tracking plugin-generated files:

1. Make sure all your project's files are committed before running a build with
   the CLI
2. Run any number of builds and deploys freely (i.e. `netlify build`,
   `netlify deploy --build`, `netlify deploy --prod`)
3. Run `git stash --include-unstaged` to easily ignore plugin-generated files

It's important to note that the CLI may mix your project's source code and
plugin-generated files; this is why we recommend committing all project source
files before running CLI builds.

## Using Gatsby Functions

This plugin will convert all
[Gatsby Functions](https://www.gatsbyjs.com/docs/how-to/functions/) in the
project to run as
[Netlify functions](https://docs.netlify.com/functions/overview/). This should
be invisible: you can write the Gatsby Functions in the same way as you usually
would. The API is the same, and if you use this plugin then it will deploy to
Netlify functions without needing any extra configuration.

When the site is built, this plugin will create a wrapper Netlify function in
`/netlify/functions/gatsby`, and then deploy that alongside the Gatsby
functions. If you run this locally with the Netlify CLI, you will see it create
these files. It will add an entry to your `.gitignore` to ignore the
`/netlify/functions/gatsby` directory.

### Local development

When developing Gatsby Functions it is usually easier to use the built-in
`gatsby develop` functions server. However if you want to try the Netlify
functions wrapper it will run via `netlify dev`. However you should be sure to
run `netlify build` first, so that the wrappers are generated and the functions
copied across.
