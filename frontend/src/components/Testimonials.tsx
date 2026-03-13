'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Star } from 'lucide-react'
import { useSiteContentBlock } from '@/lib/siteContent'

const DEFAULT_TESTIMONIALS = [
  {
    name: 'Marcus Johnson',
    role: 'Parent',
    childAge: 'U12',
    avatar: 'MJ',
    imageUrl: '',
    text: "Kante Elite completely transformed my son's game. After just 3 months of private sessions, he earned a starting spot on his travel team.",
    stars: 5,
  },
  {
    name: 'Sarah Williams',
    role: 'Parent',
    childAge: 'U10',
    avatar: 'SW',
    imageUrl: '',
    text: "We've tried other soccer academies in Columbus, but none compare to Kante Elite. The group sessions are well-organized and effective.",
    stars: 5,
  },
  {
    name: 'David Chen',
    role: 'Parent',
    childAge: 'U14',
    avatar: 'DC',
    imageUrl: '',
    text: 'The Speed & Agility program is incredible. My son became one of the quickest players on his team within one season.',
    stars: 5,
  },
]

type TestimonialItem = {
  name: string
  role: string
  childAge?: string
  avatar: string
  imageUrl?: string
  text: string
  stars: number
}

type TestimonialsBlockMeta = {
  items: TestimonialItem[]
}

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-1 mb-4">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
      ))}
    </div>
  )
}

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [touchEndX, setTouchEndX] = useState<number | null>(null)

  const testimonialsBlock = useSiteContentBlock<TestimonialsBlockMeta>('home.testimonials', {
    key: 'home.testimonials',
    title: 'What Parents Say',
    body: "Don't take our word for it - hear from Columbus families who've seen real results.",
    metadata: {
      items: DEFAULT_TESTIMONIALS as TestimonialItem[],
    },
  })

  const items = Array.isArray(testimonialsBlock.metadata.items)
    ? testimonialsBlock.metadata.items.filter(
        (item): item is TestimonialItem =>
          Boolean(item) &&
          typeof item.name === 'string' &&
          typeof item.role === 'string' &&
          (typeof item.childAge === 'string' || typeof item.childAge === 'undefined') &&
          typeof item.avatar === 'string' &&
          (typeof item.imageUrl === 'string' || typeof item.imageUrl === 'undefined') &&
          typeof item.text === 'string' &&
          typeof item.stars === 'number'
      )
    : []
  const safeItems = items.length > 0 ? items : (DEFAULT_TESTIMONIALS as TestimonialItem[])

  useEffect(() => {
    setActiveIndex((previous) => (safeItems.length > 0 ? Math.min(previous, safeItems.length - 1) : 0))
  }, [safeItems.length])

  useEffect(() => {
    if (safeItems.length <= 1) {
      return
    }
    const timer = window.setInterval(() => {
      setActiveIndex((previous) => (previous + 1) % safeItems.length)
    }, 6500)
    return () => window.clearInterval(timer)
  }, [safeItems.length])

  const goToPrevious = () => {
    setActiveIndex((previous) => (previous - 1 + safeItems.length) % safeItems.length)
  }

  const goToNext = () => {
    setActiveIndex((previous) => (previous + 1) % safeItems.length)
  }

  const handleTouchEnd = () => {
    if (touchStartX == null || touchEndX == null || safeItems.length <= 1) {
      setTouchStartX(null)
      setTouchEndX(null)
      return
    }
    const delta = touchStartX - touchEndX
    if (Math.abs(delta) >= 45) {
      if (delta > 0) goToNext()
      else goToPrevious()
    }
    setTouchStartX(null)
    setTouchEndX(null)
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            {testimonialsBlock.title ?? 'What Parents Say'}
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">{testimonialsBlock.body}</p>
        </div>

        <div
          className="relative max-w-4xl mx-auto"
          onTouchStart={(event) => setTouchStartX(event.changedTouches[0]?.clientX ?? null)}
          onTouchMove={(event) => setTouchEndX(event.changedTouches[0]?.clientX ?? null)}
          onTouchEnd={handleTouchEnd}
        >
          {safeItems.length > 1 && (
            <>
              <button
                type="button"
                onClick={goToPrevious}
                className="hidden sm:flex absolute -left-5 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:text-green-700 hover:border-green-200"
                aria-label="Previous testimonial"
              >
                {'<'}
              </button>
              <button
                type="button"
                onClick={goToNext}
                className="hidden sm:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:text-green-700 hover:border-green-200"
                aria-label="Next testimonial"
              >
                {'>'}
              </button>
            </>
          )}

          <div className="overflow-hidden rounded-3xl border border-gray-100 shadow-sm bg-gray-50">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {safeItems.map((t) => (
                <article key={`${t.name}-${t.text.slice(0, 24)}`} className="w-full flex-shrink-0 p-8 sm:p-10">
                  <StarRating count={Math.max(1, Math.min(5, t.stars))} />
                  <p className="text-gray-700 italic mb-7 text-lg leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    {t.imageUrl ? (
                      <Image
                        src={t.imageUrl}
                        alt={`${t.name} testimonial`}
                        width={52}
                        height={52}
                        className="h-12 w-12 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">
                        {t.avatar}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-gray-900">{t.name}</div>
                      <div className="text-sm text-gray-500">
                        {t.role}
                        {t.childAge ? ` of ${t.childAge} player` : ''}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {safeItems.length > 1 && (
            <div className="mt-5 flex items-center justify-center gap-2">
              {safeItems.map((item, index) => (
                <button
                  type="button"
                  key={`${item.name}-${index}`}
                  onClick={() => setActiveIndex(index)}
                  className={`h-2.5 rounded-full transition-all ${
                    index === activeIndex ? 'w-8 bg-green-700' : 'w-2.5 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          )}

          <div className="mt-4 text-center text-sm text-gray-500 sm:hidden">Swipe to see more parent stories</div>
        </div>
      </div>
    </section>
  )
}
