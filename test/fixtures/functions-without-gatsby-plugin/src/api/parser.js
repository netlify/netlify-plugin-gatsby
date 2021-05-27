export default function topLevel(req, res) {
  console.log('files', res.files)
  if (req.query && Object.keys(req.query).length) {
    res.json(req.query)
  } else if (req.body) {
    res.json(req.body)
  } else {
    res.json({
      message: `No body was sent. Try a POST request or query string`,
    })
  }
}
