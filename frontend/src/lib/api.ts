import axios from 'axios'
import type {
  AdminTournamentStatus,
  AgeGroup,
  AuthResponse,
  Booking,
  BookingFormData,
  BookingUpdateData,
  CreateMediaAssetData,
  MediaAsset,
  Session,
  SessionCatalogFilters,
  SessionCatalogResult,
  SessionFormData,
  SkillLevel,
  CreateWaitlistEntryData,
  WaitlistEntry,
  SessionUpdateData,
  SiteContentBlock,
  SiteContentBlockUpsertData,
  Tournament,
  TournamentFormData,
  TournamentRegistration,
  TournamentRegistrationFormData,
  TournamentRegistrationUpdateData,
  TournamentUpdateData,
  UpdateMediaAssetData,
  User,
} from './types'
import { safeStorage } from './storage'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT from localStorage on every request
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = safeStorage.getItem('token')
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
      safeStorage.removeItem('token')
    }
    return Promise.reject(error)
  }
)

type RawTournament = Partial<Tournament> & {
  ageGroups?: unknown
  registrationFeeCents?: number | string | null
  status?: string | null
}

type RawSession = Partial<Session> & {
  type?: string | null
  startTime?: string | null
  endTime?: string | null
  coachName?: string | null
  capacity?: number | string | null
  currentParticipants?: number | string | null
  availableSpots?: number | string | null
  priceCents?: number | string | null
  ageGroup?: string | null
  skillLevel?: string | null
  imageUrl?: string | null
  minAge?: number | string | null
  maxAge?: number | string | null
  featured?: boolean | null
  waitlistEnabled?: boolean | null
  published?: boolean | null
}

type RawBooking = Partial<Booking> & {
  sessionTitle?: string | null
  sessionType?: string | null
  sessionStartTime?: string | null
  sessionPriceCents?: number | string | null
  userName?: string | null
  userEmail?: string | null
  playerNotes?: string | null
  playerNickname?: string | null
  clientSecret?: string | null
}

type RawTournamentRegistration = Partial<TournamentRegistration> & {
  tournamentName?: string | null
  paymentStatus?: string | null
  clientSecret?: string | null
}

type RawSiteContentBlock = {
  key?: string | null
  title?: string | null
  subtitle?: string | null
  body?: string | null
  ctaLabel?: string | null
  ctaUrl?: string | null
  metadataJson?: string | null
  updatedAt?: string | null
}

type RawMediaAsset = {
  id?: number | string | null
  sectionKey?: string | null
  mediaType?: string | null
  title?: string | null
  description?: string | null
  url?: string | null
  thumbnailUrl?: string | null
  displayOrder?: number | string | null
  active?: boolean | null
  updatedAt?: string | null
}

type RawWaitlistEntry = Partial<WaitlistEntry> & {
  playerNickname?: string | null
  createdAt?: string | null
}

const TOURNAMENT_STATUS_MAP: Record<string, Tournament['status']> = {
  UPCOMING: 'UPCOMING',
  ACTIVE: 'ONGOING',
  ONGOING: 'ONGOING',
  COMPLETED: 'COMPLETED',
  COMPLETE: 'COMPLETED',
  FINISHED: 'COMPLETED',
}

const AGE_GROUP_SET = new Set<AgeGroup>(['U8', 'U10', 'U12', 'U14', 'U16', 'U18'])
const SESSION_TYPE_MAP: Record<string, Session['sessionType']> = {
  PRIVATE: 'PRIVATE',
  GROUP: 'GROUP',
  SPEED: 'SPEED',
  SPEED_AND_AGILITY: 'SPEED',
}

const SKILL_LEVEL_MAP: Record<string, SkillLevel> = {
  BEGINNER: 'BEGINNER',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED',
  ALL_LEVELS: 'ALL_LEVELS',
}

const ADMIN_TOURNAMENT_STATUS_MAP: Record<string, AdminTournamentStatus> = {
  UPCOMING: 'UPCOMING',
  ACTIVE: 'ACTIVE',
  ONGOING: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  COMPLETE: 'COMPLETED',
  FINISHED: 'COMPLETED',
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

function parseJsonObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'string') {
    return {}
  }
  try {
    const parsed = JSON.parse(value)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
    return {}
  } catch {
    return {}
  }
}

