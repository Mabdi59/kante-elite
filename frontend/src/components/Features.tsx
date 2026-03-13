'use client'

import Link from 'next/link'
import { Check, Target, Users, Zap } from 'lucide-react'
import { useSiteContentBlock } from '@/lib/siteContent'

const DEFAULT_PROGRAMS = [
  {
    icon: 'target',
    title: 'Private Training',
    description:
      'One-on-one sessions tailored to your child\'s skill level. Our elite coaches focus on technique, positioning, and individual development.',
    highlights: ['Custom curriculum', 'Flexible scheduling', 'Rapid skill development'],
    startingAt: '$80/session',
    href: '/programs/private',
  },
  {
    icon: 'users',
    title: 'Group Sessions',
    description:
      'Train alongside peers in a competitive, fun environment. Build teamwork, communication, and tactical awareness.',
    highlights: ['Small group sizes (6-10)', 'Team dynamics', 'Peer competition'],
    startingAt: '$35/session',
    href: '/programs/group',
  },
  {
    icon: 'zap',
    title: 'Speed & Agility',
    description:
      'Specialized conditioning programs designed to improve sprinting speed, quick turns, and overall athleticism.',
    highlights: ['Performance tracking', 'Sport-science backed', 'All skill levels'],
    startingAt: '$45/session',
    href: '/programs/speed',
  },
]

const ICON_MAP = {
  target: Target,
  users: Users,
  zap: Zap,
} as const

type FeatureCard = {
  icon: keyof typeof ICON_MAP
  title: string
  description: string
  highlights: string[]
  startingAt?: string
  href: string
}

type FeaturesBlockMeta = {
  cards: FeatureCard[]
}

export default function Features() {
  const featuresBlock = useSiteContentBlock<FeaturesBlockMeta>('home.features', {
    key: 'home.features',
    title: 'Our Training Programs',
    body: "Every program is designed by professional coaches to help young athletes reach their full potential on and off the pitch.",
    metadata: {
      cards: DEFAULT_PROGRAMS as FeatureCard[],
    },
  })

  const cards = Array.isArray(featuresBlock.metadata.cards)
    ? featuresBlock.metadata.cards.filter(
        (card): card is FeatureCard =>
          Boolean(card) &&
          typeof card.icon === 'string' &&
          typeof card.title === 'string' &&
          typeof card.description === 'string' &&
          Array.isArray(card.highlights) &&
          card.highlights.every((item) => typeof item === 'string') &&
          (typeof card.startingAt === 'string' || typeof card.startingAt === 'undefined') &&
          typeof card.href === 'string'
      )
    : []

  const safeCards = cards.length > 0 ? cards : (DEFAULT_PROGRAMS as FeatureCard[])
  const normalizedCards = safeCards.map((card) => {
    const defaultHref =
      card.icon === 'target' ? '/programs/private' : card.icon === 'users' ? '/programs/group' : '/programs/speed'
    const fallbackPrice =
      card.icon === 'target' ? '$80/session' : card.icon === 'users' ? '$35/session' : '$45/session'
    return {
      ...card,
      href: card.href === '/programs' || !card.href ? defaultHref : card.href,
      startingAt: card.startingAt ?? fallbackPrice,
    }
  })

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            {featuresBlock.title ?? 'Our Training Programs'}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            {featuresBlock.body}
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {normalizedCards.map((p) => {
            const Icon = ICON_MAP[p.icon] ?? Target
            return (
            <div
              key={p.title}
              className="elevate-card bg-white rounded-2xl shadow-md p-8 flex flex-col"
            >
              <Icon className="h-10 w-10 mb-4 text-green-700" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">{p.title}</h3>
              <p className="text-gray-600 mb-5 flex-1">{p.description}</p>
              <div className="mb-4 text-sm font-semibold text-green-700">
                Starting at {p.startingAt ?? '$35/session'}
              </div>
              <ul className="space-y-2 mb-6">
                {p.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 text-green-600" />
                    {h}
                  </li>
                ))}
              </ul>
              <Link
                href={p.href}
                className="lift-button mt-auto text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl"
              >
                View Details
              </Link>
            </div>
          )})}
        </div>
      </div>
    </section>
  )
}
