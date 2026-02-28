import type { Metadata } from 'next'
import TournamentsClient from './TournamentsClient'

export const metadata: Metadata = { title: 'Tournaments' }

export default function TournamentsPage() {
  return <TournamentsClient />
}