function normalizeTournamentStatus(value: unknown): Tournament['status'] {
  if (typeof value !== 'string') {
    return 'UPCOMING'
  }
  const normalized = TOURNAMENT_STATUS_MAP[value.trim().toUpperCase()]
  return normalized ?? 'UPCOMING'
}

function normalizeAdminTournamentStatus(value: unknown): AdminTournamentStatus {
  if (typeof value !== 'string') {
    return 'UPCOMING'
  }
  const normalized = ADMIN_TOURNAMENT_STATUS_MAP[value.trim().toUpperCase()]
  return normalized ?? 'UPCOMING'
}

function normalizeAgeGroups(value: unknown): AgeGroup[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim().toUpperCase())
      .filter((group): group is AgeGroup => AGE_GROUP_SET.has(group as AgeGroup))
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return []
    }

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed)
        return normalizeAgeGroups(parsed)
      } catch {
        // Fall through and try delimiter-based parsing.
      }
    }

    return trimmed
      .split(/[,\|/]/)
      .map((item) => item.trim().toUpperCase())
      .filter((group): group is AgeGroup => AGE_GROUP_SET.has(group as AgeGroup))
  }

  return []
}

function normalizeSessionType(value: unknown): Session['sessionType'] {
  if (typeof value !== 'string') {
    return 'GROUP'
  }
  const normalized = SESSION_TYPE_MAP[value.trim().toUpperCase()]
  return normalized ?? 'GROUP'
}

function normalizeSkillLevel(value: unknown): SkillLevel {
  if (typeof value !== 'string') {
    return 'ALL_LEVELS'
  }
  const normalized = SKILL_LEVEL_MAP[value.trim().toUpperCase()]
  return normalized ?? 'ALL_LEVELS'
}

function computeDurationMinutes(startIso: string, endIso: unknown): number {
  if (typeof endIso !== 'string' || !endIso) {
    return 60
  }
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 60
  }
  return Math.max(1, Math.round((end - start) / 60000))
}

function normalizeSession(data: RawSession): Session {
  const scheduledAt =
    typeof data.startTime === 'string' && data.startTime
      ? data.startTime
      : typeof data.scheduledAt === 'string' && data.scheduledAt
      ? data.scheduledAt
      : new Date(0).toISOString()

  return {
    id: toFiniteNumber(data.id, 0),
    title: typeof data.title === 'string' ? data.title : '',
    sessionType: normalizeSessionType(data.sessionType ?? data.type),
    description: typeof data.description === 'string' ? data.description : undefined,
    coachId: toFiniteNumber(data.coachId, 0),
    coachName: typeof data.coachName === 'string' ? data.coachName : undefined,
    coach: data.coach,
    scheduledAt,
    durationMinutes: toFiniteNumber(
      data.durationMinutes ?? computeDurationMinutes(scheduledAt, data.endTime),
      60
    ),
    maxParticipants: toFiniteNumber(data.maxParticipants ?? data.capacity, 0),
    currentParticipants: toFiniteNumber(data.currentParticipants, 0),
    availableSpots: toFiniteNumber(data.availableSpots, 0),
    priceInCents: toFiniteNumber(data.priceInCents ?? data.priceCents, 0),
    status: typeof data.status === 'string' ? data.status : undefined,
    location: typeof data.location === 'string' ? data.location : undefined,
    ageGroup: typeof data.ageGroup === 'string' ? data.ageGroup : undefined,
    skillLevel: normalizeSkillLevel(data.skillLevel),
    imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : undefined,
    minAge:
      data.minAge === null || data.minAge === undefined ? undefined : toFiniteNumber(data.minAge, 0),
    maxAge:
      data.maxAge === null || data.maxAge === undefined ? undefined : toFiniteNumber(data.maxAge, 0),
    featured: data.featured === true,
    waitlistEnabled: data.waitlistEnabled === true,
    published: data.published !== false,
    createdAt:
      typeof data.createdAt === 'string' && data.createdAt ? data.createdAt : scheduledAt,
  }
}

