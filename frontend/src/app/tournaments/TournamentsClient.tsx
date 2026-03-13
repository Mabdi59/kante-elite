'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, SlidersHorizontal } from 'lucide-react'
import { getTournaments } from '@/lib/api'
import { useSiteContentBlock } from '@/lib/siteContent'

type TournamentsMeta = {
  availableHeading: string
  searchPlaceholder: string
  onlyOpenLabel: string
  noTournamentsMessage: string
  noMatchesMessage: string
  completedCtaLabel: string
  fullCtaLabel: string
  viewCtaLabel: string
}

function formatDate(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return 'TBD'
  }
  return date.toLocaleDateString('en-US', {
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
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UPCOMING' | 'ONGOING' | 'COMPLETED'>('ALL')
  const [ageGroupFilter, setAgeGroupFilter] = useState('ALL')
  const [onlyOpen, setOnlyOpen] = useState(false)
  const [sortBy, setSortBy] = useState<'startDate' | 'feeAsc' | 'feeDesc' | 'spots'>('startDate')
  const pageBlock = useSiteContentBlock<TournamentsMeta>('tournaments.page', {
    key: 'tournaments.page',
    title: 'Tournaments',
    body: 'Compete in Kante Elite youth soccer tournaments across the Columbus area. Register your team and bring home the trophy!',
    metadata: {
      availableHeading: 'Available Tournaments',
      searchPlaceholder: 'Search name, description, or location',
      onlyOpenLabel: 'Show only tournaments with open slots',
      noTournamentsMessage: 'No tournaments scheduled yet. Check back soon!',
      noMatchesMessage: 'No tournaments match your current filters.',
      completedCtaLabel: 'Completed',
      fullCtaLabel: 'Full',
      viewCtaLabel: 'View & Register',
    },
  })
  const availableHeading =
    typeof pageBlock.metadata.availableHeading === 'string'
      ? pageBlock.metadata.availableHeading
      : 'Available Tournaments'
  const searchPlaceholder =
    typeof pageBlock.metadata.searchPlaceholder === 'string'
      ? pageBlock.metadata.searchPlaceholder
      : 'Search name, description, or location'
  const onlyOpenLabel =
    typeof pageBlock.metadata.onlyOpenLabel === 'string'
      ? pageBlock.metadata.onlyOpenLabel
      : 'Show only tournaments with open slots'
  const noTournamentsMessage =
    typeof pageBlock.metadata.noTournamentsMessage === 'string'
      ? pageBlock.metadata.noTournamentsMessage
      : 'No tournaments scheduled yet. Check back soon!'
  const noMatchesMessage =
    typeof pageBlock.metadata.noMatchesMessage === 'string'
      ? pageBlock.metadata.noMatchesMessage
      : 'No tournaments match your current filters.'
  const completedCtaLabel =
    typeof pageBlock.metadata.completedCtaLabel === 'string'
      ? pageBlock.metadata.completedCtaLabel
      : 'Completed'
  const fullCtaLabel =
    typeof pageBlock.metadata.fullCtaLabel === 'string' ? pageBlock.metadata.fullCtaLabel : 'Full'
  const viewCtaLabel =
    typeof pageBlock.metadata.viewCtaLabel === 'string'
      ? pageBlock.metadata.viewCtaLabel
      : 'View & Register'

  const ageGroupOptions = useMemo(() => {
    if (!tournaments) {
      return []
    }
    const groups = new Set<string>()
    tournaments.forEach((t) => t.ageGroups.forEach((group) => groups.add(group)))
    return Array.from(groups).sort()
  }, [tournaments])

  const filteredTournaments = useMemo(() => {
    if (!tournaments) {
      return []
    }

    const normalizedQuery = query.trim().toLowerCase()
    const list = tournaments.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) {
        return false
      }
      if (ageGroupFilter !== 'ALL' && !t.ageGroups.some((group) => group === ageGroupFilter)) {
        return false
      }
      if (onlyOpen && t.registeredTeams >= t.maxTeams) {
        return false
      }
      if (!normalizedQuery) {
        return true
      }
      const haystack = `${t.name} ${t.description ?? ''} ${t.location}`.toLowerCase()
      return haystack.includes(normalizedQuery)
    })

    list.sort((a, b) => {
      if (sortBy === 'feeAsc') {
        return a.entryFeeInCents - b.entryFeeInCents
      }
      if (sortBy === 'feeDesc') {
        return b.entryFeeInCents - a.entryFeeInCents
      }
      if (sortBy === 'spots') {
        const openA = a.maxTeams - a.registeredTeams
        const openB = b.maxTeams - b.registeredTeams
        return openB - openA
      }
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    })

    return list
  }, [tournaments, query, statusFilter, ageGroupFilter, onlyOpen, sortBy])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
          {pageBlock.title ?? 'Tournaments'}
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
          {pageBlock.body}
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
          {noTournamentsMessage}
        </div>
      )}

      {tournaments && tournaments.length > 0 && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{availableHeading}</h2>
            <p className="text-sm text-gray-500">
              Showing {filteredTournaments.length} of {tournaments.length}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <label className="md:col-span-2 relative">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={searchPlaceholder}
                />
              </label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as 'ALL' | 'UPCOMING' | 'ONGOING' | 'COMPLETED')
                }
                className="border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="ONGOING">Ongoing</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <select
                value={ageGroupFilter}
                onChange={(e) => setAgeGroupFilter(e.target.value)}
                className="border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="ALL">All Age Groups</option>
                {ageGroupOptions.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="relative min-w-[220px]">
                <SlidersHorizontal className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as 'startDate' | 'feeAsc' | 'feeDesc' | 'spots')
                  }
                  className="w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="startDate">Sort: Start Date</option>
                  <option value="feeAsc">Sort: Fee Low to High</option>
                  <option value="feeDesc">Sort: Fee High to Low</option>
                  <option value="spots">Sort: Most Open Spots</option>
                </select>
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={onlyOpen}
                  onChange={(e) => setOnlyOpen(e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                {onlyOpenLabel}
              </label>
            </div>
          </div>

          {filteredTournaments.length === 0 && (
            <div className="text-center text-gray-500 py-14 border border-dashed border-gray-300 rounded-2xl">
              {noMatchesMessage}
            </div>
          )}

          {filteredTournaments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredTournaments.map((t) => (
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
                <div>Dates: {formatDate(t.startDate)} - {formatDate(t.endDate)}</div>
                <div>Location: {t.location}</div>
                <div>
                  Teams: {t.registeredTeams}/{t.maxTeams} teams registered
                </div>
                <div>Age groups: {t.ageGroups.join(', ')}</div>
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
                  ? completedCtaLabel
                  : t.registeredTeams >= t.maxTeams
                  ? fullCtaLabel
                  : viewCtaLabel}
              </Link>
            </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
