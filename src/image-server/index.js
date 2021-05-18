const fastify = require('fastify')

module.exports = () => {
  const app = fastify()
  app.post('/', async (req) => {
    console.log(req.body)
    return {
      error: false,
      username: req.body.username,
    }
  })

  return app.listen(0).then(() => {
    console.log(`Image server running at ${app.server.address()}`)
  })
}