function normalizeBooking(data: RawBooking): Booking {
  const sessionId = toFiniteNumber(data.sessionId, 0)
  const sessionTitle =
    typeof data.sessionTitle === 'string' && data.sessionTitle ? data.sessionTitle : undefined
  const sessionStartTime =
    typeof data.sessionStartTime === 'string' && data.sessionStartTime
      ? data.sessionStartTime
      : undefined
  const sessionPriceInCents = toFiniteNumber(data.sessionPriceCents, 0)
  const playerAge =
    data.playerAge === null || data.playerAge === undefined
      ? undefined
      : toFiniteNumber(data.playerAge, 0)
  const notes =
    typeof data.playerNotes === 'string'
      ? data.playerNotes
      : typeof data.notes === 'string'
      ? data.notes
      : undefined

  return {
    id: toFiniteNumber(data.id, 0),
    sessionId,
    session:
      sessionId > 0 && sessionTitle && sessionStartTime
        ? {
            id: sessionId,
            title: sessionTitle,
            sessionType: normalizeSessionType(data.sessionType),
            scheduledAt: sessionStartTime,
            durationMinutes: 0,
            maxParticipants: 0,
            currentParticipants: 0,
            priceInCents: sessionPriceInCents,
            coachId: 0,
            createdAt: sessionStartTime,
          }
        : undefined,
    sessionTitle,
    sessionType: normalizeSessionType(data.sessionType),
    sessionStartTime,
    sessionPriceInCents,
    userId:
      data.userId === null || data.userId === undefined
        ? undefined
        : toFiniteNumber(data.userId, 0),
    userName: typeof data.userName === 'string' ? data.userName : undefined,
    userEmail: typeof data.userEmail === 'string' ? data.userEmail : undefined,
    user: data.user,
    playerName: typeof data.playerName === 'string' ? data.playerName : '',
    playerNickname: typeof data.playerNickname === 'string' ? data.playerNickname : undefined,
    playerAge,
    status: typeof data.status === 'string' ? data.status : 'PENDING',
    notes,
    paymentStatus: typeof data.paymentStatus === 'string' ? data.paymentStatus : undefined,
    clientSecret: typeof data.clientSecret === 'string' ? data.clientSecret : undefined,
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : undefined,
  }
}

function normalizeWaitlistEntry(data: RawWaitlistEntry): WaitlistEntry {
  return {
    id: toFiniteNumber(data.id, 0),
    sessionId: toFiniteNumber(data.sessionId, 0),
    userId:
      data.userId === null || data.userId === undefined ? undefined : toFiniteNumber(data.userId, 0),
    userName: typeof data.userName === 'string' ? data.userName : undefined,
    userEmail: typeof data.userEmail === 'string' ? data.userEmail : undefined,
    playerName: typeof data.playerName === 'string' ? data.playerName : '',
    playerNickname: typeof data.playerNickname === 'string' ? data.playerNickname : undefined,
    playerAge:
      data.playerAge === null || data.playerAge === undefined ? undefined : toFiniteNumber(data.playerAge, 0),
    notes: typeof data.notes === 'string' ? data.notes : undefined,
    status: typeof data.status === 'string' ? data.status : 'ACTIVE',
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : undefined,
  }
}

function normalizeTournamentRegistration(data: RawTournamentRegistration): TournamentRegistration {
  const normalizedAgeGroup = normalizeAgeGroups(data.ageGroup)[0]

  return {
    id: toFiniteNumber(data.id, 0),
    tournamentId: toFiniteNumber(data.tournamentId, 0),
    tournamentName:
      typeof data.tournamentName === 'string' && data.tournamentName
        ? data.tournamentName
        : undefined,
    teamName: typeof data.teamName === 'string' ? data.teamName : '',
    coachName: typeof data.coachName === 'string' ? data.coachName : undefined,
    contactEmail: typeof data.contactEmail === 'string' ? data.contactEmail : undefined,
    ageGroup: normalizedAgeGroup,
    status: typeof data.status === 'string' ? data.status : 'PENDING',
    paymentStatus: typeof data.paymentStatus === 'string' ? data.paymentStatus : undefined,
    clientSecret: typeof data.clientSecret === 'string' ? data.clientSecret : undefined,
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : undefined,
  }
}

function normalizeSiteContentBlock(data: RawSiteContentBlock): SiteContentBlock {
  const metadataJson =
    typeof data.metadataJson === 'string' && data.metadataJson.trim() ? data.metadataJson : '{}'
  return {
    key: typeof data.key === 'string' ? data.key : '',
    title: typeof data.title === 'string' ? data.title : undefined,
    subtitle: typeof data.subtitle === 'string' ? data.subtitle : undefined,
    body: typeof data.body === 'string' ? data.body : undefined,
    ctaLabel: typeof data.ctaLabel === 'string' ? data.ctaLabel : undefined,
    ctaUrl: typeof data.ctaUrl === 'string' ? data.ctaUrl : undefined,
    metadataJson,
    metadata: parseJsonObject(metadataJson),
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : undefined,
  }
}

