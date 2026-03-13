'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { ComponentType } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  User,
  Users,
} from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/lib/auth'
import {
  getAdminBookings,
  getAdminSessions,
  getAdminTournaments,
  getMyBookings,
  getSessions,
} from '@/lib/api'
import type { UserRole } from '@/lib/types'

function formatDate(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return 'TBD'
  }
  return date.toLocaleString('en-US', {
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

type StatTone = 'emerald' | 'blue' | 'amber' | 'slate' | 'rose'

const toneClasses: Record<StatTone, { shell: string; icon: string; label: string; value: string }> = {
  emerald: {
    shell: 'bg-emerald-50 border-emerald-100',
    icon: 'text-emerald-700',
    label: 'text-emerald-700/80',
    value: 'text-emerald-900',
  },
  blue: {
    shell: 'bg-blue-50 border-blue-100',
    icon: 'text-blue-700',
    label: 'text-blue-700/80',
    value: 'text-blue-900',
  },
  amber: {
    shell: 'bg-amber-50 border-amber-100',
    icon: 'text-amber-700',
    label: 'text-amber-700/80',
    value: 'text-amber-900',
  },
  slate: {
    shell: 'bg-slate-50 border-slate-200',
    icon: 'text-slate-700',
    label: 'text-slate-500',
    value: 'text-slate-900',
  },
  rose: {
    shell: 'bg-rose-50 border-rose-100',
    icon: 'text-rose-700',
    label: 'text-rose-700/80',
    value: 'text-rose-900',
  },
}

const bookingStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  FAILED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-gray-100 text-gray-700',
}

const paymentStatusColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-rose-100 text-rose-700',
  EXPIRED: 'bg-gray-100 text-gray-700',
  PAID_AFTER_EXPIRY: 'bg-cyan-100 text-cyan-700',
}

