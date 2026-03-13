'use client'

import Link from 'next/link'

type MobileStickyCtaProps = {
  label: string
  href: string
}

export default function MobileStickyCta({ label, href }: MobileStickyCtaProps) {
  return (
    <div className="md:hidden fixed inset-x-0 bottom-0 z-40 px-4 mobile-safe-bottom pointer-events-none">
      <div className="pointer-events-auto">
        <Link
          href={href}
          className="lift-button w-full inline-flex items-center justify-center rounded-xl bg-yellow-400 px-5 py-3 text-sm font-extrabold text-green-900 shadow-xl"
        >
          {label}
        </Link>
      </div>
    </div>
  )
}