function normalizeMediaAsset(data: RawMediaAsset): MediaAsset {
  return {
    id: toFiniteNumber(data.id, 0),
    sectionKey: typeof data.sectionKey === 'string' ? data.sectionKey : '',
    mediaType: (typeof data.mediaType === 'string' ? data.mediaType.toUpperCase() : 'PHOTO') as
      | 'PHOTO'
      | 'VIDEO',
    title: typeof data.title === 'string' ? data.title : undefined,
    description: typeof data.description === 'string' ? data.description : undefined,
    url: typeof data.url === 'string' ? data.url : '',
    thumbnailUrl: typeof data.thumbnailUrl === 'string' ? data.thumbnailUrl : undefined,
    displayOrder: toFiniteNumber(data.displayOrder, 0),
    active: data.active !== false,
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : undefined,
  }
}

function normalizeLocalDateTime(value: string): string {
  return value.length === 16 ? `${value}:00` : value
}

function formatLocalDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  const seconds = pad(date.getSeconds())
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

function toSessionRequestPayload(
  payload: SessionFormData | SessionUpdateData,
  mode: 'create' | 'update'
): Record<string, unknown> {
  const requestPayload: Record<string, unknown> = {}

  if (payload.coachId !== undefined) {
    requestPayload.coachId = payload.coachId
  }
  if (payload.sessionType !== undefined) {
    requestPayload.type = payload.sessionType
  }
  if (payload.title !== undefined) {
    requestPayload.title = payload.title
  }
  if (payload.description !== undefined) {
    requestPayload.description = payload.description
  }
  if (payload.location !== undefined) {
    requestPayload.location = payload.location
  }
  if (payload.ageGroup !== undefined) {
    requestPayload.ageGroup = payload.ageGroup
  }
  if (payload.skillLevel !== undefined) {
    requestPayload.skillLevel = payload.skillLevel
  }
  if (payload.imageUrl !== undefined) {
    requestPayload.imageUrl = payload.imageUrl
  }
  if (payload.maxParticipants !== undefined) {
    requestPayload.capacity = payload.maxParticipants
  }
  if (payload.priceInCents !== undefined) {
    requestPayload.priceCents = payload.priceInCents
  }
  if (payload.minAge !== undefined) {
    requestPayload.minAge = payload.minAge
  }
  if (payload.maxAge !== undefined) {
    requestPayload.maxAge = payload.maxAge
  }
  if (payload.featured !== undefined) {
    requestPayload.featured = payload.featured
  }
  if (payload.waitlistEnabled !== undefined) {
    requestPayload.waitlistEnabled = payload.waitlistEnabled
  }
  if (payload.published !== undefined) {
    requestPayload.published = payload.published
  }
  if ('repeatWeeklyCount' in payload && payload.repeatWeeklyCount !== undefined) {
    requestPayload.repeatWeeklyCount = payload.repeatWeeklyCount
  }
  if ('status' in payload && payload.status !== undefined) {
    requestPayload.status = payload.status
  } else if (mode === 'create') {
    requestPayload.status = 'ACTIVE'
  }

  if (payload.scheduledAt !== undefined) {
    const startTime = normalizeLocalDateTime(payload.scheduledAt)
    requestPayload.startTime = startTime

    if (payload.durationMinutes !== undefined) {
      const start = new Date(startTime)
      if (Number.isFinite(start.getTime())) {
        const end = new Date(start.getTime() + payload.durationMinutes * 60000)
        requestPayload.endTime = formatLocalDateTime(end)
      }
    } else if (mode === 'create') {
      requestPayload.endTime = startTime
    }
  }

  return requestPayload
}

