module.exports = {
  siteMetadata: {
    title: 'Function test',
  },
  plugins: [
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/posts`,
        name: `blog`,
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [],
      },
    },
    'gatsby-plugin-netlify',
    `gatsby-plugin-image`,
    `gatsby-plugin-sharp`,
    'gatsby-plugin-image-cdn-test',
  ],
}
