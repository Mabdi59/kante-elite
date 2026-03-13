'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import ProtectedRoute from '@/components/ProtectedRoute'
import {
  createAdminSession,
  createAdminMediaAsset,
  deleteAdminMediaAsset,
  deleteAdminSiteContentBlock,
  createAdminTournament,
  deleteAdminBooking,
  deleteAdminRegistration,
  deleteAdminSession,
  deleteAdminTournament,
  getAdminMediaAssets,
  getAdminBookings,
  getAdminRegistrations,
  getAdminSessions,
  getAdminSiteContentBlocks,
  getAdminTournaments,
  updateAdminMediaAsset,
  upsertAdminSiteContentBlock,
  updateAdminBooking,
  updateAdminRegistration,
  updateAdminSession,
  updateAdminTournament,
} from '@/lib/api'
import type {
  AdminTournamentStatus,
  AgeGroup,
  BookingStatus,
  CreateMediaAssetData,
  MediaAsset,
  MediaType,
  PaymentStatus,
  SessionStatus,
  SessionType,
  SiteContentBlock,
} from '@/lib/types'

const SESSION_TYPES: SessionType[] = ['PRIVATE', 'GROUP', 'SPEED']
const SESSION_STATUSES: SessionStatus[] = ['ACTIVE', 'CANCELLED', 'COMPLETED']
const TOURNAMENT_STATUSES: AdminTournamentStatus[] = ['UPCOMING', 'ACTIVE', 'COMPLETED']
const FLOW_STATUSES: BookingStatus[] = ['PENDING', 'CONFIRMED', 'CANCELLED', 'FAILED', 'EXPIRED']
const PAYMENT_STATUSES: PaymentStatus[] = ['PENDING', 'PAID', 'FAILED', 'EXPIRED', 'PAID_AFTER_EXPIRY']
const MEDIA_TYPES: MediaType[] = ['PHOTO', 'VIDEO']

type SessionDraft = {
  title: string
  status: SessionStatus
}

type TournamentDraft = {
  name: string
  status: AdminTournamentStatus
}

type FlowDraft = {
  status: BookingStatus
  paymentStatus: PaymentStatus
}

type ContentDraft = {
  key: string
  title: string
  subtitle: string
  body: string
  ctaLabel: string
  ctaUrl: string
  metadataJson: string
}

type MediaDraft = {
  sectionKey: string
  mediaType: MediaType
  title: string
  description: string
  url: string
  thumbnailUrl: string
  displayOrder: string
  active: boolean
}

function parseAgeGroups(raw: string): AgeGroup[] {
  const allowed = new Set<AgeGroup>(['U8', 'U10', 'U12', 'U14', 'U16', 'U18'])
  return raw
    .split(/[,\|/]/)
    .map((value) => value.trim().toUpperCase())
    .filter((value): value is AgeGroup => allowed.has(value as AgeGroup))
}

function isValidJson(value: string): boolean {
  try {
    JSON.parse(value)
    return true
  } catch {
    return false
  }
}

function parseNonNegativeInt(value: string, fallback = 0): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback
  }
  return Math.floor(parsed)
}

