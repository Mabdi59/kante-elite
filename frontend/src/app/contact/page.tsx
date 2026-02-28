import type { Metadata } from 'next'
import ContactClient from './ContactClient'

export const metadata: Metadata = { title: 'Contact Us' }

export default function ContactPage() {
  return <ContactClient />
}
