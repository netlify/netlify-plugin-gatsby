import * as React from 'react'
import { Layout } from '../layout/default'

const BadPage = ({ serverData }) => (
  <Layout>
    <h1>SSR Page with a random dog</h1>
    <img alt="Happy dog" src={serverData.message} />
  </Layout>
)

export default BadPage

export async function getServerData() {
  throw new Error('Bad dog')
}