function AdminInner() {
  const qc = useQueryClient()

  const [sessionDrafts, setSessionDrafts] = useState<Record<number, SessionDraft>>({})
  const [tournamentDrafts, setTournamentDrafts] = useState<Record<number, TournamentDraft>>({})
  const [registrationDrafts, setRegistrationDrafts] = useState<Record<number, FlowDraft>>({})
  const [bookingDrafts, setBookingDrafts] = useState<Record<number, FlowDraft>>({})
  const [contentDrafts, setContentDrafts] = useState<Record<string, ContentDraft>>({})
  const [mediaDrafts, setMediaDrafts] = useState<Record<number, MediaDraft>>({})
  const [error, setError] = useState<string | null>(null)

  const [sessionForm, setSessionForm] = useState({
    title: '',
    sessionType: 'GROUP' as SessionType,
    scheduledAt: '',
    durationMinutes: '60',
    maxParticipants: '10',
    priceInCents: '5000',
    location: '',
  })

  const [tournamentForm, setTournamentForm] = useState({
    name: '',
    location: '',
    startDate: '',
    endDate: '',
    ageGroupsInput: 'U12,U14',
    maxTeams: '16',
    entryFeeInCents: '25000',
    status: 'UPCOMING' as AdminTournamentStatus,
  })

  const [contentForm, setContentForm] = useState<ContentDraft>({
    key: '',
    title: '',
    subtitle: '',
    body: '',
    ctaLabel: '',
    ctaUrl: '',
    metadataJson: '{}',
  })

  const [mediaForm, setMediaForm] = useState<MediaDraft>({
    sectionKey: 'HOME_PHOTOS',
    mediaType: 'PHOTO',
    title: '',
    description: '',
    url: '',
    thumbnailUrl: '',
    displayOrder: '0',
    active: true,
  })

  const { data: sessions = [] } = useQuery({
    queryKey: ['admin-sessions'],
    queryFn: () => getAdminSessions(),
  })
  const { data: tournaments = [] } = useQuery({
    queryKey: ['admin-tournaments'],
    queryFn: () => getAdminTournaments(),
  })
  const { data: registrations = [] } = useQuery({
    queryKey: ['admin-registrations'],
    queryFn: () => getAdminRegistrations(),
  })
  const { data: bookings = [] } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: () => getAdminBookings(),
  })
  const { data: contentBlocks = [] } = useQuery({
    queryKey: ['admin-content-blocks'],
    queryFn: () => getAdminSiteContentBlocks(),
  })
  const { data: mediaAssets = [] } = useQuery({
    queryKey: ['admin-media-assets'],
    queryFn: () => getAdminMediaAssets({ includeInactive: true }),
  })

  useEffect(() => {
    setSessionDrafts((prev) => {
      const next = { ...prev }
      for (const session of sessions) {
        if (!next[session.id]) {
          const normalizedStatus = session.status?.toUpperCase()
          const status: SessionStatus = SESSION_STATUSES.includes(normalizedStatus as SessionStatus)
            ? (normalizedStatus as SessionStatus)
            : 'ACTIVE'
          next[session.id] = { title: session.title, status }
        }
      }
      return next
    })
  }, [sessions])

  useEffect(() => {
    setTournamentDrafts((prev) => {
      const next = { ...prev }
      for (const tournament of tournaments) {
        if (!next[tournament.id]) {
          next[tournament.id] = {
            name: tournament.name,
            status: tournament.status === 'ONGOING' ? 'ACTIVE' : tournament.status,
          }
        }
      }
      return next
    })
  }, [tournaments])

  useEffect(() => {
    setRegistrationDrafts((prev) => {
      const next = { ...prev }
      for (const registration of registrations) {
        if (!next[registration.id]) {
          next[registration.id] = {
            status: registration.status.toUpperCase() as BookingStatus,
            paymentStatus: (registration.paymentStatus?.toUpperCase() as PaymentStatus) ?? 'PENDING',
          }
        }
      }
      return next
    })
  }, [registrations])

  useEffect(() => {
    setBookingDrafts((prev) => {
      const next = { ...prev }
      for (const booking of bookings) {
        if (!next[booking.id]) {
          next[booking.id] = {
            status: booking.status.toUpperCase() as BookingStatus,
            paymentStatus: (booking.paymentStatus?.toUpperCase() as PaymentStatus) ?? 'PENDING',
          }
        }
      }
      return next
    })
  }, [bookings])

  useEffect(() => {
    setContentDrafts((prev) => {
      const next = { ...prev }
      for (const block of contentBlocks) {
        if (!next[block.key]) {
          next[block.key] = {
            key: block.key,
            title: block.title ?? '',
            subtitle: block.subtitle ?? '',
            body: block.body ?? '',
            ctaLabel: block.ctaLabel ?? '',
            ctaUrl: block.ctaUrl ?? '',
            metadataJson: block.metadataJson || '{}',
          }
        }
      }
      return next
    })
  }, [contentBlocks])

  useEffect(() => {
    setMediaDrafts((prev) => {
      const next = { ...prev }
      for (const asset of mediaAssets) {
        if (!next[asset.id]) {
          next[asset.id] = {
            sectionKey: asset.sectionKey,
            mediaType: asset.mediaType,
            title: asset.title ?? '',
            description: asset.description ?? '',
            url: asset.url,
            thumbnailUrl: asset.thumbnailUrl ?? '',
            displayOrder: String(asset.displayOrder),
            active: asset.active,
          }
        }
      }
      return next
    })
  }, [mediaAssets])

  const createSessionMutation = useMutation({
    mutationFn: createAdminSession,
    onSuccess: () => {
      setError(null)
      setSessionForm({
        title: '',
        sessionType: 'GROUP',
        scheduledAt: '',
        durationMinutes: '60',
        maxParticipants: '10',
        priceInCents: '5000',
        location: '',
      })
      qc.invalidateQueries({ queryKey: ['admin-sessions'] })
      qc.invalidateQueries({ queryKey: ['sessions'] })
    },
    onError: () => setError('Failed to create session'),
  })

  const updateSessionMutation = useMutation({
    mutationFn: ({ id, draft }: { id: number; draft: SessionDraft }) =>
      updateAdminSession(id, { title: draft.title, status: draft.status }),
    onSuccess: () => {
      setError(null)
      qc.invalidateQueries({ queryKey: ['admin-sessions'] })
      qc.invalidateQueries({ queryKey: ['sessions'] })
    },
    onError: () => setError('Failed to update session'),
  })

  const deleteSessionMutation = useMutation({
    mutationFn: deleteAdminSession,
    onSuccess: () => {
      setError(null)
      qc.invalidateQueries({ queryKey: ['admin-sessions'] })
      qc.invalidateQueries({ queryKey: ['sessions'] })
    },
    onError: () => setError('Failed to delete session'),
  })

  const createTournamentMutation = useMutation({
    mutationFn: createAdminTournament,
    onSuccess: () => {
      setError(null)
      setTournamentForm({
        name: '',
        location: '',
        startDate: '',
        endDate: '',
        ageGroupsInput: 'U12,U14',
        maxTeams: '16',
        entryFeeInCents: '25000',
        status: 'UPCOMING',
      })
      qc.invalidateQueries({ queryKey: ['admin-tournaments'] })
      qc.invalidateQueries({ queryKey: ['tournaments'] })
    },
    onError: () => setError('Failed to create tournament'),
  })

  const updateTournamentMutation = useMutation({
    mutationFn: ({ id, draft }: { id: number; draft: TournamentDraft }) =>
      updateAdminTournament(id, { name: draft.name, status: draft.status }),
    onSuccess: () => {
      setError(null)
      qc.invalidateQueries({ queryKey: ['admin-tournaments'] })
      qc.invalidateQueries({ queryKey: ['tournaments'] })
    },
    onError: () => setError('Failed to update tournament'),
  })

  const deleteTournamentMutation = useMutation({
    mutationFn: deleteAdminTournament,
    onSuccess: () => {
      setError(null)
      qc.invalidateQueries({ queryKey: ['admin-tournaments'] })
      qc.invalidateQueries({ queryKey: ['tournaments'] })
      qc.invalidateQueries({ queryKey: ['admin-registrations'] })
    },
    onError: () => setError('Failed to delete tournament'),
  })

  const updateRegistrationMutation = useMutation({
    mutationFn: ({ id, draft }: { id: number; draft: FlowDraft }) =>
      updateAdminRegistration(id, { status: draft.status, paymentStatus: draft.paymentStatus }),
    onSuccess: () => {
      setError(null)
      qc.invalidateQueries({ queryKey: ['admin-registrations'] })
      qc.invalidateQueries({ queryKey: ['admin-tournaments'] })
      qc.invalidateQueries({ queryKey: ['tournaments'] })
    },
    onError: () => setError('Failed to update registration'),
  })

  const deleteRegistrationMutation = useMutation({
    mutationFn: deleteAdminRegistration,
    onSuccess: () => {
      setError(null)
      qc.invalidateQueries({ queryKey: ['admin-registrations'] })
      qc.invalidateQueries({ queryKey: ['admin-tournaments'] })
      qc.invalidateQueries({ queryKey: ['tournaments'] })
    },
    onError: () => setError('Failed to delete registration'),
  })

  const updateBookingMutation = useMutation({
    mutationFn: ({ id, draft }: { id: number; draft: FlowDraft }) =>
      updateAdminBooking(id, { status: draft.status, paymentStatus: draft.paymentStatus }),
    onSuccess: () => {
      setError(null)
      qc.invalidateQueries({ queryKey: ['admin-bookings'] })
      qc.invalidateQueries({ queryKey: ['sessions'] })
    },
    onError: () => setError('Failed to update booking'),
  })

  const deleteBookingMutation = useMutation({
    mutationFn: deleteAdminBooking,
    onSuccess: () => {
      setError(null)
      qc.invalidateQueries({ queryKey: ['admin-bookings'] })
      qc.invalidateQueries({ queryKey: ['sessions'] })
      qc.invalidateQueries({ queryKey: ['my-bookings'] })
    },
    onError: () => setError('Failed to delete booking'),
  })

  const upsertContentBlockMutation = useMutation({
    mutationFn: ({ key, draft }: { key: string; draft: ContentDraft }) =>
      upsertAdminSiteContentBlock(key, {
        title: draft.title || undefined,
        subtitle: draft.subtitle || undefined,
        body: draft.body || undefined,
        ctaLabel: draft.ctaLabel || undefined,
        ctaUrl: draft.ctaUrl || undefined,
        metadataJson: draft.metadataJson || '{}',
      }),
    onSuccess: () => {
      setError(null)
      qc.invalidateQueries({ queryKey: ['admin-content-blocks'] })
      qc.invalidateQueries({ queryKey: ['site-content-blocks'] })
    },
    onError: () => setError('Failed to save content block'),
  })

  const deleteContentBlockMutation = useMutation({
    mutationFn: deleteAdminSiteContentBlock,
    onSuccess: () => {
      setError(null)
      qc.invalidateQueries({ queryKey: ['admin-content-blocks'] })
      qc.invalidateQueries({ queryKey: ['site-content-blocks'] })
    },
    onError: () => setError('Failed to delete content block'),
  })

  const createMediaAssetMutation = useMutation({
    mutationFn: createAdminMediaAsset,
    onSuccess: () => {
      setError(null)
      setMediaForm({
        sectionKey: 'HOME_PHOTOS',
        mediaType: 'PHOTO',
        title: '',
        description: '',
        url: '',
        thumbnailUrl: '',
        displayOrder: '0',
        active: true,
      })
      qc.invalidateQueries({ queryKey: ['admin-media-assets'] })
      qc.invalidateQueries({ queryKey: ['site-media'] })
    },
    onError: () => setError('Failed to create media asset'),
  })

  const updateMediaAssetMutation = useMutation({
    mutationFn: ({ mediaId, draft }: { mediaId: number; draft: MediaDraft }) =>
      updateAdminMediaAsset(mediaId, {
        sectionKey: draft.sectionKey.trim(),
        mediaType: draft.mediaType,
        title: draft.title,
        description: draft.description,
        url: draft.url.trim(),
        thumbnailUrl: draft.thumbnailUrl,
        displayOrder: parseNonNegativeInt(draft.displayOrder, 0),
        active: draft.active,
      }),
    onSuccess: () => {
      setError(null)
      qc.invalidateQueries({ queryKey: ['admin-media-assets'] })
      qc.invalidateQueries({ queryKey: ['site-media'] })
    },
    onError: () => setError('Failed to update media asset'),
  })

  const deleteMediaAssetMutation = useMutation({
    mutationFn: deleteAdminMediaAsset,
    onSuccess: () => {
      setError(null)
      qc.invalidateQueries({ queryKey: ['admin-media-assets'] })
      qc.invalidateQueries({ queryKey: ['site-media'] })
    },
    onError: () => setError('Failed to delete media asset'),
  })

  const overviewCards = useMemo(
    () => [
      { label: 'Sessions', value: sessions.length, helper: 'Training events' },
      { label: 'Tournaments', value: tournaments.length, helper: 'Competition events' },
      {
        label: 'Bookings',
        value: bookings.length,
        helper: `${bookings.filter((item) => item.status.toUpperCase() === 'PENDING').length} pending`,
      },
      {
        label: 'Registrations',
        value: registrations.length,
        helper: `${registrations.filter((item) => item.status.toUpperCase() === 'PENDING').length} pending`,
      },
      {
        label: 'Content Blocks',
        value: contentBlocks.length,
        helper: 'Site text sections',
      },
      {
        label: 'Media Assets',
        value: mediaAssets.length,
        helper: `${mediaAssets.filter((item) => !item.active).length} inactive`,
      },
    ],
    [sessions, tournaments, bookings, registrations, contentBlocks, mediaAssets]
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <section className="rounded-3xl bg-gradient-to-r from-slate-800 to-slate-700 p-8 text-white">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide mb-3">
              Admin Workspace
            </div>
            <h1 className="text-3xl font-extrabold">Platform Control Center</h1>
            <p className="text-slate-200 mt-2 max-w-2xl">
              Manage sessions, tournaments, bookings, and website content from one place.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <a href="#sessions" className="rounded-lg bg-white/15 hover:bg-white/25 px-3 py-2 text-sm font-semibold">
              Sessions
            </a>
            <a
              href="#tournaments"
              className="rounded-lg bg-white/15 hover:bg-white/25 px-3 py-2 text-sm font-semibold"
            >
              Tournaments
            </a>
            <a href="#bookings" className="rounded-lg bg-white/15 hover:bg-white/25 px-3 py-2 text-sm font-semibold">
              Bookings
            </a>
            <a href="#content" className="rounded-lg bg-white/15 hover:bg-white/25 px-3 py-2 text-sm font-semibold">
              Content
            </a>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {overviewCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="text-xs uppercase tracking-wide font-semibold text-gray-500">{card.label}</div>
            <div className="text-2xl font-black text-gray-900 mt-1">{card.value}</div>
            <div className="text-xs text-gray-500 mt-1">{card.helper}</div>
          </div>
        ))}
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section id="create" className="grid grid-cols-1 xl:grid-cols-2 gap-6 scroll-mt-24">
        <div className="bg-white border rounded-2xl p-5 space-y-3">
          <h2 className="text-xl font-bold text-gray-900">Create Session</h2>
          <input
            value={sessionForm.title}
            onChange={(event) => setSessionForm((prev) => ({ ...prev, title: event.target.value }))}
            className="w-full border rounded-xl px-3 py-2 text-sm"
            placeholder="Title"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={sessionForm.sessionType}
              onChange={(event) =>
                setSessionForm((prev) => ({ ...prev, sessionType: event.target.value as SessionType }))
              }
              className="border rounded-xl px-3 py-2 text-sm"
            >
              {SESSION_TYPES.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
            <input
              type="datetime-local"
              value={sessionForm.scheduledAt}
              onChange={(event) => setSessionForm((prev) => ({ ...prev, scheduledAt: event.target.value }))}
              className="border rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              value={sessionForm.durationMinutes}
              onChange={(event) => setSessionForm((prev) => ({ ...prev, durationMinutes: event.target.value }))}
              className="border rounded-xl px-3 py-2 text-sm"
              placeholder="Duration"
            />
            <input
              type="number"
              value={sessionForm.maxParticipants}
              onChange={(event) => setSessionForm((prev) => ({ ...prev, maxParticipants: event.target.value }))}
              className="border rounded-xl px-3 py-2 text-sm"
              placeholder="Capacity"
            />
            <input
              type="number"
              value={sessionForm.priceInCents}
              onChange={(event) => setSessionForm((prev) => ({ ...prev, priceInCents: event.target.value }))}
              className="border rounded-xl px-3 py-2 text-sm"
              placeholder="Price cents"
            />
          </div>
          <input
            value={sessionForm.location}
            onChange={(event) => setSessionForm((prev) => ({ ...prev, location: event.target.value }))}
            className="w-full border rounded-xl px-3 py-2 text-sm"
            placeholder="Location"
          />
          <button
            type="button"
            onClick={() =>
              createSessionMutation.mutate({
                title: sessionForm.title,
                sessionType: sessionForm.sessionType,
                scheduledAt: sessionForm.scheduledAt,
                durationMinutes: Number(sessionForm.durationMinutes),
                maxParticipants: Number(sessionForm.maxParticipants),
                priceInCents: Number(sessionForm.priceInCents),
                location: sessionForm.location,
              })
            }
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-xl"
          >
            Create Session
          </button>
        </div>

        <div className="bg-white border rounded-2xl p-5 space-y-3">
          <h2 className="text-xl font-bold text-gray-900">Create Tournament</h2>
          <input
            value={tournamentForm.name}
            onChange={(event) => setTournamentForm((prev) => ({ ...prev, name: event.target.value }))}
            className="w-full border rounded-xl px-3 py-2 text-sm"
            placeholder="Name"
          />
          <input
            value={tournamentForm.location}
            onChange={(event) => setTournamentForm((prev) => ({ ...prev, location: event.target.value }))}
            className="w-full border rounded-xl px-3 py-2 text-sm"
            placeholder="Location"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={tournamentForm.startDate}
              onChange={(event) => setTournamentForm((prev) => ({ ...prev, startDate: event.target.value }))}
              className="border rounded-xl px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={tournamentForm.endDate}
              onChange={(event) => setTournamentForm((prev) => ({ ...prev, endDate: event.target.value }))}
              className="border rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <input
            value={tournamentForm.ageGroupsInput}
            onChange={(event) => setTournamentForm((prev) => ({ ...prev, ageGroupsInput: event.target.value }))}
            className="w-full border rounded-xl px-3 py-2 text-sm"
            placeholder="Age groups (U10,U12)"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              value={tournamentForm.maxTeams}
              onChange={(event) => setTournamentForm((prev) => ({ ...prev, maxTeams: event.target.value }))}
              className="border rounded-xl px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={tournamentForm.entryFeeInCents}
              onChange={(event) =>
                setTournamentForm((prev) => ({ ...prev, entryFeeInCents: event.target.value }))
              }
              className="border rounded-xl px-3 py-2 text-sm"
            />
            <select
              value={tournamentForm.status}
              onChange={(event) =>
                setTournamentForm((prev) => ({
                  ...prev,
                  status: event.target.value as AdminTournamentStatus,
                }))
              }
              className="border rounded-xl px-3 py-2 text-sm"
            >
              {TOURNAMENT_STATUSES.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => {
              const ageGroups = parseAgeGroups(tournamentForm.ageGroupsInput)
              if (ageGroups.length === 0) {
                setError('Tournament age groups must include valid values like U10,U12.')
                return
              }
              createTournamentMutation.mutate({
                name: tournamentForm.name,
                location: tournamentForm.location,
                startDate: tournamentForm.startDate,
                endDate: tournamentForm.endDate,
                ageGroups,
                maxTeams: Number(tournamentForm.maxTeams),
                entryFeeInCents: Number(tournamentForm.entryFeeInCents),
                status: tournamentForm.status,
              })
            }}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-xl"
          >
            Create Tournament
          </button>
        </div>
      </section>

      <section id="sessions" className="bg-white border rounded-2xl p-5 scroll-mt-24">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Sessions</h2>
        <div className="space-y-3">
          {sessions.map((session) => {
            const draft = sessionDrafts[session.id]
            if (!draft) return null
            return (
              <div key={session.id} className="border rounded-xl p-3 flex flex-wrap items-center gap-2">
                <input
                  value={draft.title}
                  onChange={(event) =>
                    setSessionDrafts((prev) => ({
                      ...prev,
                      [session.id]: { ...draft, title: event.target.value },
                    }))
                  }
                  className="border rounded-lg px-2 py-1.5 text-sm min-w-[220px]"
                />
                <select
                  value={draft.status}
                  onChange={(event) =>
                    setSessionDrafts((prev) => ({
                      ...prev,
                      [session.id]: { ...draft, status: event.target.value as SessionStatus },
                    }))
                  }
                  className="border rounded-lg px-2 py-1.5 text-sm"
                >
                  {SESSION_STATUSES.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
                <button
                  onClick={() => updateSessionMutation.mutate({ id: session.id, draft })}
                  className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => deleteSessionMutation.mutate(session.id)}
                  className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm"
                >
                  Delete
                </button>
              </div>
            )
          })}
        </div>
      </section>

      <section id="tournaments" className="bg-white border rounded-2xl p-5 scroll-mt-24">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Tournaments</h2>
        <div className="space-y-3">
          {tournaments.map((tournament) => {
            const draft = tournamentDrafts[tournament.id]
            if (!draft) return null
            return (
              <div key={tournament.id} className="border rounded-xl p-3 flex flex-wrap items-center gap-2">
                <input
                  value={draft.name}
                  onChange={(event) =>
                    setTournamentDrafts((prev) => ({
                      ...prev,
                      [tournament.id]: { ...draft, name: event.target.value },
                    }))
                  }
                  className="border rounded-lg px-2 py-1.5 text-sm min-w-[220px]"
                />
                <select
                  value={draft.status}
                  onChange={(event) =>
                    setTournamentDrafts((prev) => ({
                      ...prev,
                      [tournament.id]: {
                        ...draft,
                        status: event.target.value as AdminTournamentStatus,
                      },
                    }))
                  }
                  className="border rounded-lg px-2 py-1.5 text-sm"
                >
                  {TOURNAMENT_STATUSES.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
                <button
                  onClick={() => updateTournamentMutation.mutate({ id: tournament.id, draft })}
                  className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => deleteTournamentMutation.mutate(tournament.id)}
                  className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm"
                >
                  Delete
                </button>
              </div>
            )
          })}
        </div>
      </section>

      <section id="registrations" className="bg-white border rounded-2xl p-5 scroll-mt-24">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Registrations</h2>
        <div className="space-y-3">
          {registrations.map((registration) => {
            const draft = registrationDrafts[registration.id]
            if (!draft) return null
            return (
              <div key={registration.id} className="border rounded-xl p-3 flex flex-wrap items-center gap-2">
                <span className="text-sm min-w-[180px]">{registration.teamName}</span>
                <select
                  value={draft.status}
                  onChange={(event) =>
                    setRegistrationDrafts((prev) => ({
                      ...prev,
                      [registration.id]: { ...draft, status: event.target.value as BookingStatus },
                    }))
                  }
                  className="border rounded-lg px-2 py-1.5 text-sm"
                >
                  {FLOW_STATUSES.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
                <select
                  value={draft.paymentStatus}
                  onChange={(event) =>
                    setRegistrationDrafts((prev) => ({
                      ...prev,
                      [registration.id]: { ...draft, paymentStatus: event.target.value as PaymentStatus },
                    }))
                  }
                  className="border rounded-lg px-2 py-1.5 text-sm"
                >
                  {PAYMENT_STATUSES.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
                <button
                  onClick={() => updateRegistrationMutation.mutate({ id: registration.id, draft })}
                  className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => deleteRegistrationMutation.mutate(registration.id)}
                  className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm"
                >
                  Delete
                </button>
              </div>
            )
          })}
        </div>
      </section>

      <section id="bookings" className="bg-white border rounded-2xl p-5 scroll-mt-24">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Bookings</h2>
        <div className="space-y-3">
          {bookings.map((booking) => {
            const draft = bookingDrafts[booking.id]
            if (!draft) return null
            return (
              <div key={booking.id} className="border rounded-xl p-3 flex flex-wrap items-center gap-2">
                <span className="text-sm min-w-[180px]">{booking.sessionTitle ?? `#${booking.sessionId}`}</span>
                <select
                  value={draft.status}
                  onChange={(event) =>
                    setBookingDrafts((prev) => ({
                      ...prev,
                      [booking.id]: { ...draft, status: event.target.value as BookingStatus },
                    }))
                  }
                  className="border rounded-lg px-2 py-1.5 text-sm"
                >
                  {FLOW_STATUSES.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
                <select
                  value={draft.paymentStatus}
                  onChange={(event) =>
                    setBookingDrafts((prev) => ({
                      ...prev,
                      [booking.id]: { ...draft, paymentStatus: event.target.value as PaymentStatus },
                    }))
                  }
                  className="border rounded-lg px-2 py-1.5 text-sm"
                >
                  {PAYMENT_STATUSES.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
                <button
                  onClick={() => updateBookingMutation.mutate({ id: booking.id, draft })}
                  className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => deleteBookingMutation.mutate(booking.id)}
                  className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm"
                >
                  Delete
                </button>
              </div>
            )
          })}
        </div>
      </section>

      <section id="content-create" className="grid grid-cols-1 xl:grid-cols-2 gap-6 scroll-mt-24">
        <div className="bg-white border rounded-2xl p-5 space-y-3">
          <h2 className="text-xl font-bold text-gray-900">Create / Update Content Block</h2>
          <input
            value={contentForm.key}
            onChange={(event) => setContentForm((prev) => ({ ...prev, key: event.target.value }))}
            className="w-full border rounded-xl px-3 py-2 text-sm"
            placeholder="Block key (e.g. home.hero)"
          />
          <input
            value={contentForm.title}
            onChange={(event) => setContentForm((prev) => ({ ...prev, title: event.target.value }))}
            className="w-full border rounded-xl px-3 py-2 text-sm"
            placeholder="Title"
          />
          <input
            value={contentForm.subtitle}
            onChange={(event) => setContentForm((prev) => ({ ...prev, subtitle: event.target.value }))}
            className="w-full border rounded-xl px-3 py-2 text-sm"
            placeholder="Subtitle"
          />
          <textarea
            value={contentForm.body}
            onChange={(event) => setContentForm((prev) => ({ ...prev, body: event.target.value }))}
            className="w-full border rounded-xl px-3 py-2 text-sm min-h-24"
            placeholder="Body text"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={contentForm.ctaLabel}
              onChange={(event) => setContentForm((prev) => ({ ...prev, ctaLabel: event.target.value }))}
              className="border rounded-xl px-3 py-2 text-sm"
              placeholder="CTA label"
            />
            <input
              value={contentForm.ctaUrl}
              onChange={(event) => setContentForm((prev) => ({ ...prev, ctaUrl: event.target.value }))}
              className="border rounded-xl px-3 py-2 text-sm"
              placeholder="CTA URL"
            />
          </div>
          <textarea
            value={contentForm.metadataJson}
            onChange={(event) => setContentForm((prev) => ({ ...prev, metadataJson: event.target.value }))}
            className="w-full border rounded-xl px-3 py-2 text-sm min-h-32 font-mono"
            placeholder='Metadata JSON (e.g. {"items":[]})'
          />
          <button
            type="button"
            onClick={() => {
              if (!contentForm.key.trim()) {
                setError('Content key is required.')
                return
              }
              if (!isValidJson(contentForm.metadataJson || '{}')) {
                setError('Content metadata must be valid JSON.')
                return
              }
              upsertContentBlockMutation.mutate({
                key: contentForm.key.trim(),
                draft: {
                  ...contentForm,
                  key: contentForm.key.trim(),
                  metadataJson: contentForm.metadataJson || '{}',
                },
              })
            }}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-xl"
          >
            Save Content Block
          </button>
        </div>

        <div className="bg-white border rounded-2xl p-5 space-y-3">
          <h2 className="text-xl font-bold text-gray-900">Create Media Asset</h2>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={mediaForm.sectionKey}
              onChange={(event) => setMediaForm((prev) => ({ ...prev, sectionKey: event.target.value }))}
              className="border rounded-xl px-3 py-2 text-sm"
              placeholder="Section key (HOME_PHOTOS)"
            />
            <select
              value={mediaForm.mediaType}
              onChange={(event) =>
                setMediaForm((prev) => ({ ...prev, mediaType: event.target.value as MediaType }))
              }
              className="border rounded-xl px-3 py-2 text-sm"
            >
              {MEDIA_TYPES.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </div>
          <input
            value={mediaForm.title}
            onChange={(event) => setMediaForm((prev) => ({ ...prev, title: event.target.value }))}
            className="w-full border rounded-xl px-3 py-2 text-sm"
            placeholder="Title"
          />
          <textarea
            value={mediaForm.description}
            onChange={(event) => setMediaForm((prev) => ({ ...prev, description: event.target.value }))}
            className="w-full border rounded-xl px-3 py-2 text-sm min-h-20"
            placeholder="Description"
          />
          <input
            value={mediaForm.url}
            onChange={(event) => setMediaForm((prev) => ({ ...prev, url: event.target.value }))}
            className="w-full border rounded-xl px-3 py-2 text-sm"
            placeholder="Media URL"
          />
          <input
            value={mediaForm.thumbnailUrl}
            onChange={(event) => setMediaForm((prev) => ({ ...prev, thumbnailUrl: event.target.value }))}
            className="w-full border rounded-xl px-3 py-2 text-sm"
            placeholder="Thumbnail URL (optional)"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={mediaForm.displayOrder}
              onChange={(event) => setMediaForm((prev) => ({ ...prev, displayOrder: event.target.value }))}
              className="border rounded-xl px-3 py-2 text-sm"
              placeholder="Display order"
            />
            <label className="border rounded-xl px-3 py-2 text-sm flex items-center gap-2">
              <input
                type="checkbox"
                checked={mediaForm.active}
                onChange={(event) => setMediaForm((prev) => ({ ...prev, active: event.target.checked }))}
              />
              Active
            </label>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!mediaForm.sectionKey.trim() || !mediaForm.url.trim()) {
                setError('Media section key and URL are required.')
                return
              }
              const payload: CreateMediaAssetData = {
                sectionKey: mediaForm.sectionKey.trim(),
                mediaType: mediaForm.mediaType,
                title: mediaForm.title || undefined,
                description: mediaForm.description || undefined,
                url: mediaForm.url.trim(),
                thumbnailUrl: mediaForm.thumbnailUrl || undefined,
                displayOrder: parseNonNegativeInt(mediaForm.displayOrder, 0),
                active: mediaForm.active,
              }
              createMediaAssetMutation.mutate(payload)
            }}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-xl"
          >
            Create Media Asset
          </button>
        </div>
      </section>

      <section id="content" className="bg-white border rounded-2xl p-5 scroll-mt-24">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Content Blocks</h2>
        <div className="space-y-4">
          {contentBlocks.map((block) => {
            const draft = contentDrafts[block.key]
            if (!draft) return null
            return (
              <div key={block.key} className="border rounded-xl p-3 space-y-2">
                <div className="text-sm font-semibold text-gray-700">{block.key}</div>
                <input
                  value={draft.title}
                  onChange={(event) =>
                    setContentDrafts((prev) => ({
                      ...prev,
                      [block.key]: { ...draft, title: event.target.value },
                    }))
                  }
                  className="w-full border rounded-lg px-2 py-1.5 text-sm"
                  placeholder="Title"
                />
                <input
                  value={draft.subtitle}
                  onChange={(event) =>
                    setContentDrafts((prev) => ({
                      ...prev,
                      [block.key]: { ...draft, subtitle: event.target.value },
                    }))
                  }
                  className="w-full border rounded-lg px-2 py-1.5 text-sm"
                  placeholder="Subtitle"
                />
                <textarea
                  value={draft.body}
                  onChange={(event) =>
                    setContentDrafts((prev) => ({
                      ...prev,
                      [block.key]: { ...draft, body: event.target.value },
                    }))
                  }
                  className="w-full border rounded-lg px-2 py-1.5 text-sm min-h-16"
                  placeholder="Body"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={draft.ctaLabel}
                    onChange={(event) =>
                      setContentDrafts((prev) => ({
                        ...prev,
                        [block.key]: { ...draft, ctaLabel: event.target.value },
                      }))
                    }
                    className="w-full border rounded-lg px-2 py-1.5 text-sm"
                    placeholder="CTA label"
                  />
                  <input
                    value={draft.ctaUrl}
                    onChange={(event) =>
                      setContentDrafts((prev) => ({
                        ...prev,
                        [block.key]: { ...draft, ctaUrl: event.target.value },
                      }))
                    }
                    className="w-full border rounded-lg px-2 py-1.5 text-sm"
                    placeholder="CTA URL"
                  />
                </div>
                <textarea
                  value={draft.metadataJson}
                  onChange={(event) =>
                    setContentDrafts((prev) => ({
                      ...prev,
                      [block.key]: { ...draft, metadataJson: event.target.value },
                    }))
                  }
                  className="w-full border rounded-lg px-2 py-1.5 text-sm min-h-20 font-mono"
                  placeholder="Metadata JSON"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!isValidJson(draft.metadataJson || '{}')) {
                        setError(`Metadata JSON is invalid for ${block.key}`)
                        return
                      }
                      upsertContentBlockMutation.mutate({ key: block.key, draft })
                    }}
                    className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => deleteContentBlockMutation.mutate(block.key)}
                    className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section id="media" className="bg-white border rounded-2xl p-5 scroll-mt-24">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Media Assets (Photos & Videos)</h2>
        <div className="space-y-3">
          {mediaAssets.map((asset) => {
            const draft = mediaDrafts[asset.id]
            if (!draft) return null
            return (
              <div key={asset.id} className="border rounded-xl p-3 space-y-2">
                <div className="text-xs text-gray-500">
                  #{asset.id} | {asset.sectionKey} | {asset.mediaType}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    value={draft.sectionKey}
                    onChange={(event) =>
                      setMediaDrafts((prev) => ({
                        ...prev,
                        [asset.id]: { ...draft, sectionKey: event.target.value },
                      }))
                    }
                    className="border rounded-lg px-2 py-1.5 text-sm"
                    placeholder="Section key"
                  />
                  <select
                    value={draft.mediaType}
                    onChange={(event) =>
                      setMediaDrafts((prev) => ({
                        ...prev,
                        [asset.id]: { ...draft, mediaType: event.target.value as MediaType },
                      }))
                    }
                    className="border rounded-lg px-2 py-1.5 text-sm"
                  >
                    {MEDIA_TYPES.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={draft.displayOrder}
                    onChange={(event) =>
                      setMediaDrafts((prev) => ({
                        ...prev,
                        [asset.id]: { ...draft, displayOrder: event.target.value },
                      }))
                    }
                    className="border rounded-lg px-2 py-1.5 text-sm"
                    placeholder="Order"
                  />
                </div>
                <input
                  value={draft.title}
                  onChange={(event) =>
                    setMediaDrafts((prev) => ({
                      ...prev,
                      [asset.id]: { ...draft, title: event.target.value },
                    }))
                  }
                  className="w-full border rounded-lg px-2 py-1.5 text-sm"
                  placeholder="Title"
                />
                <textarea
                  value={draft.description}
                  onChange={(event) =>
                    setMediaDrafts((prev) => ({
                      ...prev,
                      [asset.id]: { ...draft, description: event.target.value },
                    }))
                  }
                  className="w-full border rounded-lg px-2 py-1.5 text-sm min-h-16"
                  placeholder="Description"
                />
                <input
                  value={draft.url}
                  onChange={(event) =>
                    setMediaDrafts((prev) => ({
                      ...prev,
                      [asset.id]: { ...draft, url: event.target.value },
                    }))
                  }
                  className="w-full border rounded-lg px-2 py-1.5 text-sm"
                  placeholder="URL"
                />
                <input
                  value={draft.thumbnailUrl}
                  onChange={(event) =>
                    setMediaDrafts((prev) => ({
                      ...prev,
                      [asset.id]: { ...draft, thumbnailUrl: event.target.value },
                    }))
                  }
                  className="w-full border rounded-lg px-2 py-1.5 text-sm"
                  placeholder="Thumbnail URL"
                />
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.active}
                    onChange={(event) =>
                      setMediaDrafts((prev) => ({
                        ...prev,
                        [asset.id]: { ...draft, active: event.target.checked },
                      }))
                    }
                  />
                  Active
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateMediaAssetMutation.mutate({ mediaId: asset.id, draft })}
                    className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => deleteMediaAssetMutation.mutate(asset.id)}
                    className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default function AdminClient() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminInner />
    </ProtectedRoute>
  )
}
