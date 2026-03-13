import type { Metadata } from 'next'
import Script from 'next/script'
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
    title: 'Kante Elite Training | Columbus Youth Soccer',
    description:
      'Develop elite skills, build confidence, and train with licensed coaches in Columbus, Ohio.',
    siteName: 'Kante Elite Training',
    images: [
      {
        url: '/media/placeholders/photo-1.svg',
        width: 1200,
        height: 630,
        alt: 'Kante Elite Training',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kante Elite Training | Columbus Youth Soccer',
    description:
      'Private training, group sessions, and speed & agility programs for youth athletes.',
    images: ['/media/placeholders/photo-1.svg'],
  },
  metadataBase: new URL('https://kanteelitetraining.com'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        {process.env.NODE_ENV === 'development' ? (
          <Script id="suppress-next-dev-console-noise" strategy="beforeInteractive">
            {`
              (function () {
                if (typeof window === 'undefined' || window.__DEV_LOG_FILTER_INSTALLED__) return;
                window.__DEV_LOG_FILTER_INSTALLED__ = true;

                var patterns = [
                  'Download the React DevTools for a better development experience',
                  '[Fast Refresh] rebuilding',
                  '[Fast Refresh] done in '
                ];

                var shouldSuppress = function (args) {
                  if (!args || args.length === 0) return false;
                  var firstArg = args[0];
                  if (typeof firstArg !== 'string') return false;
                  for (var i = 0; i < patterns.length; i++) {
                    if (firstArg.indexOf(patterns[i]) !== -1) return true;
                  }
                  return false;
                };

                var wrapConsole = function (method) {
                  var original = console[method];
                  if (typeof original !== 'function') return;
                  console[method] = function () {
                    var args = Array.prototype.slice.call(arguments);
                    if (shouldSuppress(args)) return;
                    return original.apply(console, args);
                  };
                };

                wrapConsole('log');
                wrapConsole('info');
              })();
            `}
          </Script>
        ) : null}
        <Script id="organization-schema" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SportsActivityLocation',
            name: 'Kante Elite Training',
            url: 'https://kanteelitetraining.com',
            image: 'https://kanteelitetraining.com/media/placeholders/photo-1.svg',
            telephone: '+16145550100',
            address: {
              '@type': 'PostalAddress',
              streetAddress: '3500 Olentangy River Rd',
              addressLocality: 'Columbus',
              addressRegion: 'OH',
              postalCode: '43214',
              addressCountry: 'US',
            },
          })}
        </Script>
      </head>
      <body className="font-sans antialiased">
        <Providers>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
