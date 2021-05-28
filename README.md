Netlify Build plugin gatsby - Run Gatsby seamlessly on Netlify.

# Essential Gatsby Plugin

This build plugin is a utility for supporting Gatsby on Netlify. To support
build caching and Gatsby functions on Netlify, you will need to install this
plugin for your app.

## Table of Contents

- [Installation and Configuration](#installation-and-configuration)
- [CLI Usage](#cli-usage)
- [Custom Netlify Functions](#custom-netlify-functions)
- [Publish Directory](#publish-directory)
- [Custom Netlify Redirects](#custom-netlify-redirects)
- [Caveats](#caveats)
- [Credits](#credits)
- [Showcase](#showcase)

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