function StatCard({
  label,
  value,
  helper,
  tone,
  icon: Icon,
}: {
  label: string
  value: string | number
  helper?: string
  tone: StatTone
  icon: ComponentType<{ className?: string }>
}) {
  const classes = toneClasses[tone]
  return (
    <div className={`rounded-2xl border p-4 ${classes.shell}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`text-xs uppercase tracking-wide font-semibold ${classes.label}`}>{label}</div>
          <div className={`text-2xl font-black mt-1 ${classes.value}`}>{value}</div>
          {helper && <div className={`text-xs mt-1 ${classes.label}`}>{helper}</div>}
        </div>
        <Icon className={`h-5 w-5 ${classes.icon}`} />
      </div>
    </div>
  )
}

function ParentDashboard() {
  const { data: bookings, isLoading, isError } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: getMyBookings,
  })
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [paymentFilter, setPaymentFilter] = useState('ALL')

  const summary = useMemo(() => {
    const source = bookings ?? []
    const now = Date.now()
    const total = source.length
    const confirmed = source.filter((booking) => booking.status?.toUpperCase() === 'CONFIRMED').length
    const paid = source.filter((booking) => (booking.paymentStatus ?? 'PENDING').toUpperCase() === 'PAID').length
    const upcoming = source.filter((booking) => {
      const dateIso = booking.session?.scheduledAt ?? booking.sessionStartTime
      const date = dateIso ? new Date(dateIso).getTime() : 0
      const status = booking.status?.toUpperCase()
      return (
        Number.isFinite(date) &&
        date > now &&
        status !== 'CANCELLED' &&
        status !== 'FAILED' &&
        status !== 'EXPIRED'
      )
    }).length

    return { total, confirmed, paid, upcoming }
  }, [bookings])

  const filteredBookings = useMemo(() => {
    if (!bookings) {
      return []
    }
    const normalizedQuery = query.trim().toLowerCase()
    const list = bookings.filter((booking) => {
      if (statusFilter !== 'ALL' && booking.status !== statusFilter) {
        return false
      }
      const normalizedPaymentStatus = (booking.paymentStatus ?? 'PENDING').toUpperCase()
      if (paymentFilter !== 'ALL' && normalizedPaymentStatus !== paymentFilter) {
        return false
      }
      if (!normalizedQuery) {
        return true
      }
      const sessionLabel = booking.session?.title ?? booking.sessionTitle ?? ''
      const haystack = `${sessionLabel} ${booking.playerName}`.toLowerCase()
      return haystack.includes(normalizedQuery)
    })

    list.sort((a, b) => {
      const timeA = new Date(a.session?.scheduledAt ?? a.sessionStartTime ?? '').getTime()
      const timeB = new Date(b.session?.scheduledAt ?? b.sessionStartTime ?? '').getTime()
      return timeB - timeA
    })

    return list
  }, [bookings, query, statusFilter, paymentFilter])

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Bookings" value={summary.total} helper="Across all sessions" tone="blue" icon={ClipboardList} />
        <StatCard label="Upcoming" value={summary.upcoming} helper="Future sessions" tone="emerald" icon={CalendarDays} />
        <StatCard label="Confirmed" value={summary.confirmed} helper="Ready to train" tone="slate" icon={ShieldCheck} />
        <StatCard label="Paid" value={summary.paid} helper="Payments complete" tone="amber" icon={CreditCard} />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-black text-gray-900">Booking Center</h2>
          <Link
            href="/programs"
            className="inline-flex items-center gap-1 text-sm font-semibold text-green-700 hover:text-green-800"
          >
            Book new session <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading && (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {isError && <p className="text-red-600 text-center py-10">Failed to load bookings.</p>}
        {bookings && bookings.length === 0 && (
          <div className="text-center text-gray-500 py-16 bg-gray-50 rounded-2xl">
            <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="font-medium">No bookings yet.</p>
            <Link href="/programs" className="text-green-700 font-semibold hover:underline mt-2 inline-block">
              Browse Programs
            </Link>
          </div>
        )}
        {bookings && bookings.length > 0 && (
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 md:p-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <label className="md:col-span-2 relative">
                  <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    placeholder="Search session or player"
                  />
                </label>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="ALL">All Booking Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="FAILED">Failed</option>
                  <option value="EXPIRED">Expired</option>
                </select>
                <select
                  value={paymentFilter}
                  onChange={(event) => setPaymentFilter(event.target.value)}
                  className="border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="ALL">All Payment Statuses</option>
                  <option value="PENDING">Payment Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="FAILED">Payment Failed</option>
                  <option value="EXPIRED">Payment Expired</option>
                  <option value="PAID_AFTER_EXPIRY">Paid After Expiry</option>
                </select>
              </div>
              <p className="text-sm text-gray-500 mt-3">
                Showing {filteredBookings.length} of {bookings.length}
              </p>
            </div>

            {filteredBookings.length === 0 && (
              <div className="text-center text-gray-500 py-10 border border-dashed border-gray-300 rounded-2xl">
                No bookings match your current filters.
              </div>
            )}

            {filteredBookings.map((booking) => {
              const bookingStatus = booking.status?.toUpperCase() ?? 'PENDING'
              const paymentStatus = (booking.paymentStatus ?? 'PENDING').toUpperCase()
              return (
                <div key={booking.id} className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <div className="font-bold text-gray-900 text-lg">
                        {booking.session?.title ?? booking.sessionTitle ?? `Session #${booking.sessionId}`}
                      </div>
                      <div className="text-gray-500 text-sm mt-1">
                        Player: <span className="font-medium text-gray-700">{booking.playerName}</span>
                        {typeof booking.playerAge === 'number' ? `, Age ${booking.playerAge}` : ''}
                      </div>
                      {(booking.session?.scheduledAt || booking.sessionStartTime) && (
                        <div className="text-gray-500 text-sm">
                          Date: {formatDate(booking.session?.scheduledAt ?? booking.sessionStartTime ?? '')} |{' '}
                          {formatPrice(booking.session?.priceInCents ?? booking.sessionPriceInCents ?? 0)}
                        </div>
                      )}
                      {booking.notes && <div className="text-gray-400 text-sm mt-1">Note: {booking.notes}</div>}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${bookingStatusColors[bookingStatus] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {bookingStatus}
                      </span>
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${paymentStatusColors[paymentStatus] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        Payment {paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

function CoachDashboard() {
  const { data: sessions, isLoading, isError } = useQuery({
    queryKey: ['sessions'],
    queryFn: getSessions,
  })

  const summary = useMemo(() => {
    const source = sessions ?? []
    const now = Date.now()
    const upcoming = source.filter((session) => new Date(session.scheduledAt).getTime() >= now).length
    const totalParticipants = source.reduce((sum, session) => sum + (session.currentParticipants ?? 0), 0)
    const fullSessions = source.filter(
      (session) => (session.currentParticipants ?? 0) >= (session.maxParticipants ?? 0) && session.maxParticipants > 0
    ).length
    const revenuePotential = source.reduce((sum, session) => sum + session.priceInCents, 0)
    return { upcoming, totalParticipants, fullSessions, revenuePotential }
  }, [sessions])

  const sortedSessions = useMemo(() => {
    const list = [...(sessions ?? [])]
    list.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    return list
  }, [sessions])

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Upcoming Sessions" value={summary.upcoming} helper="Current schedule" tone="blue" icon={CalendarDays} />
        <StatCard label="Athletes Scheduled" value={summary.totalParticipants} helper="Across listed sessions" tone="emerald" icon={Users} />
        <StatCard label="Full Sessions" value={summary.fullSessions} helper="At max capacity" tone="amber" icon={ShieldCheck} />
        <StatCard
          label="Revenue Potential"
          value={formatPrice(summary.revenuePotential)}
          helper="If all sessions run"
          tone="slate"
          icon={CreditCard}
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-black text-gray-900">Session Board</h2>
          <Link
            href="/programs"
            className="inline-flex items-center gap-1 text-sm font-semibold text-green-700 hover:text-green-800"
          >
            View public programs <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading && (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {isError && <p className="text-red-600 text-center py-10">Failed to load sessions.</p>}
        {sessions && sessions.length === 0 && (
          <div className="text-center text-gray-500 py-16 bg-gray-50 rounded-2xl">No sessions scheduled.</div>
        )}
        {sessions && sessions.length > 0 && (
          <div className="space-y-4">
            {sortedSessions.map((session) => (
              <div key={session.id} className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <div className="font-bold text-gray-900 text-lg">{session.title}</div>
                    <div className="text-gray-500 text-sm mt-1">
                      Date: {formatDate(session.scheduledAt)} | Duration: {session.durationMinutes} min
                    </div>
                    <div className="text-gray-500 text-sm">
                      Spots: {session.currentParticipants}/{session.maxParticipants} participants
                    </div>
                    {session.location && <div className="text-gray-500 text-sm">Location: {session.location}</div>}
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full">
                      {session.sessionType}
                    </span>
                    <div className="font-bold text-green-700 mt-2">{formatPrice(session.priceInCents)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function AdminRoleDashboard() {
  const { data: sessions = [] } = useQuery({
    queryKey: ['admin-dashboard-sessions'],
    queryFn: () => getAdminSessions(),
  })
  const { data: bookings = [] } = useQuery({
    queryKey: ['admin-dashboard-bookings'],
    queryFn: () => getAdminBookings(),
  })
  const { data: tournaments = [] } = useQuery({
    queryKey: ['admin-dashboard-tournaments'],
    queryFn: () => getAdminTournaments(),
  })

  const summary = useMemo(() => {
    const pendingBookings = bookings.filter((booking) => booking.status?.toUpperCase() === 'PENDING').length
    const pendingPayments = bookings.filter(
      (booking) => (booking.paymentStatus ?? 'PENDING').toUpperCase() === 'PENDING'
    ).length
    const activeTournaments = tournaments.filter(
      (tournament) => tournament.status === 'ONGOING' || tournament.status === 'UPCOMING'
    ).length
    const totalCapacity = sessions.reduce((sum, session) => sum + (session.maxParticipants ?? 0), 0)
    return {
      sessionCount: sessions.length,
      bookingCount: bookings.length,
      tournamentCount: tournaments.length,
      pendingBookings,
      pendingPayments,
      activeTournaments,
      totalCapacity,
    }
  }, [sessions, bookings, tournaments])

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Sessions" value={summary.sessionCount} helper={`${summary.totalCapacity} total spots`} tone="blue" icon={CalendarDays} />
        <StatCard label="Total Bookings" value={summary.bookingCount} helper={`${summary.pendingBookings} pending approval`} tone="amber" icon={ClipboardList} />
        <StatCard
          label="Total Tournaments"
          value={summary.tournamentCount}
          helper={`${summary.activeTournaments} active or upcoming`}
          tone="emerald"
          icon={Trophy}
        />
        <StatCard label="Pending Payments" value={summary.pendingPayments} helper="Require follow-up" tone="rose" icon={CreditCard} />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-xl font-black text-gray-900 mb-4">Admin Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin#sessions"
            className="rounded-2xl border border-gray-200 p-4 hover:border-green-300 hover:bg-green-50 transition-colors"
          >
            <div className="text-sm text-gray-500">Operations</div>
            <div className="font-bold text-gray-900 mt-1">Manage Sessions</div>
            <div className="text-sm text-gray-500 mt-1">Create, edit, and maintain training schedule.</div>
          </Link>
          <Link
            href="/admin#tournaments"
            className="rounded-2xl border border-gray-200 p-4 hover:border-green-300 hover:bg-green-50 transition-colors"
          >
            <div className="text-sm text-gray-500">Competition</div>
            <div className="font-bold text-gray-900 mt-1">Manage Tournaments</div>
            <div className="text-sm text-gray-500 mt-1">Control tournament lifecycle and status.</div>
          </Link>
          <Link
            href="/admin#content"
            className="rounded-2xl border border-gray-200 p-4 hover:border-green-300 hover:bg-green-50 transition-colors"
          >
            <div className="text-sm text-gray-500">Website</div>
            <div className="font-bold text-gray-900 mt-1">Edit Site Content</div>
            <div className="text-sm text-gray-500 mt-1">Update homepage text, media, and calls-to-action.</div>
          </Link>
        </div>
      </div>
    </section>
  )
}

function roleCopy(role: UserRole | null) {
  if (role === 'PARENT') {
    return {
      label: 'Parent Portal',
      description: 'Track bookings, payments, and upcoming sessions for your athlete.',
      shell: 'from-emerald-700 to-green-600',
    }
  }
  if (role === 'COACH') {
    return {
      label: 'Coach Workspace',
      description: 'See your schedule at a glance and stay on top of session readiness.',
      shell: 'from-sky-700 to-blue-600',
    }
  }
  if (role === 'ADMIN') {
    return {
      label: 'Admin Command Center',
      description: 'Monitor operations and jump directly into management workflows.',
      shell: 'from-slate-800 to-slate-700',
    }
  }
  return {
    label: 'Member Dashboard',
    description: 'Review your account and upcoming activity.',
    shell: 'from-emerald-700 to-green-600',
  }
}

function DashboardInner() {
  const { user, role } = useAuth()
  const roleInfo = roleCopy(role)
  const firstName = user?.name?.split(' ')[0] ?? 'Athlete'
  const joinedYear = user?.createdAt ? new Date(user.createdAt).getFullYear().toString() : '--'

  const primaryCta =
    role === 'ADMIN'
      ? { href: '/admin', label: 'Open Admin Panel' }
      : role === 'COACH'
      ? { href: '/programs', label: 'View Programs' }
      : { href: '/programs', label: 'Book a Session' }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <section className={`rounded-3xl bg-gradient-to-r ${roleInfo.shell} p-8 md:p-10 text-white`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              {roleInfo.label}
            </div>
            <h1 className="text-3xl md:text-4xl font-black leading-tight">Welcome back, {firstName}</h1>
            <p className="text-white/90 mt-2 max-w-2xl">{roleInfo.description}</p>
          </div>
          <Link
            href={primaryCta.href}
            className="inline-flex items-center gap-2 rounded-xl bg-white text-gray-900 px-4 py-2.5 font-semibold hover:bg-gray-100 transition-colors"
          >
            {primaryCta.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Role" value={role ?? '--'} tone="slate" icon={User} />
        <StatCard label="Email" value={user?.email ?? '--'} tone="blue" icon={Mail} />
        <StatCard label="Phone" value={user?.phone ?? 'Not set'} tone="amber" icon={Phone} />
        <StatCard label="Member Since" value={joinedYear} tone="emerald" icon={CalendarDays} />
      </section>

      {role === 'ADMIN' ? <AdminRoleDashboard /> : role === 'PARENT' ? <ParentDashboard /> : <CoachDashboard />}
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