function toTournamentRequestPayload(
  payload: TournamentFormData | TournamentUpdateData,
  mode: 'create' | 'update'
): Record<string, unknown> {
  const requestPayload: Record<string, unknown> = {}

  if (payload.name !== undefined) {
    requestPayload.name = payload.name
  }
  if (payload.location !== undefined) {
    requestPayload.location = payload.location
  }
  if (payload.startDate !== undefined) {
    requestPayload.startDate = payload.startDate
  }
  if (payload.endDate !== undefined) {
    requestPayload.endDate = payload.endDate
  }
  if (payload.entryFeeInCents !== undefined) {
    requestPayload.registrationFeeCents = payload.entryFeeInCents
  }
  if (payload.ageGroups !== undefined) {
    requestPayload.ageGroups = payload.ageGroups.join(',')
  }
  if (payload.maxTeams !== undefined) {
    requestPayload.maxTeams = payload.maxTeams
  }

  if (payload.status !== undefined) {
    requestPayload.status = normalizeAdminTournamentStatus(payload.status)
  } else if (mode === 'create') {
    requestPayload.status = 'UPCOMING'
  }

  return requestPayload
}

function normalizeTournament(data: RawTournament): Tournament {
  const startDate = typeof data.startDate === 'string' ? data.startDate : ''
  const endDate = typeof data.endDate === 'string' ? data.endDate : startDate
  const createdAt =
    typeof data.createdAt === 'string' && data.createdAt
      ? data.createdAt
      : startDate || new Date(0).toISOString()

  return {
    id: toFiniteNumber(data.id, 0),
    name: typeof data.name === 'string' ? data.name : '',
    description: typeof data.description === 'string' ? data.description : undefined,
    location: typeof data.location === 'string' ? data.location : 'TBD',
    startDate,
    endDate,
    ageGroups: normalizeAgeGroups(data.ageGroups),
    maxTeams: toFiniteNumber(data.maxTeams, 0),
    registeredTeams: toFiniteNumber(data.registeredTeams, 0),
    entryFeeInCents: toFiniteNumber(data.entryFeeInCents ?? data.registrationFeeCents, 0),
    status: normalizeTournamentStatus(data.status),
    createdAt,
  }
}

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
  const { data } = await apiClient.get<RawSession[]>('/api/sessions')
  if (!Array.isArray(data)) {
    return []
  }
  return data.map(normalizeSession)
}

export async function getSessionCatalog(
  filters: SessionCatalogFilters = {}
): Promise<SessionCatalogResult> {
  const params: Record<string, string> = {}

  if (filters.type?.trim()) params.type = filters.type.trim()
  if (filters.ageGroup?.trim()) params.ageGroup = filters.ageGroup.trim()
  if (filters.skillLevel?.trim()) params.skillLevel = filters.skillLevel.trim()
  if (filters.location?.trim()) params.location = filters.location.trim()
  if (filters.minDurationMinutes !== undefined) params.minDurationMinutes = String(filters.minDurationMinutes)
  if (filters.maxDurationMinutes !== undefined) params.maxDurationMinutes = String(filters.maxDurationMinutes)
  if (filters.minPriceCents !== undefined) params.minPriceCents = String(filters.minPriceCents)
  if (filters.maxPriceCents !== undefined) params.maxPriceCents = String(filters.maxPriceCents)
  if (filters.dateFrom?.trim()) params.dateFrom = filters.dateFrom.trim()
  if (filters.dateTo?.trim()) params.dateTo = filters.dateTo.trim()
  if (filters.onlyOpenSpots !== undefined) params.onlyOpenSpots = String(filters.onlyOpenSpots)
  if (filters.page !== undefined) params.page = String(filters.page)
  if (filters.size !== undefined) params.size = String(filters.size)
  if (filters.sort) params.sort = filters.sort

  const response = await apiClient.get<RawSession[]>('/api/sessions', { params })
  const rawItems = Array.isArray(response.data) ? response.data : []
  const items = rawItems.map(normalizeSession)
  const totalHeader = Number(response.headers['x-total-count'] ?? response.headers['X-Total-Count'])
  const page = filters.page ?? 0
  const size = filters.size ?? items.length
  const total = Number.isFinite(totalHeader) ? totalHeader : items.length
  return { items, page, size, total }
}

export async function getFeaturedSession(): Promise<Session | null> {
  try {
    const { data } = await apiClient.get<RawSession>('/api/sessions/featured')
    return normalizeSession(data)
  } catch {
    return null
  }
}

export async function createAdminSession(payload: SessionFormData): Promise<Session> {
  const requestPayload = toSessionRequestPayload(payload, 'create')
  const { data } = await apiClient.post<RawSession>('/api/admin/sessions', requestPayload)
  return normalizeSession(data)
}

