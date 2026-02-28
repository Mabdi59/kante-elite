import type { Metadata } from 'next'
import ProgramsClient from './ProgramsClient'

export const metadata: Metadata = { title: 'Programs' }

export default function ProgramsPage() {
  return <ProgramsClient />
}
