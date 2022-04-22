import * as React from 'react'
import { Layout } from '../layout/default'

const SSRRedirectPage = () => (
  <Layout>
    <h1>SSR Page that redirects to the blog page</h1>
  </Layout>
)

export default SSRRedirectPage

export async function getServerData() {
  return {
    props: {},
    status: 302,
    headers: {
      location: '/blog',
    },
  }
}
