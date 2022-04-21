import * as React from 'react'
import { graphql } from 'gatsby'
import { Layout } from '../../layout/default'
import { containerCss } from '../../template/post.module.css'

export default function BlogPostTemplate({ data }) {
  const post = data.markdownRemark

  return (
    <Layout>
      <article
        className={containerCss}
        itemScope
        itemType="http://schema.org/Article"
      >
        <header>
          <h1 itemProp="headline">{post.frontmatter.title}</h1>
          <p>{post.frontmatter.date}</p>
        </header>
        <section
          dangerouslySetInnerHTML={{ __html: post.html }}
          itemProp="articleBody"
        />
        <hr />
      </article>
    </Layout>
  )
}

export async function getServerData() {
  try {
    const res = await fetch(`https://dog.ceo/api/breeds/image/random`)
    if (!res.ok) {
      throw new Error(`Response failed`)
    }
    return {
      props: await res.json(),
    }
  } catch (error) {
    return {
      status: 500,
      headers: {},
      props: {},
    }
  }
}

export const query = graphql`
  query ($id: String) {
    allMarkdownRemark {
      nodes {
        id
      }
    }
    markdownRemark(id: { eq: $id }) {
      id
      html
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
        description
      }
      # slug
    }
  }
`
