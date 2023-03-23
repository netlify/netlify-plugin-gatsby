import * as React from 'react'
import { graphql } from 'gatsby'
import { GatsbyImage } from 'gatsby-plugin-image'
import { Layout } from '../layout/default'

const ImageCDNPage = ({ data }) => (
  <Layout>
    <h1>Image CDN</h1>
    <ul
      style={{
        transform: 'scale(0.01)',
        transformOrigin: '0 0',
      }}
    >
      {data.allUnsplashImage.nodes.map((node) => (
        <>
          {[
            200, 400, 600, 800, 1000, 1200, 1400, 1600, 1650, 1700, 1750, 1800,
            1850, 1900,
          ].map((width) => (
            <li style={{ float: 'left' }} key={node.id + '-' + width}>
              <figure>
                <GatsbyImage
                  image={node[`gatsbyImage${width}`]}
                  alt={`${width}px wide`}
                />
                <figcaption>{width}px wide</figcaption>
              </figure>
            </li>
          ))}
          {/* <li key={node.id + "-400"}>
            <figure>
              <GatsbyImage image={node.gatsbyImage400} alt="400px wide image" />
              <figcaption>400px wide image</figcaption>
            </figure>
          </li>
          <li key={node.id + "-200"}>
            <figure>
              <GatsbyImage image={node.gatsbyImage200} alt="200px wide image" />
              <figcaption>200px wide image</figcaption>
            </figure>
          </li> */}
          <li key={node.id + '-public'}>
            <figure>
              <img src={node.publicUrl} alt="Public URL" />
              <figcaption>Public URL</figcaption>
            </figure>
          </li>
        </>
      ))}
    </ul>
    {/* <h2>Old url structure</h2>
    <figure>
      <img
        src="/_gatsby/image/aHR0cHM6Ly9pbWFnZXMudW5zcGxhc2guY29tL3Bob3RvLTE1MTc4NDk4NDU1MzctNGQyNTc5MDI0NTRhP2l4bGliPXJiLTEuMi4xJml4aWQ9TW53eE1qQTNmREI4TUh4d2FHOTBieTF3WVdkbGZIeDhmR1Z1ZkRCOGZIeDgmYXV0bz1mb3JtYXQmZml0PWNyb3Amdz0yMDAwJnE9ODA=/dz0zMDAmaD00MDAmZm09YXZpZg==/name.avif"
        alt="Gatsby"
      />
      <figcaption>
        /_gatsby/image/aHR0cHM6Ly9pbWFnZXMudW5zcGxhc2guY29tL3Bob3RvLTE1MTc4NDk4NDU1MzctNGQyNTc5MDI0NTRhP2l4bGliPXJiLTEuMi4xJml4aWQ9TW53eE1qQTNmREI4TUh4d2FHOTBieTF3WVdkbGZIeDhmR1Z1ZkRCOGZIeDgmYXV0bz1mb3JtYXQmZml0PWNyb3Amdz0yMDAwJnE9ODA=/dz0zMDAmaD00MDAmZm09YXZpZg==.avif
      </figcaption>
    </figure>
    <figure>
      <img
        src="/_gatsby/file/aHR0cHM6Ly9pbWFnZXMudW5zcGxhc2guY29tL3Bob3RvLTE1MTc4NDk4NDU1MzctNGQyNTc5MDI0NTRhP2l4bGliPXJiLTEuMi4xJml4aWQ9TW53eE1qQTNmREI4TUh4d2FHOTBieTF3WVdkbGZIeDhmR1Z1ZkRCOGZIeDgmYXV0bz1mb3JtYXQmZml0PWNyb3Amdz0yMDAwJnE9ODA=/name.avif"
        alt="Gatsby File"
      />
      <figcaption>
        /_gatsby/file/aHR0cHM6Ly9pbWFnZXMudW5zcGxhc2guY29tL3Bob3RvLTE1MTc4NDk4NDU1MzctNGQyNTc5MDI0NTRhP2l4bGliPXJiLTEuMi4xJml4aWQ9TW53eE1qQTNmREI4TUh4d2FHOTBieTF3WVdkbGZIeDhmR1Z1ZkRCOGZIeDgmYXV0bz1mb3JtYXQmZml0PWNyb3Amdz0yMDAwJnE9ODA=/name.avif
      </figcaption>
    </figure> */}
  </Layout>
)

export default ImageCDNPage

export const query = graphql`
  {
    allUnsplashImage {
      nodes {
        id
        gatsbyImage200: gatsbyImage(width: 200, formats: JPG)
        gatsbyImage400: gatsbyImage(width: 400, formats: JPG)
        gatsbyImage600: gatsbyImage(width: 600, formats: JPG)
        gatsbyImage800: gatsbyImage(width: 800, formats: JPG)
        gatsbyImage1000: gatsbyImage(width: 1000, formats: JPG)
        gatsbyImage1200: gatsbyImage(width: 1200, formats: JPG)
        gatsbyImage1400: gatsbyImage(width: 1400, formats: JPG)
        gatsbyImage1600: gatsbyImage(width: 1600, formats: JPG)
        gatsbyImage1650: gatsbyImage(width: 1650, formats: JPG)
        gatsbyImage1700: gatsbyImage(width: 1700, formats: JPG)
        gatsbyImage1750: gatsbyImage(width: 1750, formats: JPG)
        gatsbyImage1800: gatsbyImage(width: 1800, formats: JPG)
        gatsbyImage1850: gatsbyImage(width: 1850, formats: JPG)
        gatsbyImage1900: gatsbyImage(width: 1900, formats: JPG)
        publicUrl
      }
    }
  }
`
