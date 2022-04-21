import * as React from 'react'
import { Link } from 'gatsby'

// styles
const pageStyles = {
  color: '#232129',
  padding: '96px',
  fontFamily: '-apple-system, Roboto, sans-serif, serif',
}
const headingStyles = {
  marginTop: 0,
  marginBottom: 64,
  maxWidth: 320,
}

const paragraphStyles = {
  marginBottom: 48,
}

// markup
const SSGPage = (props) => {
  return (
    <main style={pageStyles}>
      <title>SSG Page</title>
      <h1 style={headingStyles}>SSG Page with client-only named splat route</h1>
      <p style={paragraphStyles}>
        Param: {props.params.named}
        <br />
        <Link to="/">Go home</Link>.
      </p>
    </main>
  )
}

export default SSGPage
