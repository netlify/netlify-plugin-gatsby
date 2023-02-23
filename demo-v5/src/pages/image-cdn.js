import * as React from 'react'
import { graphql } from 'gatsby'
import { GatsbyImage } from 'gatsby-plugin-image'
import { Layout } from '../layout/default'

const ImageCDNPage = ({ data }) => (
  <Layout>
    <h1>Image CDN</h1>
    <ul>
      {data.allUnsplashImage.nodes.map((node) => (
        <>
          <li key={node.id + '-400'}>
            <figure>
              <GatsbyImage image={node.gatsbyImage400} alt="400px wide image" />
              <figcaption>400px wide image</figcaption>
            </figure>
          </li>
          <li key={node.id + '-200'}>
            <figure>
              <GatsbyImage image={node.gatsbyImage200} alt="200px wide image" />
              <figcaption>200px wide image</figcaption>
            </figure>
          </li>
          <li key={node.id + '-public'}>
            <figure>
              <img src={node.publicUrl} alt="Public URL" />
              <figcaption>Public URL</figcaption>
            </figure>
          </li>
        </>
      ))}
    </ul>
    <h2>Old syntax</h2>
    <figure>
      <img
        src="/_gatsby/image/aHR0cHM6Ly9pbWFnZXMudW5zcGxhc2guY29tL3Bob3RvLTE1MTc4NDk4NDU1MzctNGQyNTc5MDI0NTRhP2l4bGliPXJiLTEuMi4xJml4aWQ9TW53eE1qQTNmREI4TUh4d2FHOTBieTF3WVdkbGZIeDhmR1Z1ZkRCOGZIeDgmYXV0bz1mb3JtYXQmZml0PWNyb3Amdz0yMDAwJnE9ODA=/dz0zMDAmaD00MDAmZm09YXZpZg==.avif"
        alt="Gatsby"
      />
      <figcaption>
        /_gatsby/image/aHR0cHM6Ly9pbWFnZXMudW5zcGxhc2guY29tL3Bob3RvLTE1MTc4NDk4NDU1MzctNGQyNTc5MDI0NTRhP2l4bGliPXJiLTEuMi4xJml4aWQ9TW53eE1qQTNmREI4TUh4d2FHOTBieTF3WVdkbGZIeDhmR1Z1ZkRCOGZIeDgmYXV0bz1mb3JtYXQmZml0PWNyb3Amdz0yMDAwJnE9ODA=/dz0zMDAmaD00MDAmZm09YXZpZg==.avif
      </figcaption>
    </figure>
    <h2>Query results</h2>
    <pre>{JSON.stringify(data, null, 2)}</pre>
  </Layout>
)

export default ImageCDNPage

export const query = graphql`
  {
    allUnsplashImage {
      nodes {
        id
        gatsbyImage200: gatsbyImage(width: 200)
        gatsbyImage400: gatsbyImage(width: 400)
        publicUrl
      }
    }
  }
`