export async function getAdminSessions(filters?: { status?: string }): Promise<Session[]> {
  const status = filters?.status?.trim()
  const params: Record<string, string> = {}
  if (status) {
    params.status = status
  }

  const { data } = await apiClient.get<RawSession[]>('/api/admin/sessions', { params })
  if (!Array.isArray(data)) {
    return []
  }
  return data.map(normalizeSession)
}

export async function updateAdminSession(
  sessionId: number,
  payload: SessionUpdateData
): Promise<Session> {
  const requestPayload = toSessionRequestPayload(payload, 'update')
  const { data } = await apiClient.patch<RawSession>(`/api/admin/sessions/${sessionId}`, requestPayload)
  return normalizeSession(data)
}

export async function deleteAdminSession(sessionId: number): Promise<void> {
  await apiClient.delete(`/api/admin/sessions/${sessionId}`)
}

// Bookings
export async function createBooking(
  sessionId: number,
  payload: BookingFormData
): Promise<Booking> {
  const { data } = await apiClient.post<RawBooking>(`/api/sessions/${sessionId}/bookings`, payload)
  return normalizeBooking(data)
}

export async function joinSessionWaitlist(
  sessionId: number,
  payload: CreateWaitlistEntryData
): Promise<WaitlistEntry> {
  const { data } = await apiClient.post<RawWaitlistEntry>(`/api/sessions/${sessionId}/waitlist`, payload)
  return normalizeWaitlistEntry(data)
}

export async function getMyBookings(): Promise<Booking[]> {
  const { data } = await apiClient.get<RawBooking[]>('/api/bookings/my')
  if (!Array.isArray(data)) {
    return []
  }
  return data.map(normalizeBooking)
}

export async function getAdminBookings(filters?: {
  status?: string
  paymentStatus?: string
}): Promise<Booking[]> {
  const status = filters?.status?.trim()
  const paymentStatus = filters?.paymentStatus?.trim()
  const params: Record<string, string> = {}

  if (status) {
    params.status = status
  }
  if (paymentStatus) {
    params.paymentStatus = paymentStatus
  }

  const { data } = await apiClient.get<RawBooking[]>('/api/bookings', { params })
  if (!Array.isArray(data)) {
    return []
  }
  return data.map(normalizeBooking)
}

export async function updateAdminBooking(
  bookingId: number,
  payload: BookingUpdateData
): Promise<Booking> {
  const { data } = await apiClient.patch<RawBooking>(`/api/bookings/${bookingId}`, payload)
  return normalizeBooking(data)
}

export async function deleteAdminBooking(bookingId: number): Promise<void> {
  await apiClient.delete(`/api/bookings/${bookingId}`)
}

// Tournaments
export async function getTournaments(): Promise<Tournament[]> {
  const { data } = await apiClient.get<RawTournament[]>('/api/tournaments')
  if (!Array.isArray(data)) {
    return []
  }
  return data.map(normalizeTournament)
}

export async function getTournament(id: number): Promise<Tournament> {
  const { data } = await apiClient.get<RawTournament>(`/api/tournaments/${id}`)
  return normalizeTournament(data)
}

export async function getAdminTournaments(filters?: { status?: string }): Promise<Tournament[]> {
  const status = filters?.status?.trim()
  const params: Record<string, string> = {}
  if (status) {
    params.status = status
  }

  const { data } = await apiClient.get<RawTournament[]>('/api/admin/tournaments', { params })
  if (!Array.isArray(data)) {
    return []
  }
  return data.map(normalizeTournament)
}

export async function createAdminTournament(payload: TournamentFormData): Promise<Tournament> {
  const requestPayload = toTournamentRequestPayload(payload, 'create')
  const { data } = await apiClient.post<RawTournament>('/api/admin/tournaments', requestPayload)
  return normalizeTournament(data)
}

export async function updateAdminTournament(
  tournamentId: number,
  payload: TournamentUpdateData
): Promise<Tournament> {
  const requestPayload = toTournamentRequestPayload(payload, 'update')
  const { data } = await apiClient.patch<RawTournament>(
    `/api/admin/tournaments/${tournamentId}`,
    requestPayload
  )
  return normalizeTournament(data)
}

export async function deleteAdminTournament(tournamentId: number): Promise<void> {
  await apiClient.delete(`/api/admin/tournaments/${tournamentId}`)
}

