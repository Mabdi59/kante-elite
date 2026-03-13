import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Privacy Policy</h1>
      <p className="text-gray-600 mb-4">We collect only the information needed to operate training, booking, and support workflows.</p>
      <p className="text-gray-600 mb-4">Personal data is used for scheduling, communication, payment processing, and account security.</p>
      <p className="text-gray-600">For any privacy questions, contact <a className="text-green-700 font-semibold" href="mailto:info@kanteelite.com">info@kanteelite.com</a>.</p>
    </div>
  )
}
