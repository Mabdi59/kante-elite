'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Menu, Shield, X } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useSiteContentBlock } from '@/lib/siteContent'

type NavBlockMeta = {
  navLinks: Array<{ href: string; label: string }>
}

function isActivePath(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/'
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { isAuthenticated, role, logout } = useAuth()
  const navBlock = useSiteContentBlock<NavBlockMeta>('nav.brand', {
    key: 'nav.brand',
    title: 'Kante Elite',
    metadata: {
      navLinks: [
        { href: '/', label: 'Home' },
        { href: '/programs', label: 'Programs' },
        { href: '/tournaments', label: 'Tournaments' },
        { href: '/about', label: 'About' },
        { href: '/contact', label: 'Contact' },
      ],
    },
  })

  const navLinks = Array.isArray(navBlock.metadata.navLinks)
    ? navBlock.metadata.navLinks.filter(
        (link): link is { href: string; label: string } =>
          Boolean(link) &&
          typeof link.href === 'string' &&
          link.href.trim().length > 0 &&
          typeof link.label === 'string' &&
          link.label.trim().length > 0
      )
    : []

  const authenticatedLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/programs', label: 'Programs' },
    { href: '/tournaments', label: 'Tournaments' },
    ...(role === 'ADMIN' ? [{ href: '/admin', label: 'Admin' }] : []),
  ]

  const linksToRender = isAuthenticated ? authenticatedLinks : navLinks

  const roleLabel =
    role === 'ADMIN' ? 'Admin' : role === 'COACH' ? 'Coach' : role === 'PARENT' ? 'Parent' : 'Member'

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 text-green-700 font-bold text-xl">
            <Shield className="h-5 w-5" />
            <span>{navBlock.title ?? 'Kante Elite'}</span>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            {linksToRender.map((link) => {
              const active = isActivePath(pathname, link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-green-100 text-green-800'
                      : 'text-gray-700 hover:text-green-700 hover:bg-green-50'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1">
                  <LayoutDashboard className="h-4 w-4 text-green-700" />
                  <span className="text-xs font-bold uppercase tracking-wide text-green-800">{roleLabel}</span>
                </div>
                <button
                  onClick={logout}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-green-700 font-medium hover:underline text-sm">
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 text-gray-700"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t px-4 pb-4 space-y-2">
          {linksToRender.map((link) => {
            const active = isActivePath(pathname, link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block rounded-lg px-3 py-2 font-medium ${
                  active ? 'bg-green-100 text-green-800' : 'text-gray-700 hover:text-green-700 hover:bg-green-50'
                }`}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            )
          })}

          <hr className="my-2" />
          {isAuthenticated ? (
            <>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 px-1">{roleLabel} Account</div>
              <button
                onClick={() => {
                  logout()
                  setOpen(false)
                }}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="block text-green-700 font-medium py-2"
                onClick={() => setOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/register"
                className="block bg-green-600 text-white text-center py-2 rounded-lg hover:bg-green-700"
                onClick={() => setOpen(false)}
              >
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
