'use client'

import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useSiteContentBlock } from '@/lib/siteContent'

const DEFAULT_FAQS = [
  {
    q: 'What age groups do you train?',
    a: 'We train players ages 6-18, covering U8 through U18 age groups.',
    visible: true,
    order: 1,
  },
  {
    q: 'How do I book a session?',
    a: 'Create a free account, browse available sessions on the Programs page, and click Book Now.',
    visible: true,
    order: 2,
  },
  {
    q: 'Where are sessions held?',
    a: 'All training sessions take place at our primary facility in Columbus, OH.',
    visible: true,
    order: 3,
  },
  {
    q: 'What is your cancellation policy?',
    a: 'Cancellations made 24 hours or more before a session receive a full refund or credit.',
    visible: true,
    order: 4,
  },
]

type FAQItemData = {
  q: string
  a: string
  visible?: boolean
  order?: number
}

type FAQBlockMeta = {
  items: FAQItemData[]
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen((previous) => !previous)}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
        aria-expanded={open}
      >
        <span className="font-semibold text-gray-900">{q}</span>
        <ChevronDown
          size={20}
          className={`text-green-600 flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-5 text-gray-600 leading-relaxed">{a}</p>
        </div>
      </div>
    </div>
  )
}

export default function FAQ() {
  const faqBlock = useSiteContentBlock<FAQBlockMeta>('home.faq', {
    key: 'home.faq',
    title: 'Frequently Asked Questions',
    body: 'Everything you need to know about training with us.',
    metadata: { items: DEFAULT_FAQS as FAQItemData[] },
  })

  const safeFaqs = useMemo(() => {
    const parsedItems = Array.isArray(faqBlock.metadata.items)
      ? faqBlock.metadata.items.filter(
          (item): item is FAQItemData =>
            Boolean(item) &&
            typeof item.q === 'string' &&
            item.q.trim().length > 0 &&
            typeof item.a === 'string' &&
            item.a.trim().length > 0 &&
            (typeof item.visible === 'boolean' || typeof item.visible === 'undefined') &&
            (typeof item.order === 'number' || typeof item.order === 'undefined')
        )
      : []
    const source = parsedItems.length > 0 ? parsedItems : (DEFAULT_FAQS as FAQItemData[])
    return source
      .filter((item) => item.visible !== false)
      .sort((left, right) => (left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER))
  }, [faqBlock.metadata.items])

  const faqSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: safeFaqs.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
    }),
    [safeFaqs]
  )

  return (
    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            {faqBlock.title ?? 'Frequently Asked Questions'}
          </h2>
          <p className="text-gray-600">{faqBlock.body}</p>
        </div>
        <div className="space-y-4">
          {safeFaqs.map((faq) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </section>
  )
}
