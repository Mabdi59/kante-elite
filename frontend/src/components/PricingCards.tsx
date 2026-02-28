import Link from 'next/link'

const tiers = [
  {
    name: 'Group Session',
    price: 35,
    per: 'per session',
    description: 'Train with peers in a competitive, fun environment.',
    features: [
      'Small groups (6–10 players)',
      'Expert group coaching',
      'Skill drills & scrimmages',
      'Session recap notes',
    ],
    cta: 'Book Group',
    highlight: false,
  },
  {
    name: 'Speed & Agility',
    price: 45,
    per: 'per session',
    description: 'Specialized conditioning to maximize athletic performance.',
    features: [
      'Performance benchmarking',
      'Sport-science training plans',
      'Video analysis',
      'Progress tracking dashboard',
    ],
    cta: 'Book Speed',
    highlight: true,
  },
  {
    name: 'Private Training',
    price: 80,
    per: 'per session',
    description: '1-on-1 coaching tailored to your child\'s development goals.',
    features: [
      'Fully customized plan',
      'Elite 1-on-1 coaching',
      'Flexible scheduling',
      'Parent progress reports',
    ],
    cta: 'Book Private',
    highlight: false,
  },
]

export default function PricingCards() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Transparent Pricing
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            No hidden fees. Choose the training program that fits your athlete&apos;s goals and budget.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`rounded-2xl p-8 flex flex-col ${
                t.highlight
                  ? 'bg-green-700 text-white shadow-2xl scale-105'
                  : 'bg-white border border-gray-200 shadow-md'
              }`}
            >
              {t.highlight && (
                <span className="inline-block bg-yellow-400 text-green-900 text-xs font-bold px-3 py-1 rounded-full mb-4 self-start">
                  MOST POPULAR
                </span>
              )}
              <h3
                className={`text-xl font-bold mb-1 ${t.highlight ? 'text-white' : 'text-gray-900'}`}
              >
                {t.name}
              </h3>
              <p className={`text-sm mb-5 ${t.highlight ? 'text-green-200' : 'text-gray-500'}`}>
                {t.description}
              </p>
              <div className="mb-6">
                <span className={`text-4xl font-extrabold ${t.highlight ? 'text-white' : 'text-gray-900'}`}>
                  ${t.price}
                </span>
                <span className={`text-sm ml-1 ${t.highlight ? 'text-green-200' : 'text-gray-500'}`}>
                  {t.per}
                </span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <span className={t.highlight ? 'text-yellow-300' : 'text-green-600'}>✓</span>
                    <span className={t.highlight ? 'text-green-100' : 'text-gray-700'}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/programs"
                className={`text-center font-bold py-3 rounded-xl transition-colors ${
                  t.highlight
                    ? 'bg-yellow-400 text-green-900 hover:bg-yellow-300'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {t.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
