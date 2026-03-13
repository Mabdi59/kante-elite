import type { Metadata } from 'next'
import { Suspense } from 'react'
import LoginClient from './LoginClient'
import LoadingSpinner from '@/components/LoadingSpinner'

export const metadata: Metadata = { title: 'Login' }

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <LoginClient />
    </Suspense>
  )
}
