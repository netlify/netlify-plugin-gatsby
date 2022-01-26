import * as React from 'react'

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

const ErrorPage = () => {
  return (
    <main style={pageStyles}>
      <title>Internal Server Error</title>
      <h1 style={headingStyles}>Internal Server Error</h1>
      <p style={paragraphStyles}>
        Sorry{' '}
        <span role="img" aria-label="Pensive emoji">
          😔
        </span>{' '}
        there was an error.
      </p>
    </main>
  )
}

export default ErrorPage
