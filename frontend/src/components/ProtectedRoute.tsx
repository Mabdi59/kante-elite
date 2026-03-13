'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import type { UserRole } from '@/lib/types'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, role, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      const loginUrl = pathname && pathname !== '/login' ? `/login?redirect=${encodeURIComponent(pathname)}` : '/login'
      router.replace(loginUrl)
      return
    }
    if (requiredRole && role !== requiredRole) {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, role, isLoading, requiredRole, router, pathname])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null
  if (requiredRole && role !== requiredRole) return null

  return <>{children}</>
}
