'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { createBooking } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import type { Session } from '@/lib/types'

const bookingSchema = z.object({
  playerName: z.string().min(2, 'Player name is required'),
  playerAge: z.coerce.number().int().min(5, 'Min age 5').max(18, 'Max age 18'),
  notes: z.string().optional(),
})
type BookingFormData = z.infer<typeof bookingSchema>

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

interface BookingFlowProps {
  sessions: Session[]
}

export default function BookingFlow({ sessions }: BookingFlowProps) {
  const { isAuthenticated } = useAuth()
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BookingFormData>({ resolver: zodResolver(bookingSchema) })

  const mutation = useMutation({
    mutationFn: (data: BookingFormData) =>
      createBooking(selectedSession!.id, {
        playerName: data.playerName,
        playerAge: data.playerAge,
        notes: data.notes,
      }),
    onSuccess: () => {
      setConfirmed(true)
      reset()
    },
  })

  if (confirmed) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-green-800 mb-2">Booking Confirmed!</h3>
        <p className="text-green-700 mb-6">
          You&apos;re registered for{' '}
          <strong>{selectedSession?.title}</strong>. Check your email for details.
        </p>
        <button
          onClick={() => {
            setConfirmed(false)
            setSelectedSession(null)
          }}
          className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors"
        >
          Book Another Session
        </button>
      </div>
    )
  }

  if (selectedSession) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-8 max-w-lg mx-auto">
        <button
          onClick={() => setSelectedSession(null)}
          className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
        >
          ← Back to sessions
        </button>
        <h3 className="text-xl font-bold text-gray-900 mb-1">{selectedSession.title}</h3>
        <p className="text-gray-500 text-sm mb-6">
          {formatDate(selectedSession.scheduledAt)} · {formatPrice(selectedSession.priceInCents)}
        </p>

        {!isAuthenticated && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-sm text-yellow-800">
            Please{' '}
            <a href="/login" className="font-semibold underline">
              log in
            </a>{' '}
            to complete your booking.
          </div>
        )}

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Player Name</label>
            <input
              {...register('playerName')}
              className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g. Alex Johnson"
            />
            {errors.playerName && (
              <p className="text-red-500 text-xs mt-1">{errors.playerName.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Player Age</label>
            <input
              type="number"
              {...register('playerAge')}
              className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g. 12"
            />
            {errors.playerAge && (
              <p className="text-red-500 text-xs mt-1">{errors.playerAge.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              placeholder="Any special requests or medical notes..."
            />
          </div>

          {mutation.isError && (
            <p className="text-red-600 text-sm">
              Something went wrong. Please try again.
            </p>
          )}

          <button
            type="submit"
            disabled={mutation.isPending || !isAuthenticated}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {mutation.isPending ? 'Booking…' : `Confirm Booking · ${formatPrice(selectedSession.priceInCents)}`}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sessions.map((s) => (
        <div key={s.id} className="bg-white rounded-2xl shadow-md p-6 flex flex-col">
          <span
            className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 self-start ${
              s.sessionType === 'PRIVATE'
                ? 'bg-purple-100 text-purple-700'
                : s.sessionType === 'GROUP'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-orange-100 text-orange-700'
            }`}
          >
            {s.sessionType}
          </span>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{s.title}</h3>
          {s.description && <p className="text-gray-500 text-sm mb-3">{s.description}</p>}
          <div className="text-sm text-gray-600 space-y-1 mb-4">
            <div>📅 {formatDate(s.scheduledAt)}</div>
            <div>⏱ {s.durationMinutes} min</div>
            <div>
              👥 {s.currentParticipants}/{s.maxParticipants} spots
            </div>
            {s.location && <div>📍 {s.location}</div>}
          </div>
          <div className="mt-auto flex items-center justify-between">
            <span className="text-xl font-extrabold text-green-700">
              {formatPrice(s.priceInCents)}
            </span>
            <button
              onClick={() => setSelectedSession(s)}
              disabled={s.currentParticipants >= s.maxParticipants}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl transition-colors text-sm"
            >
              {s.currentParticipants >= s.maxParticipants ? 'Full' : 'Book Now'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
