import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-green-800 via-green-700 to-green-600 text-white overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_50%,white_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36">
        <div className="max-w-3xl">
          {/* Badge */}
          <span className="inline-block bg-green-500 bg-opacity-40 border border-green-400 text-green-100 text-sm font-semibold px-4 py-1 rounded-full mb-6">
            🏆 Columbus, Ohio&apos;s Premier Youth Soccer Academy
          </span>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            Train Like a{' '}
            <span className="text-yellow-400">Champion</span>
          </h1>

          {/* Sub-text */}
          <p className="text-lg sm:text-xl text-green-100 mb-10 max-w-2xl">
            Kante Elite Training offers world-class youth soccer coaching in Columbus, OH.
            Whether it&apos;s private sessions, group training, or speed &amp; agility — we develop
            the complete athlete.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/programs"
              className="bg-yellow-400 hover:bg-yellow-300 text-green-900 font-bold px-8 py-4 rounded-xl text-lg transition-colors text-center shadow-lg"
            >
              Book a Session
            </Link>
            <Link
              href="/programs"
              className="border-2 border-white hover:bg-white hover:text-green-700 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors text-center"
            >
              View Programs
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-12 flex flex-wrap gap-8">
            {[
              { value: '500+', label: 'Athletes Trained' },
              { value: '10+', label: 'Years Experience' },
              { value: '95%', label: 'Satisfaction Rate' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-extrabold text-yellow-400">{stat.value}</div>
                <div className="text-green-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