export async function registerForTournament(
  tournamentId: number,
  payload: TournamentRegistrationFormData
): Promise<TournamentRegistration> {
  const { data } = await apiClient.post<RawTournamentRegistration>(
    `/api/tournaments/${tournamentId}/register`,
    payload
  )
  return normalizeTournamentRegistration(data)
}

export async function getAdminRegistrations(filters?: {
  status?: string
  paymentStatus?: string
}): Promise<TournamentRegistration[]> {
  const status = filters?.status?.trim()
  const paymentStatus = filters?.paymentStatus?.trim()

  const params: Record<string, string> = {}
  if (status) {
    params.status = status
  }
  if (paymentStatus) {
    params.paymentStatus = paymentStatus
  }

  const { data } = await apiClient.get<RawTournamentRegistration[]>('/api/admin/registrations', {
    params,
  })
  if (!Array.isArray(data)) {
    return []
  }
  return data.map(normalizeTournamentRegistration)
}

export async function updateAdminRegistration(
  registrationId: number,
  payload: TournamentRegistrationUpdateData
): Promise<TournamentRegistration> {
  const { data } = await apiClient.patch<RawTournamentRegistration>(
    `/api/admin/registrations/${registrationId}`,
    payload
  )
  return normalizeTournamentRegistration(data)
}

export async function deleteAdminRegistration(registrationId: number): Promise<void> {
  await apiClient.delete(`/api/admin/registrations/${registrationId}`)
}

// Site content + media
export async function getPublicSiteContentBlocks(): Promise<SiteContentBlock[]> {
  const { data } = await apiClient.get<RawSiteContentBlock[]>('/api/content/blocks')
  if (!Array.isArray(data)) {
    return []
  }
  return data.map(normalizeSiteContentBlock)
}

export async function getPublicMediaAssets(sectionKey?: string): Promise<MediaAsset[]> {
  const params: Record<string, string> = {}
  if (sectionKey?.trim()) {
    params.sectionKey = sectionKey.trim()
  }
  const { data } = await apiClient.get<RawMediaAsset[]>('/api/content/media', { params })
  if (!Array.isArray(data)) {
    return []
  }
  return data.map(normalizeMediaAsset)
}

export async function getAdminSiteContentBlocks(): Promise<SiteContentBlock[]> {
  const { data } = await apiClient.get<RawSiteContentBlock[]>('/api/admin/content/blocks')
  if (!Array.isArray(data)) {
    return []
  }
  return data.map(normalizeSiteContentBlock)
}

export async function upsertAdminSiteContentBlock(
  key: string,
  payload: SiteContentBlockUpsertData
): Promise<SiteContentBlock> {
  const { data } = await apiClient.put<RawSiteContentBlock>(`/api/admin/content/blocks/${key}`, payload)
  return normalizeSiteContentBlock(data)
}

export async function deleteAdminSiteContentBlock(key: string): Promise<void> {
  await apiClient.delete(`/api/admin/content/blocks/${key}`)
}

export async function getAdminMediaAssets(filters?: {
  sectionKey?: string
  includeInactive?: boolean
}): Promise<MediaAsset[]> {
  const params: Record<string, string> = {}
  if (filters?.sectionKey?.trim()) {
    params.sectionKey = filters.sectionKey.trim()
  }
  if (filters?.includeInactive !== undefined) {
    params.includeInactive = String(filters.includeInactive)
  }

  const { data } = await apiClient.get<RawMediaAsset[]>('/api/admin/content/media', { params })
  if (!Array.isArray(data)) {
    return []
  }
  return data.map(normalizeMediaAsset)
}

export async function createAdminMediaAsset(payload: CreateMediaAssetData): Promise<MediaAsset> {
  const { data } = await apiClient.post<RawMediaAsset>('/api/admin/content/media', payload)
  return normalizeMediaAsset(data)
}

export async function updateAdminMediaAsset(
  mediaId: number,
  payload: UpdateMediaAssetData
): Promise<MediaAsset> {
  const { data } = await apiClient.patch<RawMediaAsset>(`/api/admin/content/media/${mediaId}`, payload)
  return normalizeMediaAsset(data)
}

export async function deleteAdminMediaAsset(mediaId: number): Promise<void> {
  await apiClient.delete(`/api/admin/content/media/${mediaId}`)
}
