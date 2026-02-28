'use client'

import { useQuery } from '@tanstack/react-query'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/lib/auth'
import { getMyBookings, getSessions } from '@/lib/api'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

function ParentDashboard() {
  const { data: bookings, isLoading, isError } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: getMyBookings,
  })

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h2>
      {isLoading && (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {isError && (
        <p className="text-red-600 text-center py-10">Failed to load bookings.</p>
      )}
      {bookings && bookings.length === 0 && (
        <div className="text-center text-gray-500 py-16 bg-gray-50 rounded-2xl">
          <div className="text-5xl mb-4">📋</div>
          <p className="font-medium">No bookings yet.</p>
          <a href="/programs" className="text-green-700 font-semibold hover:underline mt-2 inline-block">
            Browse Programs →
          </a>
        </div>
      )}
      {bookings && bookings.length > 0 && (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="font-bold text-gray-900 text-lg">
                    {b.session?.title ?? `Session #${b.sessionId}`}
                  </div>
                  <div className="text-gray-500 text-sm mt-1">
                    Player: <span className="font-medium text-gray-700">{b.playerName}</span>, Age {b.playerAge}
                  </div>
                  {b.session && (
                    <div className="text-gray-500 text-sm">
                      📅 {formatDate(b.session.scheduledAt)} ·{' '}
                      {formatPrice(b.session.priceInCents)}
                    </div>
                  )}
                  {b.notes && <div className="text-gray-400 text-sm mt-1">Note: {b.notes}</div>}
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${statusColors[b.status] ?? 'bg-gray-100 text-gray-600'}`}
                >
                  {b.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CoachDashboard() {
  const { data: sessions, isLoading, isError } = useQuery({
    queryKey: ['sessions'],
    queryFn: getSessions,
  })

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Sessions</h2>
      {isLoading && (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {isError && <p className="text-red-600 text-center py-10">Failed to load sessions.</p>}
      {sessions && sessions.length === 0 && (
        <div className="text-center text-gray-500 py-16 bg-gray-50 rounded-2xl">
          No sessions scheduled.
        </div>
      )}
      {sessions && sessions.length > 0 && (
        <div className="space-y-4">
          {sessions.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="font-bold text-gray-900 text-lg">{s.title}</div>
                  <div className="text-gray-500 text-sm mt-1">
                    📅 {formatDate(s.scheduledAt)} · ⏱ {s.durationMinutes} min
                  </div>
                  <div className="text-gray-500 text-sm">
                    👥 {s.currentParticipants}/{s.maxParticipants} participants
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full">
                    {s.sessionType}
                  </span>
                  <div className="font-bold text-green-700 mt-2">{formatPrice(s.priceInCents)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DashboardInner() {
  const { user, role } = useAuth()

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0] ?? 'Athlete'}! 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {role === 'PARENT' ? 'Track your session bookings below.' : 'View and manage your upcoming sessions.'}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Role', value: role ?? '—', icon: '🎭' },
          { label: 'Email', value: user?.email ?? '—', icon: '✉️' },
          { label: 'Phone', value: user?.phone ?? 'Not set', icon: '📞' },
          { label: 'Member Since', value: user ? new Date(user.createdAt).getFullYear().toString() : '—', icon: '📅' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-xs text-gray-400 font-medium uppercase">{stat.label}</div>
            <div className="font-bold text-gray-800 truncate text-sm mt-0.5">{stat.value}</div>
          </div>
        ))}
      </div>

      {role === 'PARENT' ? <ParentDashboard /> : <CoachDashboard />}
    </div>
  )
}

export default function DashboardClient() {
  return (
    <ProtectedRoute>
      <DashboardInner />
    </ProtectedRoute>
  )
}
