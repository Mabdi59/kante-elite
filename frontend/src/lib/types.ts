// Entity types for Kante Elite Training platform

export type UserRole = 'PARENT' | 'COACH' | 'ADMIN'
export type SessionType = 'PRIVATE' | 'GROUP' | 'SPEED'
export type AgeGroup = 'U8' | 'U10' | 'U12' | 'U14' | 'U16' | 'U18'
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED'
export type TournamentStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED'

export interface User {
  id: number
  name: string
  email: string
  phone?: string
  role: UserRole
  createdAt: string
}

export interface Session {
  id: number
  title: string
  sessionType: SessionType
  description?: string
  coachId: number
  coach?: User
  scheduledAt: string
  durationMinutes: number
  maxParticipants: number
  currentParticipants: number
  priceInCents: number
  location?: string
  createdAt: string
}

export interface Booking {
  id: number
  sessionId: number
  session?: Session
  userId: number
  user?: User
  playerName: string
  playerAge: number
  status: BookingStatus
  notes?: string
  createdAt: string
}

export interface Tournament {
  id: number
  name: string
  description?: string
  location: string
  startDate: string
  endDate: string
  ageGroups: AgeGroup[]
  maxTeams: number
  registeredTeams: number
  entryFeeInCents: number
  status: TournamentStatus
  createdAt: string
}

export interface Team {
  id: number
  name: string
  coachName: string
  contactEmail: string
  ageGroup: AgeGroup
}

export interface TournamentRegistration {
  id: number
  tournamentId: number
  tournament?: Tournament
  teamName: string
  coachName: string
  contactEmail: string
  ageGroup: AgeGroup
  status: BookingStatus
  createdAt: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface ApiError {
  message: string
  statusCode?: number
}

// Form data types
export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  name: string
  email: string
  password: string
  phone?: string
}

export interface BookingFormData {
  playerName: string
  playerAge: number
  notes?: string
}

export interface TournamentRegistrationFormData {
  teamName: string
  coachName: string
  contactEmail: string
  ageGroup: AgeGroup
}

export interface SessionFormData {
  title: string
  sessionType: SessionType
  description?: string
  scheduledAt: string
  durationMinutes: number
  maxParticipants: number
  priceInCents: number
  location?: string
}

export interface ContactFormData {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}
