# Contributions

🎉 Thanks for considering contributing to this project! 🎉

These guidelines will help you send a pull request.

If you're submitting an issue instead, please skip this document.

If your pull request is related to a typo or the documentation being unclear,
please click on the relevant page's `Edit` button (pencil icon) and directly
suggest a correction instead.

This project was made with ❤️. The simplest way to give back is by starring and
sharing it online.

Everyone is welcome regardless of personal background. We enforce a
[Code of conduct](CODE_OF_CONDUCT.md) in order to promote a positive and
inclusive environment.

# Development process

First fork and clone the repository. If you're not sure how to do this, please
watch
[these videos](https://egghead.io/courses/how-to-contribute-to-an-open-source-project-on-github).

Run:

```bash
npm install
```

Make sure everything is correctly setup with:

```bash
npm test
```

# Development tasks

The following development tasks are available. Please check the
[`package.json`](/package.json) `scripts` property for more information.

```bash
npm run build
```

Runs a Netlify Build locally with the current plugin. This can be used for
debugging and manual tests.

The local Build configuration file is [`netlify.toml`](/netlify.toml) and can be
modified.

```bash
npm run ava
```

Runs [unit tests](/test/index.js).

```bash
npm run lint
```

Lints and prettifies source files.

```bash
npm test
```

Runs both unit tests and linting.

```bash
npm run release
```

Publishes this plugin to `npm`.
