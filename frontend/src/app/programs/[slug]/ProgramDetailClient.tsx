'use client'

import Link from 'next/link'
import { ArrowRight, CalendarDays, CheckCircle2, ShieldCheck } from 'lucide-react'
import { useSiteContentBlock } from '@/lib/siteContent'

type ProgramDetail = {
  slug: 'private' | 'group' | 'speed'
  title: string
  summary: string
  startingAt: string
  ageGroups: string
  schedule: string[]
  whatToBring: string[]
  ctaLabel: string
  ctaUrl: string
}

type ProgramDetailsMeta = {
  items: ProgramDetail[]
}

const DEFAULT_ITEMS: ProgramDetail[] = [
  {
    slug: 'private',
    title: 'Private Training',
    summary: 'One-on-one elite coaching built around your athlete’s goals and current development needs.',
    startingAt: '$80/session',
    ageGroups: 'U8 - U18',
    schedule: ['Mon-Fri: 3:00 PM - 8:00 PM', 'Sat: 8:00 AM - 2:00 PM'],
    whatToBring: ['Soccer cleats', 'Water bottle', 'Shin guards', 'Positive mindset'],
    ctaLabel: 'Book Private Session',
    ctaUrl: '/programs?type=PRIVATE&book=true',
  },
  {
    slug: 'group',
    title: 'Group Sessions',
    summary: 'High-energy small group training focused on tactical IQ, teamwork, and technical consistency.',
    startingAt: '$35/session',
    ageGroups: 'U8 - U16',
    schedule: ['Tue/Thu: 5:00 PM - 7:00 PM', 'Sat: 9:00 AM - 12:00 PM'],
    whatToBring: ['Soccer cleats', 'Water bottle', 'Practice jersey', 'Shin guards'],
    ctaLabel: 'Book Group Session',
    ctaUrl: '/programs?type=GROUP&book=true',
  },
  {
    slug: 'speed',
    title: 'Speed & Agility',
    summary: 'Performance-focused conditioning program to improve acceleration, balance, and change of direction.',
    startingAt: '$45/session',
    ageGroups: 'U10 - U18',
    schedule: ['Mon/Wed: 6:00 PM - 7:30 PM', 'Sun: 10:00 AM - 11:30 AM'],
    whatToBring: ['Running shoes or cleats', 'Water bottle', 'Light resistance band'],
    ctaLabel: 'Book Speed Session',
    ctaUrl: '/programs?type=SPEED&book=true',
  },
]

export default function ProgramDetailClient({ slug }: { slug: 'private' | 'group' | 'speed' }) {
  const detailsBlock = useSiteContentBlock<ProgramDetailsMeta>('programs.details', {
    key: 'programs.details',
    metadata: {
      items: DEFAULT_ITEMS,
    },
  })

  const items = Array.isArray(detailsBlock.metadata.items)
    ? detailsBlock.metadata.items.filter(
        (item): item is ProgramDetail =>
          Boolean(item) &&
          (item.slug === 'private' || item.slug === 'group' || item.slug === 'speed') &&
          typeof item.title === 'string' &&
          typeof item.summary === 'string' &&
          typeof item.startingAt === 'string' &&
          typeof item.ageGroups === 'string' &&
          Array.isArray(item.schedule) &&
          item.schedule.every((entry) => typeof entry === 'string') &&
          Array.isArray(item.whatToBring) &&
          item.whatToBring.every((entry) => typeof entry === 'string') &&
          typeof item.ctaLabel === 'string' &&
          typeof item.ctaUrl === 'string'
      )
    : []

  const allItems = items.length > 0 ? items : DEFAULT_ITEMS
  const detail = allItems.find((item) => item.slug === slug) ?? allItems[0]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <Link href="/programs" className="text-sm font-semibold text-green-700 hover:underline">
        Back to all programs
      </Link>

      <section className="mt-5 rounded-3xl bg-white border border-gray-200 shadow-sm p-8 sm:p-10">
        <div className="inline-flex rounded-full bg-green-100 text-green-800 text-xs font-bold px-3 py-1 mb-4">
          Program Detail
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">{detail.title}</h1>
        <p className="text-gray-600 text-lg mb-6">{detail.summary}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Starting At</div>
            <div className="mt-1 text-xl font-extrabold text-green-700">{detail.startingAt}</div>
          </div>
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Age Groups</div>
            <div className="mt-1 text-xl font-extrabold text-gray-900">{detail.ageGroups}</div>
          </div>
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Includes</div>
            <div className="mt-1 text-base font-semibold text-gray-900">Structured coaching and progress support</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 font-bold text-gray-900 mb-3">
              <CalendarDays className="h-5 w-5 text-green-700" />
              Schedule
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              {detail.schedule.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 font-bold text-gray-900 mb-3">
              <ShieldCheck className="h-5 w-5 text-green-700" />
              What to Bring
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              {detail.whatToBring.map((entry) => (
                <li key={entry} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{entry}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Link
          href={detail.ctaUrl}
          className="lift-button inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 font-extrabold text-green-900 hover:bg-yellow-300"
        >
          {detail.ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  )
}
