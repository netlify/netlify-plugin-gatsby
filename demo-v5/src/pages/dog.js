import * as React from 'react'
import { Layout } from '../layout/default'
import fetch from 'node-fetch'

const SSRPage = ({ serverData }) => (
  <Layout>
    <h1>SSR Page with a random dog</h1>
    <img alt="Happy dog" src={serverData.message} />
  </Layout>
)

export default SSRPage

export async function getServerData() {
  try {
    const res = await fetch(`https://dog.ceo/api/breeds/image/random`)

    if (!res.ok) {
      throw new Error(`Response failed`)
    }

    return {
      props: await res.json(),
      headers: {
        'x-dog': 'good',
      },
    }
  } catch (error) {
    return {
      headers: {
        status: 500,
      },
      props: {},
    }
  }
}
