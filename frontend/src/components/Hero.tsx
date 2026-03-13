'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ShieldCheck, Star, Trophy, UsersRound } from 'lucide-react'
import { useSiteContentBlock } from '@/lib/siteContent'

type HeroStat = { value: string; label: string }
type HeroTrustItem = { value?: string; label: string; icon?: string }
type HeroBlockMeta = {
  highlightWord: string
  primaryCtaLabel: string
  primaryCtaUrl: string
  secondaryCtaLabel: string
  secondaryCtaUrl: string
  badgeText: string
  backgroundImageUrl: string
  overlayOpacity: number
  stats: HeroStat[]
  trustItems: HeroTrustItem[]
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function renderTrustIcon(iconName: string) {
  const normalized = iconName.toLowerCase()
  if (normalized === 'star') return <Star className="h-4 w-4 text-yellow-300" />
  if (normalized === 'users') return <UsersRound className="h-4 w-4 text-yellow-300" />
  if (normalized === 'shield') return <ShieldCheck className="h-4 w-4 text-yellow-300" />
  return <Trophy className="h-4 w-4 text-yellow-300" />
}

export default function Hero() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const heroBlock = useSiteContentBlock<HeroBlockMeta>('home.hero', {
    key: 'home.hero',
    title: 'Develop Elite Skills. Build Confidence. Play Like a Champion.',
    subtitle: 'Where Columbus Athletes Become Elite',
    body: 'Kante Elite Training helps youth athletes train smarter with professional coaching, structured development plans, and competitive match readiness.',
    metadata: {
      highlightWord: 'Champion',
      badgeText: "Columbus, Ohio's Premier Youth Soccer Academy",
      backgroundImageUrl:
        'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1800&q=80',
      overlayOpacity: 0.7,
      primaryCtaLabel: 'Book Free Trial',
      primaryCtaUrl: '/programs',
      secondaryCtaLabel: 'Explore Programs',
      secondaryCtaUrl: '/programs',
      stats: [
        { value: '500+', label: 'Athletes Trained' },
        { value: '10+', label: 'Years Experience' },
        { value: '95%', label: 'Satisfaction Rate' },
      ],
      trustItems: [
        { value: '4.9', label: 'Parent Rating', icon: 'star' },
        { value: '500+', label: 'Athletes Trained', icon: 'users' },
        { label: 'Licensed & Background Checked Coaches', icon: 'shield' },
      ],
    },
  })

  const title = heroBlock.title ?? 'Develop Elite Skills. Build Confidence. Play Like a Champion.'
  const highlightWord =
    typeof heroBlock.metadata.highlightWord === 'string' && heroBlock.metadata.highlightWord.trim()
      ? heroBlock.metadata.highlightWord
      : 'Champion'
  const titleParts = title.includes(highlightWord) ? title.split(highlightWord) : [title]
  const primaryCtaLabel =
    typeof heroBlock.metadata.primaryCtaLabel === 'string'
      ? heroBlock.metadata.primaryCtaLabel
      : 'Book Free Trial'
  const primaryCtaUrl =
    typeof heroBlock.metadata.primaryCtaUrl === 'string' ? heroBlock.metadata.primaryCtaUrl : '/programs'
  const secondaryCtaLabel =
    typeof heroBlock.metadata.secondaryCtaLabel === 'string'
      ? heroBlock.metadata.secondaryCtaLabel
      : 'Explore Programs'
  const secondaryCtaUrl =
    typeof heroBlock.metadata.secondaryCtaUrl === 'string'
      ? heroBlock.metadata.secondaryCtaUrl
      : '/programs'
  const badgeText =
    typeof heroBlock.metadata.badgeText === 'string' && heroBlock.metadata.badgeText.trim().length > 0
      ? heroBlock.metadata.badgeText
      : heroBlock.subtitle ?? "Columbus, Ohio's Premier Youth Soccer Academy"
  const backgroundImageUrl =
    typeof heroBlock.metadata.backgroundImageUrl === 'string' &&
    heroBlock.metadata.backgroundImageUrl.trim().length > 0
      ? heroBlock.metadata.backgroundImageUrl
      : 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1800&q=80'
  const overlayOpacity =
    typeof heroBlock.metadata.overlayOpacity === 'number'
      ? clamp(heroBlock.metadata.overlayOpacity, 0.35, 0.9)
      : 0.7

  const stats = Array.isArray(heroBlock.metadata.stats)
    ? heroBlock.metadata.stats.filter(
        (stat): stat is HeroStat =>
          Boolean(stat) &&
          typeof stat.value === 'string' &&
          stat.value.trim().length > 0 &&
          typeof stat.label === 'string' &&
          stat.label.trim().length > 0
      )
    : []

  const trustItems = useMemo(() => {
    const safeTrustItems = Array.isArray(heroBlock.metadata.trustItems)
      ? heroBlock.metadata.trustItems.filter(
          (item): item is HeroTrustItem =>
            Boolean(item) &&
            (typeof item.value === 'string' || typeof item.value === 'undefined') &&
            typeof item.label === 'string' &&
            item.label.trim().length > 0 &&
            (typeof item.icon === 'string' || typeof item.icon === 'undefined')
        )
      : []

    if (safeTrustItems.length > 0) {
      return safeTrustItems
    }

    return [
      { value: '4.9', label: 'Parent Rating', icon: 'star' },
      { value: '500+', label: 'Athletes Trained', icon: 'users' },
      { label: 'Licensed & Background Checked Coaches', icon: 'shield' },
    ] satisfies HeroTrustItem[]
  }, [heroBlock.metadata.trustItems])

  return (
    <section className="relative overflow-hidden text-white">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center scale-110"
          style={{
            backgroundImage: `url("${backgroundImageUrl}")`,
            backgroundPosition: `center calc(45% + ${scrollY * 0.12}px)`,
          }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#0f3d2f] via-[#126346] to-[#12263a]"
          style={{ opacity: overlayOpacity }}
        />
        <div className="absolute inset-0 pitch-lines opacity-70" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 bg-white/10 border border-white/30 text-green-100 text-sm font-semibold px-4 py-1 rounded-full mb-6 backdrop-blur-sm">
            <Trophy className="h-4 w-4" />
            {badgeText}
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            {titleParts.length > 1 ? (
              <>
                {titleParts[0]}
                <span className="text-yellow-400">{highlightWord}</span>
                {titleParts.slice(1).join(highlightWord)}
              </>
            ) : (
              title
            )}
          </h1>

          <p className="text-lg sm:text-xl text-green-100 mb-10 max-w-2xl">{heroBlock.body}</p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={primaryCtaUrl}
              className="lift-button bg-yellow-400 hover:bg-yellow-300 text-green-900 font-bold px-8 py-4 rounded-xl text-lg text-center shadow-lg"
            >
              {primaryCtaLabel}
            </Link>
            <Link
              href={secondaryCtaUrl}
              className="lift-button border-2 border-white/85 hover:bg-white hover:text-green-700 text-white font-bold px-8 py-4 rounded-xl text-lg text-center"
            >
              {secondaryCtaLabel}
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl border border-white/20 bg-black/20 p-4 backdrop-blur-sm">
            {trustItems.map((item) => (
              <div key={`${item.value ?? 'value'}-${item.label}`} className="flex items-center gap-2 text-sm text-green-100">
                {renderTrustIcon(item.icon ?? 'star')}
                <span className="font-semibold text-white">{item.value ? `${item.value} ` : ''}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap gap-8">
            {(stats.length > 0
              ? stats
              : [
                  { value: '500+', label: 'Athletes Trained' },
                  { value: '10+', label: 'Years Experience' },
                  { value: '95%', label: 'Satisfaction Rate' },
                ]
            ).map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-extrabold text-yellow-400">{stat.value}</div>
                <div className="text-green-100 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
