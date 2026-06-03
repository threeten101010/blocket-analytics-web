import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '🇸🇪 Blocket Advanced Analytics & AI Appraisal Portal',
  description: 'Full-stack motorcycle market intelligence dashboard, pricing analysis, and cohort machine learning valuations.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen relative overflow-x-hidden select-none bg-[#0B0F19]">
        {/* Glow ambient radial backgrounds */}
        <div className="glow-orb-turquoise top-[-100px] left-[-150px]"></div>
        <div className="glow-orb-amethyst top-[300px] right-[-200px]"></div>
        
        {/* Dynamic page contents wrapper */}
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  )
}
