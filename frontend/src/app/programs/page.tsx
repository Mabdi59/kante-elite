import type { Metadata } from 'next'
import { Suspense } from 'react'
import ProgramsClient from './ProgramsClient'

export const metadata: Metadata = { title: 'Programs' }

export default function ProgramsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">Loading programs...</div>}>
      <ProgramsClient />
    </Suspense>
  )
}
