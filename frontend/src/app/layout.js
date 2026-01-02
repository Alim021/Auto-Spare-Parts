import './globals.css'

// Metadata ko dynamic bana dein
export const metadata = {
  title: {
    default: 'Auto Spare Parts',
    template: '%s | Auto Spare Parts'
  },
  description: 'Find and manage auto spare parts',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}