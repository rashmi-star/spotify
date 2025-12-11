import './globals.css'

export const metadata = {
  title: 'Spotify Desktop UI',
  description: 'A beautiful Spotify desktop application UI clone',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

