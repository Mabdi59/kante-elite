import type { Metadata } from 'next'
import AdminClient from './AdminClient'

export const metadata: Metadata = { title: 'Admin Dashboard' }

export default function AdminPage() {
  return <AdminClient />
}
