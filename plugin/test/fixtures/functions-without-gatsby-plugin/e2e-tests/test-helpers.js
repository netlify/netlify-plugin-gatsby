/* eslint-disable no-unused-vars */
const fetch = require(`node-fetch`)
const FormData = require('form-data')
const path = require('path')
const { readFileSync } = require('fs')
// Based on Gatsby Functions integration tests
// Source: https://github.com/gatsbyjs/gatsby/blob/master/integration-tests/functions/test-helpers.js

exports.runTests = function runTests(env, host) {
  async function fetchTwice(url, options) {
    const result = await fetch(url, options)
    if (!result.headers.has('x-forwarded-host')) {
      return result
    }
    return fetch(url, options)
  }

  describe(env, () => {
    describe(`routing`, () => {
      test(`top-level API`, async () => {
        const result = await fetchTwice(`${host}/api/top-level`).then((res) =>
          res.text(),
        )

        expect(result).toMatchSnapshot()
      })
      test(`secondary-level API`, async () => {
        const result = await fetchTwice(
          `${host}/api/a-directory/function`,
        ).then((res) => res.text())

        expect(result).toMatchSnapshot()
      })
      test(`secondary-level API with index.js`, async () => {
        const result = await fetchTwice(`${host}/api/a-directory`).then((res) =>
          res.text(),
        )

        expect(result).toMatchSnapshot()
      })
      test(`secondary-level API`, async () => {
        const result = await fetchTwice(`${host}/api/dir/function`).then(
          (res) => res.text(),
        )

        expect(result).toMatchSnapshot()
      })
      test(`routes with special characters`, async () => {
        const routes = [
          `${host}/api/I-Am-Capitalized`,
          `${host}/api/some whitespace`,
          `${host}/api/with-äöü-umlaut`,
          `${host}/api/some-àè-french`,
          encodeURI(`${host}/api/some-אודות`),
        ]

        for (const route of routes) {
          const result = await fetchTwice(route).then((res) => res.text())

          expect(result).toMatchSnapshot()
        }
      })

      test(`dynamic routes`, async () => {
        const routes = [
          `${host}/api/users/23/additional`,
          `${host}/api/dir/super`,
        ]

        for (const route of routes) {
          const result = await fetchTwice(route).then((res) => res.json())

          expect(result).toMatchSnapshot()
        }
      })
    })

    describe(`environment variables`, () => {
      test(`can use inside functions`, async () => {
        const result = await fetchTwice(`${host}/api/env-variables`).then(
          (res) => res.text(),
        )

        expect(result).toEqual(`word`)
      })
    })

    describe(`typescript`, () => {
      test(`typescript functions work`, async () => {
        const result = await fetchTwice(`${host}/api/i-am-typescript`).then(
          (res) => res.text(),
        )

        expect(result).toMatchSnapshot()
      })
    })

    describe(`function errors don't crash the server`, () => {
      // This test mainly just shows that the server doesn't crash.
      test(`normal`, async () => {
        const result = await fetchTwice(`${host}/api/error-send-function-twice`)

        expect(result.status).toEqual(200)
      })
    })

    describe(`response formats`, () => {
      test(`returns json correctly`, async () => {
        const res = await fetchTwice(`${host}/api/i-am-json`)
        const result = await res.json()

        const { date, etag, ...headers } = Object.fromEntries(res.headers)
        expect(result).toMatchSnapshot('result')
        expect(headers).toMatchSnapshot('headers')
      })
      test(`returns text correctly`, async () => {
        const res = await fetchTwice(`${host}/api/i-am-typescript`)
        const result = await res.text()

        const { date, etag, ...headers } = Object.fromEntries(res.headers)
        expect(result).toMatchSnapshot('result')
        expect(headers).toMatchSnapshot('headers')
      })
    })

    describe(`functions can send custom statuses`, () => {
      test(`can return 200 status`, async () => {
        const res = await fetchTwice(`${host}/api/status`)

        expect(res.status).toEqual(200)
      })

      test(`can return 404 status`, async () => {
        const res = await fetchTwice(`${host}/api/status?code=404`)

        expect(res.status).toEqual(404)
      })

      test(`can return 500 status`, async () => {
        const res = await fetchTwice(`${host}/api/status?code=500`)

        expect(res.status).toEqual(500)
      })
    })

    describe(`functions can parse different ways of sending data`, () => {
      test(`query string`, async () => {
        const result = await fetchTwice(`${host}/api/parser?amIReal=true`).then(
          (res) => res.json(),
        )

        expect(result).toMatchSnapshot()
      })

      test(`form parameters`, async () => {
        const { URLSearchParams } = require('url')
        const params = new URLSearchParams()
        params.append('a', `form parameters`)
        const result = await fetchTwice(`${host}/api/parser`, {
          method: `POST`,
          body: params,
        }).then((res) => res.json())

        expect(result).toMatchSnapshot()
      })

      test(`form data`, async () => {
        const form = new FormData()
        form.append('a', `form-data`)
        const result = await fetchTwice(`${host}/api/parser`, {
          method: `POST`,
          body: form,
        }).then((res) => res.json())

        expect(result).toMatchSnapshot()
      })

      test(`json body`, async () => {
        const body = { a: `json` }
        const result = await fetchTwice(`${host}/api/parser`, {
          method: `POST`,
          body: JSON.stringify(body),
          headers: { 'Content-Type': 'application/json' },
        }).then((res) => res.json())

        expect(result).toMatchSnapshot()
      })

      it(`file in multipart/form`, async () => {
        const file = readFileSync(path.join(__dirname, './fixtures/test.txt'))

        const form = new FormData()
        form.append('file', file, {
          filename: 'test.txt',
          contentType: 'text/plain',
        })
        form.append('something', 'here')
        const result = await fetchTwice(`${host}/api/parser`, {
          method: `POST`,
          body: form,
          headers: form.getHeaders(),
        }).then((res) => res.json())

        expect(result).toMatchSnapshot()
      })
    })

    describe(`functions get parsed cookies`, () => {
      test(`cookie`, async () => {
        const result = await fetchTwice(`${host}/api/cookie-me`, {
          headers: { cookie: `foo=blue;` },
        }).then((res) => res.json())

        expect(result).toMatchSnapshot()
      })
    })

    describe(`functions can redirect`, () => {
      test(`normal`, async () => {
        const result = await fetchTwice(`${host}/api/redirect-me`)

        expect(result.url).toEqual(host + `/`)
      })
    })

    describe(`functions can have custom middleware`, () => {
      test(`normal`, async () => {
        const result = await fetchTwice(`${host}/api/cors`)

        const headers = Object.fromEntries(result.headers)
        expect(headers[`access-control-allow-origin`]).toEqual(`*`)
      })
    })
  })
}
