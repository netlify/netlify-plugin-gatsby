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
  const imageURLs = [
    {
      url: `https://images.unsplash.com/photo-1672823841196-3ec078a2befd`,
      width: 1940,
      height: 3118,
    },
    {
      url: `https://images.unsplash.com/photo-1678854321097-6919ddad32ac`,
      width: 3730,
      height: 5505,
    },
    {
      url: `https://images.unsplash.com/photo-1679287642343-b1f72b048b56`,
      width: 3784,
      height: 5687,
    },
    {
      url: `https://images.unsplash.com/photo-1678614034229-0a5b2ca59606`,
      width: 2832,
      height: 4240,
    },
    {
      url: `https://images.unsplash.com/photo-1668174206552-cc53001e480b`,
      width: 4000,
      height: 6016,
    },
    {
      url: `https://images.unsplash.com/photo-1650961293791-b0b4b4dd77b0`,
      width: 4000,
      height: 6000,
    },
    {
      url: `https://images.unsplash.com/photo-1678620063892-be33744d9334`,
      width: 4529,
      height: 6793,
    },
    {
      url: `https://images.unsplash.com/photo-1678434997411-11da5b713936`,
      width: 4000,
      height: 6000,
    },
    {
      url: `https://images.unsplash.com/photo-1678048632050-2e3a3ee69ab0`,
      width: 5568,
      height: 3712,
    },
    // {
    //   url: ``,
    //   width: 0,
    //   height: 0,
    // },
  ]

  for (const imageURL of imageURLs) {
    if (
      !imageURL.url ||
      imageURL.url === `` ||
      !imageURL.width ||
      !imageURL.height
    ) {
      continue
    }
    const node = {
      id: `unsplash-image-${imageURL.url}`,
      internal: {
        type: 'UnsplashImage',
        contentDigest: `1`,
      },
      url: imageURL.url,
      filename: imageURL.url,
      mimeType: `image/jpeg`,
      width: imageURL.width,
      height: imageURL.height,
    }

    actions.createNode(node)

    // console.log({ node })
  }
}
