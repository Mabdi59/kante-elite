import Link from 'next/link'

const programs = [
  {
    icon: '🎯',
    title: 'Private Training',
    description:
      'One-on-one sessions tailored to your child\'s skill level. Our elite coaches focus on technique, positioning, and individual development.',
    highlights: ['Custom curriculum', 'Flexible scheduling', 'Rapid skill development'],
    href: '/programs',
  },
  {
    icon: '👥',
    title: 'Group Sessions',
    description:
      'Train alongside peers in a competitive, fun environment. Build teamwork, communication, and tactical awareness.',
    highlights: ['Small group sizes (6–10)', 'Team dynamics', 'Peer competition'],
    href: '/programs',
  },
  {
    icon: '⚡',
    title: 'Speed & Agility',
    description:
      'Specialized conditioning programs designed to improve sprinting speed, quick turns, and overall athleticism.',
    highlights: ['Performance tracking', 'Sport-science backed', 'All skill levels'],
    href: '/programs',
  },
]

export default function Features() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Our Training Programs
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Every program is designed by professional coaches to help young athletes reach their
            full potential on and off the pitch.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {programs.map((p) => (
            <div
              key={p.title}
              className="bg-white rounded-2xl shadow-md p-8 flex flex-col hover:shadow-xl transition-shadow"
            >
              <div className="text-5xl mb-4">{p.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{p.title}</h3>
              <p className="text-gray-600 mb-5 flex-1">{p.description}</p>
              <ul className="space-y-2 mb-6">
                {p.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="text-green-600 font-bold">✓</span>
                    {h}
                  </li>
                ))}
              </ul>
              <Link
                href={p.href}
                className="mt-auto text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Learn More
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
