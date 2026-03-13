'use client'

import { type FormEvent, useState } from 'react'
import Link from 'next/link'
import { Copyright, Facebook, Instagram, Mail, MapPin, Phone, Shield, Youtube } from 'lucide-react'
import { useSiteContentBlock } from '@/lib/siteContent'

type LinkItem = { href: string; label: string }
type SocialItem = { platform: string; href: string }

type FooterBlockMeta = {
  quickLinks: LinkItem[]
  legalLinks: LinkItem[]
  socialLinks: SocialItem[]
  city: string
  phone: string
  email: string
  newsletterTitle?: string
  newsletterBody?: string
  newsletterButtonLabel?: string
}

function renderSocialIcon(platform: string) {
  const normalized = platform.toLowerCase()
  if (normalized === 'facebook') return <Facebook className="h-4 w-4" />
  if (normalized === 'youtube') return <Youtube className="h-4 w-4" />
  return <Instagram className="h-4 w-4" />
}

export default function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterMessage, setNewsletterMessage] = useState('')

  const footerBlock = useSiteContentBlock<FooterBlockMeta>('footer.main', {
    key: 'footer.main',
    title: 'Kante Elite Training',
    body: 'Premier youth soccer training in Columbus, OH. We develop the next generation of champions through elite coaching, focused training, and a passion for the game.',
    metadata: {
      quickLinks: [
        { href: '/programs', label: 'Programs' },
        { href: '/tournaments', label: 'Tournaments' },
        { href: '/about', label: 'About Us' },
        { href: '/contact', label: 'Contact' },
      ],
      legalLinks: [
        { href: '/privacy', label: 'Privacy Policy' },
        { href: '/terms', label: 'Terms' },
        { href: '/refund-policy', label: 'Refund Policy' },
      ],
      socialLinks: [
        { platform: 'instagram', href: 'https://instagram.com/' },
        { platform: 'facebook', href: 'https://facebook.com/' },
      ],
      city: 'Columbus, OH 43215',
      phone: '(614) 555-0100',
      email: 'info@kanteelite.com',
      newsletterTitle: 'Join the Parent Newsletter',
      newsletterBody: 'Get training updates, tournament announcements, and seasonal registration alerts.',
      newsletterButtonLabel: 'Subscribe',
    },
  })

  const quickLinks = Array.isArray(footerBlock.metadata.quickLinks)
    ? footerBlock.metadata.quickLinks.filter(
        (link): link is LinkItem =>
          Boolean(link) &&
          typeof link.href === 'string' &&
          link.href.trim().length > 0 &&
          typeof link.label === 'string' &&
          link.label.trim().length > 0
      )
    : []

  const legalLinks = Array.isArray(footerBlock.metadata.legalLinks)
    ? footerBlock.metadata.legalLinks.filter(
        (link): link is LinkItem =>
          Boolean(link) &&
          typeof link.href === 'string' &&
          link.href.trim().length > 0 &&
          typeof link.label === 'string' &&
          link.label.trim().length > 0
      )
    : []

  const socialLinks = Array.isArray(footerBlock.metadata.socialLinks)
    ? footerBlock.metadata.socialLinks.filter(
        (item): item is SocialItem =>
          Boolean(item) &&
          typeof item.platform === 'string' &&
          item.platform.trim().length > 0 &&
          typeof item.href === 'string' &&
          item.href.trim().length > 0
      )
    : []

  const phone = typeof footerBlock.metadata.phone === 'string' ? footerBlock.metadata.phone : '(614) 555-0100'
  const email =
    typeof footerBlock.metadata.email === 'string' ? footerBlock.metadata.email : 'info@kanteelite.com'
  const city = typeof footerBlock.metadata.city === 'string' ? footerBlock.metadata.city : 'Columbus, OH 43215'
  const newsletterTitle =
    typeof footerBlock.metadata.newsletterTitle === 'string' && footerBlock.metadata.newsletterTitle.trim().length > 0
      ? footerBlock.metadata.newsletterTitle
      : 'Join the Parent Newsletter'
  const newsletterBody =
    typeof footerBlock.metadata.newsletterBody === 'string' && footerBlock.metadata.newsletterBody.trim().length > 0
      ? footerBlock.metadata.newsletterBody
      : 'Get training updates, tournament announcements, and seasonal registration alerts.'
  const newsletterButtonLabel =
    typeof footerBlock.metadata.newsletterButtonLabel === 'string' &&
    footerBlock.metadata.newsletterButtonLabel.trim().length > 0
      ? footerBlock.metadata.newsletterButtonLabel
      : 'Subscribe'

  const phoneHref = `tel:${phone.replace(/[^\d+]/g, '')}`
  const emailHref = `mailto:${email}`

  const submitNewsletter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const cleaned = newsletterEmail.trim()
    if (!cleaned) {
      setNewsletterMessage('Enter an email address first.')
      return
    }
    setNewsletterMessage('Thanks. We received your email for newsletter updates.')
    setNewsletterEmail('')
  }

  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-xl mb-3">
              <Shield className="h-5 w-5" />
              <span>{footerBlock.title ?? 'Kante Elite Training'}</span>
            </div>
            <p className="text-sm leading-relaxed">{footerBlock.body}</p>

            {socialLinks.length > 0 && (
              <div className="mt-4 flex items-center gap-2">
                {socialLinks.map((item) => (
                  <a
                    key={`${item.platform}-${item.href}`}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-700 hover:border-green-400 hover:text-green-300 transition-colors"
                    aria-label={`Open ${item.platform}`}
                  >
                    {renderSocialIcon(item.platform)}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {quickLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-green-400 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{city}</span>
              </li>
              <li>
                <a href={phoneHref} className="hover:text-green-400 inline-flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{phone}</span>
                </a>
              </li>
              <li>
                <a href={emailHref} className="hover:text-green-400 inline-flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{email}</span>
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-2">{newsletterTitle}</h3>
            <p className="text-sm text-gray-400 mb-3">{newsletterBody}</p>
            <form onSubmit={submitNewsletter} className="space-y-2">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(event) => setNewsletterEmail(event.target.value)}
                placeholder="Parent email"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="submit"
                className="lift-button w-full rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-500"
              >
                {newsletterButtonLabel}
              </button>
            </form>
            {newsletterMessage && <p className="text-xs text-green-300 mt-2">{newsletterMessage}</p>}
          </div>
        </div>

        <hr className="border-gray-700 my-8" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-center text-sm text-gray-500 inline-flex items-center justify-center gap-2">
            <Copyright className="h-4 w-4" />
            <span>{new Date().getFullYear()} Kante Elite Training. All rights reserved.</span>
          </p>
          <div className="flex items-center gap-3 text-sm">
            {legalLinks.map((item) => (
              <Link key={item.href} href={item.href} className="text-gray-400 hover:text-green-300 transition-colors">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
