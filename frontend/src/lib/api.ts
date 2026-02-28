import axios from 'axios'
import type {
  AuthResponse,
  Booking,
  BookingFormData,
  Session,
  SessionFormData,
  Tournament,
  TournamentRegistration,
  TournamentRegistrationFormData,
  User,
} from './types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT from localStorage on every request
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Response interceptor: clear token on 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token')
    }
    return Promise.reject(error)
  }
)

// Auth
export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/api/auth/login', { email, password })
  return data
}

export async function register(
  name: string,
  email: string,
  password: string,
  phone?: string
): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/api/auth/register', {
    name,
    email,
    password,
    phone,
  })
  return data
}

export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<User>('/api/auth/me')
  return data
}

// Sessions
export async function getSessions(): Promise<Session[]> {
  const { data } = await apiClient.get<Session[]>('/api/sessions')
  return data
}

export async function createAdminSession(payload: SessionFormData): Promise<Session> {
  const { data } = await apiClient.post<Session>('/api/sessions', payload)
  return data
}

// Bookings
export async function createBooking(
  sessionId: number,
  payload: BookingFormData
): Promise<Booking> {
  const { data } = await apiClient.post<Booking>(`/api/sessions/${sessionId}/bookings`, payload)
  return data
}

export async function getMyBookings(): Promise<Booking[]> {
  const { data } = await apiClient.get<Booking[]>('/api/bookings/me')
  return data
}

// Tournaments
export async function getTournaments(): Promise<Tournament[]> {
  const { data } = await apiClient.get<Tournament[]>('/api/tournaments')
  return data
}

export async function getTournament(id: number): Promise<Tournament> {
  const { data } = await apiClient.get<Tournament>(`/api/tournaments/${id}`)
  return data
}

export async function registerForTournament(
  tournamentId: number,
  payload: TournamentRegistrationFormData
): Promise<TournamentRegistration> {
  const { data } = await apiClient.post<TournamentRegistration>(
    `/api/tournaments/${tournamentId}/registrations`,
    payload
  )
  return data
}

export async function getAdminRegistrations(): Promise<TournamentRegistration[]> {
  const { data } = await apiClient.get<TournamentRegistration[]>('/api/admin/registrations')
  return data
}
