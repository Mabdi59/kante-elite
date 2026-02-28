import type { Metadata } from 'next'
import TournamentDetailClient from './TournamentDetailClient'

export const metadata: Metadata = { title: 'Tournament Detail' }

export default function TournamentDetailPage({ params }: { params: { id: string } }) {
  return <TournamentDetailClient id={Number(params.id)} />
}
