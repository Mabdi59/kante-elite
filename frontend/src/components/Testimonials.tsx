const testimonials = [
  {
    name: 'Marcus Johnson',
    role: 'Parent of U12 player',
    avatar: 'MJ',
    text: 'Kante Elite completely transformed my son\'s game. After just 3 months of private sessions, he earned a starting spot on his travel team. The coaches are professional, patient, and genuinely care about each child\'s progress.',
    stars: 5,
  },
  {
    name: 'Sarah Williams',
    role: 'Parent of U10 player',
    avatar: 'SW',
    text: 'We\'ve tried other soccer academies in Columbus, but none compare to Kante Elite. The group sessions are well-organized, small enough for individual attention, and my daughter absolutely loves going every week!',
    stars: 5,
  },
  {
    name: 'David Chen',
    role: 'Parent of U14 player',
    avatar: 'DC',
    text: 'The Speed & Agility program is incredible. My son went from struggling to keep pace to being the fastest player on his team. The science-based approach and real tracking data keep us motivated and on track.',
    stars: 5,
  },
]

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-1 mb-4">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="text-yellow-400 text-lg">★</span>
      ))}
    </div>
  )
}

export default function Testimonials() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            What Parents Say
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Don&apos;t take our word for it — hear from Columbus families who&apos;ve seen real results.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:shadow-md transition-shadow"
            >
              <StarRating count={t.stars} />
              <p className="text-gray-700 italic mb-6">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{t.name}</div>
                  <div className="text-sm text-gray-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
