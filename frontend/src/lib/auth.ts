import { createContext, useContext } from 'react'
import type { User, UserRole } from './types'

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  role: UserRole | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
