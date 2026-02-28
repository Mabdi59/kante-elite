'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    q: 'What age groups do you train?',
    a: 'We train players ages 6–18, covering U8 through U18 age groups. All programs are tailored to the developmental stage of each age group.',
  },
  {
    q: 'How do I book a session?',
    a: 'Create a free account, browse available sessions on the Programs page, and click "Book Now." You\'ll receive an email confirmation within minutes.',
  },
  {
    q: 'Where are sessions held?',
    a: 'All training sessions take place at our primary facility in Columbus, OH (near Easton Town Center). Specific field details are included in your booking confirmation.',
  },
  {
    q: 'What is your cancellation policy?',
    a: 'Cancellations made 24 hours or more before a session receive a full refund or credit. Cancellations within 24 hours may be subject to a 50% cancellation fee.',
  },
  {
    q: 'Do you offer package deals?',
    a: 'Yes! Purchase 5 private sessions and get the 6th free. Group session 10-packs are also available at a 15% discount. Contact us for details.',
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left bg-white hover:bg-gray-50 transition-colors"
        aria-expanded={open}
      >
        <span className="font-semibold text-gray-900">{q}</span>
        <ChevronDown
          size={20}
          className={`text-green-600 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-6 pb-5 bg-white">
          <p className="text-gray-600 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  )
}

export default function FAQ() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600">Everything you need to know about training with us.</p>
        </div>
        <div className="space-y-4">
          {faqs.map((f) => (
            <FAQItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </div>
    </section>
  )
}
