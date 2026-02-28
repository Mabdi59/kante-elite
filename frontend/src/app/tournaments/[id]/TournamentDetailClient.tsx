'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getTournament, registerForTournament } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useState } from 'react'

const AGE_GROUPS = ['U8', 'U10', 'U12', 'U14', 'U16', 'U18'] as const

const regSchema = z.object({
  teamName: z.string().min(2, 'Team name required'),
  coachName: z.string().min(2, 'Coach name required'),
  contactEmail: z.string().email('Valid email required'),
  ageGroup: z.enum(AGE_GROUPS, { required_error: 'Age group required' }),
})
type RegFormData = z.infer<typeof regSchema>

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function TournamentDetailClient({ id }: { id: number }) {
  const { isAuthenticated } = useAuth()
  const [success, setSuccess] = useState(false)

  const { data: tournament, isLoading, isError } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => getTournament(id),
    enabled: !isNaN(id),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegFormData>({ resolver: zodResolver(regSchema) })

  const mutation = useMutation({
    mutationFn: (data: RegFormData) => registerForTournament(id, data),
    onSuccess: () => {
      setSuccess(true)
      reset()
    },
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isError || !tournament) {
    return (
      <div className="max-w-2xl mx-auto py-32 text-center text-red-600">
        Tournament not found or failed to load.
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Tournament Details */}
      <div className="bg-white rounded-2xl shadow-md p-8 mb-10">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
          <h1 className="text-3xl font-extrabold text-gray-900">{tournament.name}</h1>
          <span className="bg-green-100 text-green-700 font-bold px-4 py-2 rounded-full text-sm">
            {tournament.status}
          </span>
        </div>
        {tournament.description && (
          <p className="text-gray-600 mb-6">{tournament.description}</p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Dates', value: `${formatDate(tournament.startDate)} – ${formatDate(tournament.endDate)}` },
            { label: 'Location', value: tournament.location },
            { label: 'Teams', value: `${tournament.registeredTeams}/${tournament.maxTeams}` },
            {
              label: 'Entry Fee',
              value: `$${(tournament.entryFeeInCents / 100).toFixed(0)}`,
            },
          ].map((item) => (
            <div key={item.label}>
              <div className="text-xs font-semibold text-gray-400 uppercase mb-1">{item.label}</div>
              <div className="text-gray-800 font-medium">{item.value}</div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <span className="text-xs font-semibold text-gray-400 uppercase">Age Groups</span>
          <div className="flex gap-2 flex-wrap mt-2">
            {tournament.ageGroups.map((ag) => (
              <span
                key={ag}
                className="bg-green-50 text-green-700 border border-green-200 text-xs font-bold px-3 py-1 rounded-full"
              >
                {ag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Registration Form */}
      <div className="bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Register Your Team</h2>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center mb-6">
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="text-lg font-bold text-green-800 mb-1">Registration Submitted!</h3>
            <p className="text-green-700 text-sm">
              We&apos;ll confirm your team&apos;s spot via the email you provided.
            </p>
          </div>
        )}

        {!isAuthenticated && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-sm text-yellow-800">
            Please{' '}
            <a href="/login" className="font-semibold underline">
              log in
            </a>{' '}
            to register your team.
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                <input
                  {...register('teamName')}
                  className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Columbus FC Youth"
                />
                {errors.teamName && (
                  <p className="text-red-500 text-xs mt-1">{errors.teamName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coach Name</label>
                <input
                  {...register('coachName')}
                  className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="John Smith"
                />
                {errors.coachName && (
                  <p className="text-red-500 text-xs mt-1">{errors.coachName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  {...register('contactEmail')}
                  className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="coach@example.com"
                />
                {errors.contactEmail && (
                  <p className="text-red-500 text-xs mt-1">{errors.contactEmail.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age Group</label>
                <select
                  {...register('ageGroup')}
                  className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  <option value="">Select age group…</option>
                  {AGE_GROUPS.map((ag) => (
                    <option key={ag} value={ag}>
                      {ag}
                    </option>
                  ))}
                </select>
                {errors.ageGroup && (
                  <p className="text-red-500 text-xs mt-1">{errors.ageGroup.message}</p>
                )}
              </div>
            </div>

            {mutation.isError && (
              <p className="text-red-600 text-sm">Registration failed. Please try again.</p>
            )}

            <button
              type="submit"
              disabled={mutation.isPending || !isAuthenticated}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-colors"
            >
              {mutation.isPending ? 'Submitting…' : 'Register Team'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
