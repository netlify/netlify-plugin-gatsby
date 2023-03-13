exports.createSchemaCustomization = function createSchemaCustomization({
  actions,
}) {
  actions.createTypes(`
    type UnsplashImage implements Node & RemoteFile {
      id: ID!
    }
  `)
}

exports.sourceNodes = function sourceNodes({ actions }) {
  const imageURL = `https://images.unsplash.com/photo-1672823841196-3ec078a2befd`
  actions.createNode({
    id: 'unsplash-image-1',
    internal: {
      type: 'UnsplashImage',
      contentDigest: `1`,
    },
    url: imageURL,
    filename: imageURL,
    mimeType: `image/jpeg`,
    width: 1940,
    height: 3118,
  })
}
