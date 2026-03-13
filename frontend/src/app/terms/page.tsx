import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms',
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Terms of Service</h1>
      <p className="text-gray-600 mb-4">Participation in sessions requires accurate registration details and a completed booking.</p>
      <p className="text-gray-600 mb-4">Parents and guardians are responsible for timely arrival, pickup, and athlete readiness.</p>
      <p className="text-gray-600">By using the platform, you agree to these terms and any posted policy updates.</p>
    </div>
  )
}
