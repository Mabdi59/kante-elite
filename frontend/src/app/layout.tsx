import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: {
    default: 'Kante Elite Training | Columbus Youth Soccer',
    template: '%s | Kante Elite Training',
  },
  description:
    'Premier youth soccer training in Columbus, OH. Private sessions, group training, speed & agility. Book online today!',
  keywords: [
    'youth soccer Columbus',
    'soccer training Columbus Ohio',
    'youth soccer training',
    'Kante Elite',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://kanteelitetraining.com',
    siteName: 'Kante Elite Training',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
