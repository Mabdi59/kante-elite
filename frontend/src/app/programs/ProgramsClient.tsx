'use client'

import { useQuery } from '@tanstack/react-query'
import { getSessions } from '@/lib/api'
import BookingFlow from '@/components/BookingFlow'

export default function ProgramsClient() {
  const { data: sessions, isLoading, isError } = useQuery({
    queryKey: ['sessions'],
    queryFn: getSessions,
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Training Programs</h1>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
          Browse available sessions and book your spot today. We offer Private, Group, and Speed
          &amp; Agility training tailored to every skill level.
        </p>
      </div>

      {/* Session Types Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
        {[
          { type: 'PRIVATE', icon: '🎯', price: '$80/session', desc: 'One-on-one elite coaching' },
          { type: 'GROUP', icon: '👥', price: '$35/session', desc: 'Small groups of 6–10 players' },
          { type: 'SPEED', icon: '⚡', price: '$45/session', desc: 'Speed & agility conditioning' },
        ].map((t) => (
          <div
            key={t.type}
            className="bg-white rounded-2xl border border-gray-200 p-6 text-center shadow-sm"
          >
            <div className="text-4xl mb-3">{t.icon}</div>
            <h2 className="text-lg font-bold text-gray-900">{t.type}</h2>
            <p className="text-gray-500 text-sm mt-1 mb-2">{t.desc}</p>
            <span className="font-bold text-green-700">{t.price}</span>
          </div>
        ))}
      </div>

      {/* Sessions list */}
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Sessions</h2>

      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
          Failed to load sessions. Please try again later.
        </div>
      )}

      {sessions && sessions.length === 0 && (
        <div className="text-center text-gray-500 py-20">
          No sessions available right now. Check back soon!
        </div>
      )}

      {sessions && sessions.length > 0 && <BookingFlow sessions={sessions} />}
    </div>
  )
}
