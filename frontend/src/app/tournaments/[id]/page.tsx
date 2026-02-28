import type { Metadata } from 'next'
import TournamentDetailClient from './TournamentDetailClient'

export const metadata: Metadata = { title: 'Tournament Detail' }

export default async function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TournamentDetailClient id={Number(id)} />
}
