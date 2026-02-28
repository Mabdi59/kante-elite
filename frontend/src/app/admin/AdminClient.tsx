'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import ProtectedRoute from '@/components/ProtectedRoute'
import { getSessions, getAdminRegistrations, createAdminSession } from '@/lib/api'
import type { SessionType } from '@/lib/types'

const SESSION_TYPES: SessionType[] = ['PRIVATE', 'GROUP', 'SPEED']

const sessionSchema = z.object({
  title: z.string().min(3, 'Title required'),
  sessionType: z.enum(['PRIVATE', 'GROUP', 'SPEED'] as const),
  description: z.string().optional(),
  scheduledAt: z.string().min(1, 'Date/time required'),
  durationMinutes: z.coerce.number().int().min(30, 'Min 30 min').max(240, 'Max 240 min'),
  maxParticipants: z.coerce.number().int().min(1).max(50),
  priceInCents: z.coerce.number().int().min(100, 'Price required'),
  location: z.string().optional(),
})
type SessionFormData = z.infer<typeof sessionSchema>

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function AdminInner() {
  const qc = useQueryClient()

  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: getSessions,
  })

  const { data: registrations } = useQuery({
    queryKey: ['admin-registrations'],
    queryFn: getAdminRegistrations,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SessionFormData>({ resolver: zodResolver(sessionSchema) })

  const mutation = useMutation({
    mutationFn: createAdminSession,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
      reset()
    },
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-10">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Total Sessions', value: sessions?.length ?? 0, icon: '📋', color: 'bg-blue-50 text-blue-700' },
          { label: 'Registrations', value: registrations?.length ?? 0, icon: '📝', color: 'bg-green-50 text-green-700' },
          {
            label: 'Active Sessions',
            value: sessions?.filter((s) => new Date(s.scheduledAt) > new Date()).length ?? 0,
            icon: '⏳',
            color: 'bg-yellow-50 text-yellow-700',
          },
          {
            label: 'Fully Booked',
            value: sessions?.filter((s) => s.currentParticipants >= s.maxParticipants).length ?? 0,
            icon: '🔒',
            color: 'bg-red-50 text-red-700',
          },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-6 ${s.color}`}>
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-3xl font-extrabold">{s.value}</div>
            <div className="text-sm font-medium mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Create Session Form */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Session</h2>
          <div className="bg-white rounded-2xl shadow-md p-8">
            <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  {...register('title')}
                  className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g. Monday Private Training"
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session Type</label>
                <select
                  {...register('sessionType')}
                  className="w-full border rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {SESSION_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  {...register('description')}
                  rows={2}
                  className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    {...register('scheduledAt')}
                    className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  {errors.scheduledAt && (
                    <p className="text-red-500 text-xs mt-1">{errors.scheduledAt.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (min)
                  </label>
                  <input
                    type="number"
                    {...register('durationMinutes')}
                    className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="60"
                  />
                  {errors.durationMinutes && (
                    <p className="text-red-500 text-xs mt-1">{errors.durationMinutes.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Participants
                  </label>
                  <input
                    type="number"
                    {...register('maxParticipants')}
                    className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (cents)
                  </label>
                  <input
                    type="number"
                    {...register('priceInCents')}
                    className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="8000"
                  />
                  {errors.priceInCents && (
                    <p className="text-red-500 text-xs mt-1">{errors.priceInCents.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  {...register('location')}
                  className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Field 3, Olentangy Park"
                />
              </div>

              {mutation.isError && (
                <p className="text-red-600 text-sm">Failed to create session. Please try again.</p>
              )}
              {mutation.isSuccess && (
                <p className="text-green-600 text-sm">Session created successfully!</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || mutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
              >
                {mutation.isPending ? 'Creating…' : 'Create Session'}
              </button>
            </form>
          </div>
        </div>

        {/* Tournament Registrations */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Tournament Registrations</h2>
          {!registrations || registrations.length === 0 ? (
            <div className="text-center text-gray-500 py-16 bg-gray-50 rounded-2xl">
              No registrations yet.
            </div>
          ) : (
            <div className="space-y-4">
              {registrations.map((r) => (
                <div key={r.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <div className="font-bold text-gray-900">{r.teamName}</div>
                      <div className="text-sm text-gray-500">
                        Coach: {r.coachName} · {r.contactEmail}
                      </div>
                      <div className="text-sm text-gray-500">
                        Age Group: <span className="font-medium">{r.ageGroup}</span>
                      </div>
                      {r.tournament && (
                        <div className="text-sm text-gray-400 mt-1">
                          Tournament: {r.tournament.name}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        Registered: {formatDate(r.createdAt)}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        r.status === 'CONFIRMED'
                          ? 'bg-green-100 text-green-700'
                          : r.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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
