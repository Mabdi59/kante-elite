'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, MapPin, ShieldCheck, X } from 'lucide-react'
import { createBooking, joinSessionWaitlist } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import type { Session } from '@/lib/types'
import StripePaymentPanel from '@/components/StripePaymentPanel'
import { safeStorage } from '@/lib/storage'

const bookingSchema = z.object({
  playerName: z.string().min(2, 'Player name is required'),
  playerNickname: z.string().max(120, 'Nickname is too long').optional(),
  playerAge: z.coerce.number().int().min(5, 'Min age 5').max(18, 'Max age 18'),
  notes: z.string().optional(),
})
type BookingFormData = z.infer<typeof bookingSchema>

const waitlistSchema = z.object({
  playerName: z.string().min(2, 'Player name is required'),
  playerNickname: z.string().max(120, 'Nickname is too long').optional(),
  playerAge: z.coerce.number().int().min(5, 'Min age 5').max(18, 'Max age 18').optional(),
  notes: z.string().optional(),
})
type WaitlistFormData = z.infer<typeof waitlistSchema>

interface SavedPlayerProfile {
  id: string
  name: string
  nickname?: string
  age: number
  notes?: string
}

type ToastState = { type: 'success' | 'error'; message: string } | null

const SAVED_PLAYERS_KEY = 'kante_elite_saved_players_v2'

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(0)}`
}

function formatDate(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return 'TBD'
  }
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getBookingErrorMessage(error: unknown): string {
  const maybeError = error as
    | {
        message?: string
        response?: { data?: { message?: string } }
      }
    | undefined
  const apiMessage = maybeError?.response?.data?.message
  if (typeof apiMessage === 'string' && apiMessage.trim()) {
    return apiMessage
  }
  if (typeof maybeError?.message === 'string' && maybeError.message.trim()) {
    return maybeError.message
  }
  return 'Something went wrong. Please try again.'
}

function getCurrentStep(confirmed: boolean, paymentClientSecret: string | null): number {
  if (confirmed) return 3
  if (paymentClientSecret) return 2
  return 1
}

function isSoldOut(session: Session): boolean {
  return session.maxParticipants > 0 && session.currentParticipants >= session.maxParticipants
}

export default function BookingFlow({
  session,
  onClose,
  onBooked,
}: {
  session: Session | null
  onClose: () => void
  onBooked?: () => void
}) {
  const { isAuthenticated, login } = useAuth()
  const [confirmed, setConfirmed] = useState(false)
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null)
  const [pendingProfileData, setPendingProfileData] = useState<BookingFormData | null>(null)
  const [savedPlayers, setSavedPlayers] = useState<SavedPlayerProfile[]>([])
  const [selectedSavedPlayerId, setSelectedSavedPlayerId] = useState('')
  const [saveProfile, setSaveProfile] = useState(false)
  const [showPolicy, setShowPolicy] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginSubmitting, setLoginSubmitting] = useState(false)
  const [pendingBookingSubmit, setPendingBookingSubmit] = useState<BookingFormData | null>(null)
  const [pendingWaitlistSubmit, setPendingWaitlistSubmit] = useState<WaitlistFormData | null>(null)

  const soldOut = session ? isSoldOut(session) : false
  const waitlistEnabled = Boolean(session?.waitlistEnabled)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm<BookingFormData>({ resolver: zodResolver(bookingSchema) })

  const {
    register: registerWaitlist,
    handleSubmit: handleWaitlistSubmit,
    formState: { errors: waitlistErrors },
    reset: resetWaitlist,
  } = useForm<WaitlistFormData>({ resolver: zodResolver(waitlistSchema) })

  useEffect(() => {
    const raw = safeStorage.getItem(SAVED_PLAYERS_KEY)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return
      const normalized = parsed
        .filter((item): item is SavedPlayerProfile => {
          return item && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.age === 'number'
        })
        .slice(0, 8)
      setSavedPlayers(normalized)
    } catch {
      // ignore malformed local data
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3000)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!session) return
    setConfirmed(false)
    setPaymentClientSecret(null)
    setPendingProfileData(null)
    setSelectedSavedPlayerId('')
    setSaveProfile(false)
    reset()
    resetWaitlist()
  }, [session, reset, resetWaitlist])

  const persistSavedPlayers = (nextPlayers: SavedPlayerProfile[]) => {
    setSavedPlayers(nextPlayers)
    safeStorage.setItem(SAVED_PLAYERS_KEY, JSON.stringify(nextPlayers))
  }

  const upsertSavedPlayer = (data: BookingFormData) => {
    const normalizedName = data.playerName.trim()
    if (!normalizedName) {
      return
    }
    const normalizedNickname = data.playerNickname?.trim() || undefined
    const normalizedNotes = data.notes?.trim() || undefined
    const existing = savedPlayers.find(
      (player) => player.name.toLowerCase() === normalizedName.toLowerCase() && player.age === data.playerAge
    )

    let nextPlayers: SavedPlayerProfile[]
    if (existing) {
      nextPlayers = savedPlayers.map((player) =>
        player.id === existing.id
          ? {
              ...player,
              name: normalizedName,
              nickname: normalizedNickname,
              age: data.playerAge,
              notes: normalizedNotes,
            }
          : player
      )
    } else {
      const newProfile: SavedPlayerProfile = {
        id: `${Date.now()}-${Math.round(Math.random() * 100000)}`,
        name: normalizedName,
        nickname: normalizedNickname,
        age: data.playerAge,
        notes: normalizedNotes,
      }
      nextPlayers = [newProfile, ...savedPlayers].slice(0, 8)
    }

    persistSavedPlayers(nextPlayers)
  }

  const applySavedPlayer = (savedPlayerId: string) => {
    setSelectedSavedPlayerId(savedPlayerId)
    const profile = savedPlayers.find((player) => player.id === savedPlayerId)
    if (!profile) return
    setValue('playerName', profile.name, { shouldDirty: true, shouldValidate: true })
    setValue('playerNickname', profile.nickname ?? '', { shouldDirty: true })
    setValue('playerAge', profile.age, { shouldDirty: true, shouldValidate: true })
    setValue('notes', profile.notes ?? '', { shouldDirty: true })
  }

  const removeSelectedSavedPlayer = () => {
    if (!selectedSavedPlayerId) return
    const nextPlayers = savedPlayers.filter((player) => player.id !== selectedSavedPlayerId)
    persistSavedPlayers(nextPlayers)
    setSelectedSavedPlayerId('')
  }

  const bookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      if (!session) {
        throw new Error('Session is missing')
      }
      const booking = await createBooking(session.id, {
        playerName: data.playerName,
        playerNickname: data.playerNickname,
        playerAge: data.playerAge,
        notes: data.notes,
      })
      const clientSecret = booking.clientSecret?.trim()
      if (!clientSecret) {
        throw new Error('Payment setup failed. Please try again.')
      }
      return { clientSecret, formData: data }
    },
    onSuccess: ({ clientSecret, formData }) => {
      setPaymentClientSecret(clientSecret)
      setPendingProfileData(formData)
      setToast({ type: 'success', message: 'Player details saved. Continue with payment.' })
    },
    onError: (error) => {
      setToast({ type: 'error', message: getBookingErrorMessage(error) })
    },
  })

  const waitlistMutation = useMutation({
    mutationFn: async (data: WaitlistFormData) => {
      if (!session) {
        throw new Error('Session is missing')
      }
      return joinSessionWaitlist(session.id, data)
    },
    onSuccess: () => {
      setToast({ type: 'success', message: 'You were added to the waitlist.' })
      onClose()
      onBooked?.()
    },
    onError: (error) => {
      setToast({ type: 'error', message: getBookingErrorMessage(error) })
    },
  })

  const sessionSummary = useMemo(() => {
    if (!session) return null
    const available = Math.max(0, session.maxParticipants - session.currentParticipants)
    return {
      date: formatDate(session.scheduledAt),
      price: formatPrice(session.priceInCents),
      location: session.location ?? 'Location TBD',
      spotsLeft: available,
    }
  }, [session])

  const currentStep = getCurrentStep(confirmed, paymentClientSecret)

  if (!session) {
    return null
  }

  const submitBooking = (data: BookingFormData) => {
    if (session.minAge != null && data.playerAge < session.minAge) {
      setError('playerAge', { message: `Player must be at least ${session.minAge}` })
      return
    }
    if (session.maxAge != null && data.playerAge > session.maxAge) {
      setError('playerAge', { message: `Player must be ${session.maxAge} or younger` })
      return
    }

    if (!isAuthenticated) {
      setPendingBookingSubmit(data)
      setPendingWaitlistSubmit(null)
      setShowLoginModal(true)
      return
    }
    bookingMutation.mutate(data)
  }

  const submitWaitlist = (data: WaitlistFormData) => {
    if (!isAuthenticated) {
      setPendingWaitlistSubmit(data)
      setPendingBookingSubmit(null)
      setShowLoginModal(true)
      return
    }
    waitlistMutation.mutate(data)
  }

  const submitLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoginError(null)
    setLoginSubmitting(true)
    try {
      await login(loginEmail, loginPassword)
      setShowLoginModal(false)
      if (pendingBookingSubmit) {
        const payload = pendingBookingSubmit
        setPendingBookingSubmit(null)
        bookingMutation.mutate(payload)
      } else if (pendingWaitlistSubmit) {
        const payload = pendingWaitlistSubmit
        setPendingWaitlistSubmit(null)
        waitlistMutation.mutate(payload)
      }
    } catch {
      setLoginError('Invalid email or password. Please try again.')
    } finally {
      setLoginSubmitting(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm px-4 py-6 md:py-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">{session.title}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{sessionSummary?.date}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-gray-200 p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              aria-label="Close booking flow"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {!soldOut && (
            <div className="px-6 pt-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                {['Player Info', 'Payment', 'Confirmation'].map((label, index) => (
                  <div key={label} className="flex items-center gap-2">
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center ${
                        currentStep >= index + 1 ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span className={currentStep >= index + 1 ? 'text-green-700' : ''}>{label}</span>
                    {index < 2 && <span className="text-gray-300">-</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-0 lg:gap-8 p-6">
            <div>
              {soldOut ? (
                waitlistEnabled ? (
                  <div>
                    <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 text-sm mb-5">
                      Session is currently full. Join the waitlist and we will notify you when a spot opens.
                    </div>
                    <form onSubmit={handleWaitlistSubmit(submitWaitlist)} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Player Name</label>
                        <input
                          {...registerWaitlist('playerName')}
                          className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        {waitlistErrors.playerName && (
                          <p className="text-red-500 text-xs mt-1">{waitlistErrors.playerName.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Player Nickname (optional)</label>
                        <input
                          {...registerWaitlist('playerNickname')}
                          className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Player Age (optional)</label>
                        <input
                          type="number"
                          {...registerWaitlist('playerAge')}
                          className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                        <textarea
                          rows={3}
                          {...registerWaitlist('notes')}
                          className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={waitlistMutation.isPending}
                        className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors"
                      >
                        {waitlistMutation.isPending ? 'Joining Waitlist...' : 'Join Waitlist'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
                    <div className="font-semibold">Sold out</div>
                    <p className="text-sm mt-1">This session has no remaining spots and waitlist is disabled.</p>
                  </div>
                )
              ) : confirmed ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <h3 className="text-2xl font-bold text-green-800 mb-2">Booking Confirmed!</h3>
                  <p className="text-green-700 mb-6">
                    You&apos;re registered for <strong>{session.title}</strong>. Check your email for details.
                  </p>
                  <button
                    onClick={() => {
                      onClose()
                      onBooked?.()
                    }}
                    className="bg-green-700 text-white px-6 py-3 rounded-xl hover:bg-green-800 transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : paymentClientSecret ? (
                <StripePaymentPanel
                  clientSecret={paymentClientSecret}
                  amountInCents={session.priceInCents}
                  onSuccess={() => {
                    if (saveProfile && pendingProfileData) {
                      upsertSavedPlayer(pendingProfileData)
                    }
                    setConfirmed(true)
                    setPaymentClientSecret(null)
                    setPendingProfileData(null)
                    bookingMutation.reset()
                    setToast({ type: 'success', message: 'Payment successful. Booking confirmed.' })
                  }}
                />
              ) : (
                <form onSubmit={handleSubmit(submitBooking)} className="space-y-5">
                  {savedPlayers.length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Saved Player Profile</label>
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedSavedPlayerId}
                          onChange={(e) => applySavedPlayer(e.target.value)}
                          className="w-full border rounded-xl px-3 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Select a saved player</option>
                          {savedPlayers.map((player) => (
                            <option key={player.id} value={player.id}>
                              {player.name} ({player.age})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={removeSelectedSavedPlayer}
                          disabled={!selectedSavedPlayerId}
                          className="inline-flex items-center justify-center px-3 py-2.5 border rounded-xl text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Player Name</label>
                    <input
                      {...register('playerName')}
                      className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {errors.playerName && <p className="text-red-500 text-xs mt-1">{errors.playerName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Player Nickname (optional)</label>
                    <input
                      {...register('playerNickname')}
                      className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Player Age</label>
                    <input
                      type="number"
                      {...register('playerAge')}
                      className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {errors.playerAge && <p className="text-red-500 text-xs mt-1">{errors.playerAge.message}</p>}
                    {(session.minAge != null || session.maxAge != null) && (
                      <p className="text-xs text-gray-500 mt-1">
                        Allowed range: {session.minAge ?? 5} - {session.maxAge ?? 18}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                    <textarea
                      {...register('notes')}
                      rows={3}
                      className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    />
                  </div>

                  <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={saveProfile}
                      onChange={(e) => setSaveProfile(e.target.checked)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    Save this player profile for future bookings
                  </label>

                  <button
                    type="submit"
                    disabled={bookingMutation.isPending}
                    className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
                  >
                    {bookingMutation.isPending
                      ? 'Starting Payment...'
                      : `Continue to Payment | ${formatPrice(session.priceInCents)}`}
                  </button>

                  <div className="border border-gray-200 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setShowPolicy((previous) => !previous)}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700"
                    >
                      <span>Cancellation & Refund Policy</span>
                      <span>{showPolicy ? '-' : '+'}</span>
                    </button>
                    {showPolicy && (
                      <div className="px-4 pb-4 text-sm text-gray-600">
                        Cancellations made at least 24 hours in advance are eligible for a full refund or credit.
                        Late cancellations may be subject to a partial fee.
                      </div>
                    )}
                  </div>
                </form>
              )}
            </div>

            <aside className="mt-8 lg:mt-0">
              <div className="lg:sticky lg:top-6 rounded-2xl border border-gray-200 bg-gray-50 p-5 space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Session Summary</div>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="font-bold text-gray-900 text-base">{session.title}</div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-green-700" />
                    <span>{sessionSummary?.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-green-700" />
                    <span>{session.durationMinutes} min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-700" />
                    <span>{sessionSummary?.location}</span>
                  </div>
                </div>
                <div className="rounded-xl bg-white border border-gray-200 p-4">
                  <div className="text-xs text-gray-500 mb-1">Price</div>
                  <div className="text-2xl font-extrabold text-gray-900">{sessionSummary?.price}</div>
                  <div className="text-xs text-gray-500">per athlete</div>
                </div>
                <div className="rounded-xl bg-white border border-gray-200 p-4">
                  <div className="text-xs text-gray-500 mb-1">Spots left</div>
                  <div className={`text-xl font-bold ${soldOut ? 'text-red-600' : 'text-green-700'}`}>
                    {soldOut ? 'Sold Out' : sessionSummary?.spotsLeft}
                  </div>
                </div>
                <div className="rounded-xl border border-green-100 bg-green-50 p-3 text-xs text-green-800 inline-flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 mt-0.5" />
                  <span>Secure checkout powered by Stripe.</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {showLoginModal && (
        <div className="fixed inset-0 z-[80] bg-black/55 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 shadow-2xl p-6">
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">Sign in to continue booking</h3>
            <p className="text-sm text-gray-600 mb-4">Your selected session is saved. Sign in to continue.</p>
            <form onSubmit={submitLogin} className="space-y-3">
              <input
                type="email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                placeholder="Email"
                className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                placeholder="Password"
                className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {loginError && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  {loginError}
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="w-1/2 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loginSubmitting}
                  className="w-1/2 rounded-xl bg-green-700 py-3 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60"
                >
                  {loginSubmitting ? 'Signing in...' : 'Sign In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-20 right-4 z-[90]">
          <div
            className={`rounded-xl border px-4 py-3 shadow-lg text-sm font-medium ${
              toast.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-start gap-2">
              {toast.type === 'error' && <AlertTriangle className="h-4 w-4 mt-0.5" />}
              <span>{toast.message}</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
