import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'About Us' }

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6">
          About Kante Elite Training
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Founded in Columbus, Ohio, Kante Elite Training is dedicated to developing the next
          generation of soccer champions through expert coaching, structured programs, and a love
          for the beautiful game.
        </p>
      </div>

      {/* Mission */}
      <div className="bg-green-700 text-white rounded-3xl p-10 mb-16">
        <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
        <p className="text-green-100 text-lg leading-relaxed">
          To provide every young athlete in Columbus with access to world-class soccer training —
          regardless of skill level. We believe in developing the whole player: technical
          excellence, tactical intelligence, physical fitness, and mental resilience.
        </p>
      </div>

      {/* Values */}
      <div className="mb-16">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-10">Our Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: '🏆',
              title: 'Excellence',
              desc: 'We hold ourselves and our athletes to the highest standards — on and off the pitch.',
            },
            {
              icon: '🤝',
              title: 'Respect',
              desc: 'We foster an inclusive environment where every player feels valued, heard, and supported.',
            },
            {
              icon: '💪',
              title: 'Dedication',
              desc: 'We believe champions are made through consistent hard work, not shortcuts.',
            },
          ].map((v) => (
            <div key={v.title} className="text-center bg-gray-50 rounded-2xl p-8">
              <div className="text-5xl mb-4">{v.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{v.title}</h3>
              <p className="text-gray-600">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Coaches */}
      <div className="mb-16">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-10">
          Meet Our Coaches
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              name: 'Marcus Kante',
              title: 'Head Coach & Founder',
              bio: 'Former Division I collegiate player with 15+ years of youth coaching experience. UEFA B License holder. Passionate about developing complete athletes.',
              initials: 'MK',
            },
            {
              name: 'Aisha Thompson',
              title: 'Speed & Agility Specialist',
              bio: 'Certified strength & conditioning specialist (CSCS) with a background in exercise science. Expert in athletic performance for youth athletes ages 8–18.',
              initials: 'AT',
            },
            {
              name: 'Carlos Rivera',
              title: 'Technical Coach',
              bio: 'Former professional player in MLS developmental leagues. Specializes in individual technical development, first touch, and ball mastery.',
              initials: 'CR',
            },
            {
              name: 'Jennifer Park',
              title: 'Group Training Coach',
              bio: 'National Soccer Coaches Association (NSCAA) certified. Focuses on tactical awareness and team dynamics for youth group sessions.',
              initials: 'JP',
            },
          ].map((c) => (
            <div key={c.name} className="flex gap-5 bg-white rounded-2xl border border-gray-200 p-6">
              <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {c.initials}
              </div>
              <div>
                <div className="font-bold text-gray-900 text-lg">{c.name}</div>
                <div className="text-green-700 font-medium text-sm mb-2">{c.title}</div>
                <p className="text-gray-600 text-sm">{c.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gray-900 text-white rounded-3xl p-10">
        <h2 className="text-2xl font-bold text-center mb-8">By the Numbers</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '500+', label: 'Athletes Trained' },
            { value: '10+', label: 'Years in Columbus' },
            { value: '4', label: 'Elite Coaches' },
            { value: '95%', label: 'Parent Satisfaction' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-4xl font-extrabold text-yellow-400">{s.value}</div>
              <div className="text-gray-400 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
