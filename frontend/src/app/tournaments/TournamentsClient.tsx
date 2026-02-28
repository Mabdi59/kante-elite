'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { getTournaments } from '@/lib/api'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(0)}`
}

const statusColors: Record<string, string> = {
  UPCOMING: 'bg-blue-100 text-blue-700',
  ONGOING: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-600',
}

export default function TournamentsClient() {
  const { data: tournaments, isLoading, isError } = useQuery({
    queryKey: ['tournaments'],
    queryFn: getTournaments,
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Tournaments</h1>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
          Compete in Kante Elite youth soccer tournaments across the Columbus area. Register your
          team and bring home the trophy!
        </p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
          Failed to load tournaments. Please try again later.
        </div>
      )}

      {tournaments && tournaments.length === 0 && (
        <div className="text-center text-gray-500 py-20">
          No tournaments scheduled yet. Check back soon!
        </div>
      )}

      {tournaments && tournaments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tournaments.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl shadow-md p-6 flex flex-col hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${statusColors[t.status] ?? 'bg-gray-100 text-gray-600'}`}
                >
                  {t.status}
                </span>
                <span className="text-lg font-extrabold text-green-700">
                  {formatPrice(t.entryFeeInCents)}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{t.name}</h2>
              {t.description && (
                <p className="text-gray-500 text-sm mb-4 flex-1">{t.description}</p>
              )}
              <div className="text-sm text-gray-600 space-y-1 mb-5">
                <div>📅 {formatDate(t.startDate)} – {formatDate(t.endDate)}</div>
                <div>📍 {t.location}</div>
                <div>
                  👥 {t.registeredTeams}/{t.maxTeams} teams registered
                </div>
                <div>🏷 Age groups: {t.ageGroups.join(', ')}</div>
              </div>
              <Link
                href={`/tournaments/${t.id}`}
                className={`text-center font-bold py-3 rounded-xl transition-colors ${
                  t.status === 'COMPLETED' || t.registeredTeams >= t.maxTeams
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed pointer-events-none'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {t.status === 'COMPLETED'
                  ? 'Completed'
                  : t.registeredTeams >= t.maxTeams
                  ? 'Full'
                  : 'View & Register'}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
