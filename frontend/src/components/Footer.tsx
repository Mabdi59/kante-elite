import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 text-white font-bold text-xl mb-3">
              <span>⚽</span>
              <span>Kante Elite Training</span>
            </div>
            <p className="text-sm leading-relaxed">
              Premier youth soccer training in Columbus, OH. We develop the next generation of
              champions through elite coaching, focused training, and a passion for the game.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {[
                { href: '/programs', label: 'Programs' },
                { href: '/tournaments', label: 'Tournaments' },
                { href: '/about', label: 'About Us' },
                { href: '/contact', label: 'Contact' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-green-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-3">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>📍 Columbus, OH 43215</li>
              <li>
                <a href="tel:+16145550100" className="hover:text-green-400">
                  📞 (614) 555-0100
                </a>
              </li>
              <li>
                <a href="mailto:info@kanteelite.com" className="hover:text-green-400">
                  ✉️ info@kanteelite.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <hr className="border-gray-700 my-8" />
        <p className="text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Kante Elite Training. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
