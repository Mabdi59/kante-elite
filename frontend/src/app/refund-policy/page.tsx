import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Refund Policy',
}

export default function RefundPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Refund Policy</h1>
      <p className="text-gray-600 mb-4">Cancellations made at least 24 hours before a session are eligible for a full refund or account credit.</p>
      <p className="text-gray-600 mb-4">Late cancellations may incur a partial fee based on coach allocation and facility commitments.</p>
      <p className="text-gray-600">For refund support, email <a className="text-green-700 font-semibold" href="mailto:info@kanteelite.com">info@kanteelite.com</a>.</p>
    </div>
  )
}
