'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { useSiteContentBlock } from '@/lib/siteContent'

const DEFAULT_TIERS = [
  {
    name: 'Group Session',
    price: 35,
    per: 'per session',
    description: 'Train with peers in a competitive, fun environment.',
    features: ['Small groups (6-10 players)', 'Expert group coaching', 'Skill drills & scrimmages', 'Session recap notes'],
    cta: 'Book Group',
    ctaUrl: '/programs?type=GROUP&book=true',
    highlight: false,
  },
  {
    name: 'Speed & Agility',
    price: 45,
    per: 'per session',
    description: 'Specialized conditioning to maximize athletic performance.',
    features: ['Performance benchmarking', 'Sport-science training plans', 'Video analysis', 'Progress tracking dashboard'],
    cta: 'Book Speed',
    ctaUrl: '/programs?type=SPEED&book=true',
    highlight: true,
  },
  {
    name: 'Private Training',
    price: 80,
    per: 'per session',
    description: "1-on-1 coaching tailored to your child's development goals.",
    features: ['Fully customized plan', 'Elite 1-on-1 coaching', 'Flexible scheduling', 'Parent progress reports'],
    cta: 'Book Private',
    ctaUrl: '/programs?type=PRIVATE&book=true',
    highlight: false,
  },
]

type PricingTier = {
  name: string
  price: number
  per: string
  description: string
  features: string[]
  cta: string
  ctaUrl?: string
  highlight: boolean
}

type PricingBlockMeta = {
  tiers: PricingTier[]
  packageSessions: number
  packageDiscountPercent: number
  packageLabel: string
  singleLabel: string
  packageSuffix: string
}

function toCurrency(value: number): string {
  return `$${value.toFixed(0)}`
}

export default function PricingCards() {
  const [pricingMode, setPricingMode] = useState<'single' | 'package'>('single')

  const pricingBlock = useSiteContentBlock<PricingBlockMeta>('home.pricing', {
    key: 'home.pricing',
    title: 'Transparent Pricing',
    body: "No hidden fees. Choose the training program that fits your athlete's goals and budget.",
    metadata: {
      tiers: DEFAULT_TIERS as PricingTier[],
      packageSessions: 8,
      packageDiscountPercent: 15,
      packageLabel: '8-Session Package',
      singleLabel: 'Single Session',
      packageSuffix: 'package total',
    },
  })

  const tiers = Array.isArray(pricingBlock.metadata.tiers)
    ? pricingBlock.metadata.tiers.filter(
        (tier): tier is PricingTier =>
          Boolean(tier) &&
          typeof tier.name === 'string' &&
          typeof tier.price === 'number' &&
          typeof tier.per === 'string' &&
          typeof tier.description === 'string' &&
          Array.isArray(tier.features) &&
          tier.features.every((item) => typeof item === 'string') &&
          typeof tier.cta === 'string' &&
          (typeof tier.ctaUrl === 'string' || typeof tier.ctaUrl === 'undefined') &&
          typeof tier.highlight === 'boolean'
      )
    : []
  const safeTiers = tiers.length > 0 ? tiers : (DEFAULT_TIERS as PricingTier[])

  const packageSessions =
    typeof pricingBlock.metadata.packageSessions === 'number' && pricingBlock.metadata.packageSessions >= 2
      ? Math.round(pricingBlock.metadata.packageSessions)
      : 8
  const packageDiscountPercent =
    typeof pricingBlock.metadata.packageDiscountPercent === 'number'
      ? Math.max(0, Math.min(60, pricingBlock.metadata.packageDiscountPercent))
      : 15
  const packageLabel =
    typeof pricingBlock.metadata.packageLabel === 'string' && pricingBlock.metadata.packageLabel.trim().length > 0
      ? pricingBlock.metadata.packageLabel
      : `${packageSessions}-Session Package`
  const singleLabel =
    typeof pricingBlock.metadata.singleLabel === 'string' && pricingBlock.metadata.singleLabel.trim().length > 0
      ? pricingBlock.metadata.singleLabel
      : 'Single Session'
  const packageSuffix =
    typeof pricingBlock.metadata.packageSuffix === 'string' && pricingBlock.metadata.packageSuffix.trim().length > 0
      ? pricingBlock.metadata.packageSuffix
      : 'package total'

  const computedTiers = useMemo(() => {
    return safeTiers.map((tier) => {
      const packageTotal = tier.price * packageSessions * (1 - packageDiscountPercent / 100)
      const normalizedPackage = Math.max(1, Math.round(packageTotal))
      return {
        ...tier,
        displayPrice: pricingMode === 'single' ? tier.price : normalizedPackage,
        displayPer: pricingMode === 'single' ? tier.per : packageSuffix,
        saveAmount: Math.round(tier.price * packageSessions - normalizedPackage),
      }
    })
  }, [safeTiers, pricingMode, packageSessions, packageDiscountPercent, packageSuffix])

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            {pricingBlock.title ?? 'Transparent Pricing'}
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">{pricingBlock.body}</p>
        </div>

        <div className="mx-auto mb-10 inline-flex rounded-xl border border-gray-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setPricingMode('single')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              pricingMode === 'single' ? 'bg-green-700 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {singleLabel}
          </button>
          <button
            type="button"
            onClick={() => setPricingMode('package')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              pricingMode === 'package' ? 'bg-green-700 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {packageLabel}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {computedTiers.map((tier) => (
            <article
              key={tier.name}
              className={`rounded-2xl p-8 flex flex-col ${
                tier.highlight
                  ? 'bg-green-700 text-white shadow-2xl md:scale-[1.04] ring-2 ring-yellow-300/70'
                  : 'bg-white border border-gray-200 shadow-md elevate-card'
              }`}
            >
              {tier.highlight && (
                <span className="inline-block bg-yellow-400 text-green-900 text-xs font-bold px-3 py-1 rounded-full mb-4 self-start">
                  MOST POPULAR
                </span>
              )}

              <h3 className={`text-xl font-bold mb-1 ${tier.highlight ? 'text-white' : 'text-gray-900'}`}>{tier.name}</h3>
              <p className={`text-sm mb-5 ${tier.highlight ? 'text-green-200' : 'text-gray-500'}`}>{tier.description}</p>

              <div className="mb-2">
                <span className={`text-4xl font-extrabold ${tier.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {toCurrency(tier.displayPrice)}
                </span>
                <span className={`text-sm ml-1 ${tier.highlight ? 'text-green-200' : 'text-gray-500'}`}>{tier.displayPer}</span>
              </div>

              {pricingMode === 'package' && (
                <div className={`mb-5 text-sm ${tier.highlight ? 'text-yellow-200' : 'text-green-700'} font-semibold`}>
                  Save {toCurrency(tier.saveAmount)} with package pricing
                </div>
              )}

              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className={`h-4 w-4 ${tier.highlight ? 'text-yellow-300' : 'text-green-600'}`} />
                    <span className={tier.highlight ? 'text-green-100' : 'text-gray-700'}>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={tier.ctaUrl ?? '/programs?book=true'}
                className={`lift-button text-center font-bold py-3 rounded-xl ${
                  tier.highlight
                    ? 'bg-yellow-400 text-green-900 hover:bg-yellow-300'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {tier.cta}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
