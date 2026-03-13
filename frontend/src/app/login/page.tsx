import type { Metadata } from 'next'
import { Suspense } from 'react'
import LoginClient from './LoginClient'

export const metadata: Metadata = { title: 'Login' }

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <LoginClient />
    </Suspense>
  )
}
