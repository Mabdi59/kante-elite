'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { AuthContext } from '@/lib/auth'
import { getMe, login as apiLogin } from '@/lib/api'
import type { User } from '@/lib/types'
import { safeStorage } from '@/lib/storage'

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // NOTE: JWT is stored in localStorage for simplicity. This is acceptable when combined
    // with a strict Content Security Policy (CSP) to mitigate XSS risk. For higher-security
    // deployments, replace with httpOnly cookies via a Next.js API route proxy.
    const token = safeStorage.getItem('token')
    if (!token) {
      setIsLoading(false)
      return
    }
    getMe()
      .then(setUser)
      .catch(() => safeStorage.removeItem('token'))
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { token } = await apiLogin(email, password)
    safeStorage.setItem('token', token)
    try {
      const me = await getMe()
      setUser(me)
    } catch (error) {
      safeStorage.removeItem('token')
      setUser(null)
      throw error
    }
  }, [])

  const logout = useCallback(() => {
    safeStorage.removeItem('token')
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      role: user?.role ?? null,
      isLoading,
      login,
      logout,
    }),
    [user, isLoading, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}
