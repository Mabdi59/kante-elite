'use client'

import type { ReactNode } from 'react'
import Hero from '@/components/Hero'
import Features from '@/components/Features'
import Testimonials from '@/components/Testimonials'
import MediaShowcase from '@/components/MediaShowcase'
import PricingCards from '@/components/PricingCards'
import FAQ from '@/components/FAQ'
import LocationMap from '@/components/LocationMap'
import MobileStickyCta from '@/components/MobileStickyCta'
import RevealSection from '@/components/RevealSection'
import ScrollProgressBar from '@/components/ScrollProgressBar'
import { useSiteContentBlock } from '@/lib/siteContent'

type HomeSectionId = 'hero' | 'features' | 'testimonials' | 'media' | 'pricing' | 'faq' | 'location'

type HomeSectionConfig = {
  id: HomeSectionId
  enabled: boolean
  order: number
}

type HomeLayoutMeta = {
  sections: HomeSectionConfig[]
  showScrollProgress: boolean
  showMobileStickyCta: boolean
  mobileStickyCtaLabel: string
  mobileStickyCtaUrl: string
}

const DEFAULT_SECTION_ORDER: HomeSectionConfig[] = [
  { id: 'hero', enabled: true, order: 1 },
  { id: 'features', enabled: true, order: 2 },
  { id: 'testimonials', enabled: true, order: 3 },
  { id: 'media', enabled: true, order: 4 },
  { id: 'pricing', enabled: true, order: 5 },
  { id: 'faq', enabled: true, order: 6 },
  { id: 'location', enabled: true, order: 7 },
]

function isHomeSectionId(value: unknown): value is HomeSectionId {
  return (
    typeof value === 'string' &&
    ['hero', 'features', 'testimonials', 'media', 'pricing', 'faq', 'location'].includes(value)
  )
}

function renderSection(id: HomeSectionId): ReactNode {
  if (id === 'hero') return <Hero />
  if (id === 'features') return <Features />
  if (id === 'testimonials') return <Testimonials />
  if (id === 'media') return <MediaShowcase />
  if (id === 'pricing') return <PricingCards />
  if (id === 'faq') return <FAQ />
  return <LocationMap />
}

export default function HomePageSections() {
  const layoutBlock = useSiteContentBlock<HomeLayoutMeta>('home.layout', {
    key: 'home.layout',
    metadata: {
      sections: DEFAULT_SECTION_ORDER,
      showScrollProgress: true,
      showMobileStickyCta: true,
      mobileStickyCtaLabel: 'Book Free Trial',
      mobileStickyCtaUrl: '/programs',
    },
  })

  const customSections = Array.isArray(layoutBlock.metadata.sections)
    ? layoutBlock.metadata.sections.filter(
        (section): section is HomeSectionConfig =>
          Boolean(section) &&
          isHomeSectionId(section.id) &&
          typeof section.enabled === 'boolean' &&
          typeof section.order === 'number'
      )
    : []

  const mergedSections = DEFAULT_SECTION_ORDER.map((base) => {
    const override = customSections.find((candidate) => candidate.id === base.id)
    return override ? { ...base, ...override } : base
  })
    .filter((section) => section.enabled)
    .sort((a, b) => a.order - b.order)

  const showScrollProgress = Boolean(layoutBlock.metadata.showScrollProgress)
  const showMobileStickyCta = Boolean(layoutBlock.metadata.showMobileStickyCta)
  const mobileStickyCtaLabel =
    typeof layoutBlock.metadata.mobileStickyCtaLabel === 'string' &&
    layoutBlock.metadata.mobileStickyCtaLabel.trim().length > 0
      ? layoutBlock.metadata.mobileStickyCtaLabel
      : 'Book Free Trial'
  const mobileStickyCtaUrl =
    typeof layoutBlock.metadata.mobileStickyCtaUrl === 'string' &&
    layoutBlock.metadata.mobileStickyCtaUrl.trim().length > 0
      ? layoutBlock.metadata.mobileStickyCtaUrl
      : '/programs'

  return (
    <>
      {showScrollProgress && <ScrollProgressBar />}
      {mergedSections.map((section) =>
        section.id === 'hero' ? (
          <div key={section.id}>{renderSection(section.id)}</div>
        ) : (
          <RevealSection key={section.id}>{renderSection(section.id)}</RevealSection>
        )
      )}
      {showMobileStickyCta && <div className="h-20 md:hidden" aria-hidden="true" />}
      {showMobileStickyCta && <MobileStickyCta label={mobileStickyCtaLabel} href={mobileStickyCtaUrl} />}
    </>
  )
}
