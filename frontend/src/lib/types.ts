// Entity types for Kante Elite Training platform

export type UserRole = "PARENT" | "COACH" | "ADMIN";
export type SessionType = "PRIVATE" | "GROUP" | "SPEED";
export type AgeGroup = "U8" | "U10" | "U12" | "U14" | "U16" | "U18";
export type SkillLevel =
  | "BEGINNER"
  | "INTERMEDIATE"
  | "ADVANCED"
  | "ALL_LEVELS";
export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "FAILED"
  | "EXPIRED";
export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "EXPIRED"
  | "PAID_AFTER_EXPIRY";
export type TournamentStatus = "UPCOMING" | "ONGOING" | "COMPLETED";
export type SessionStatus = "ACTIVE" | "CANCELLED" | "COMPLETED";
export type AdminTournamentStatus = "UPCOMING" | "ACTIVE" | "COMPLETED";
export type MediaType = "PHOTO" | "VIDEO";

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
}

export interface Session {
  id: number;
  title: string;
  sessionType: SessionType;
  description?: string;
  coachId: number;
  coachName?: string;
  coach?: User;
  scheduledAt: string;
  durationMinutes: number;
  maxParticipants: number;
  currentParticipants: number;
  priceInCents: number;
  availableSpots?: number;
  status?: SessionStatus | string;
  location?: string;
  ageGroup?: string;
  skillLevel?: SkillLevel;
  imageUrl?: string;
  minAge?: number;
  maxAge?: number;
  featured?: boolean;
  waitlistEnabled?: boolean;
  published?: boolean;
  createdAt: string;
}

export interface Booking {
  id: number;
  sessionId: number;
  session?: Session;
  sessionTitle?: string;
  sessionType?: SessionType;
  sessionStartTime?: string;
  sessionPriceInCents?: number;
  userId?: number;
  userName?: string;
  userEmail?: string;
  user?: User;
  playerName: string;
  playerNickname?: string;
  playerAge?: number;
  status: BookingStatus | string;
  notes?: string;
  paymentStatus?: string;
  clientSecret?: string;
  createdAt?: string;
}

export interface Tournament {
  id: number;
  name: string;
  description?: string;
  location: string;
  startDate: string;
  endDate: string;
  ageGroups: AgeGroup[];
  maxTeams: number;
  registeredTeams: number;
  entryFeeInCents: number;
  status: TournamentStatus;
  createdAt: string;
}

export interface Team {
  id: number;
  name: string;
  coachName: string;
  contactEmail: string;
  ageGroup: AgeGroup;
}

export interface TournamentRegistration {
  id: number;
  tournamentId: number;
  tournament?: Tournament;
  tournamentName?: string;
  teamName: string;
  coachName?: string;
  contactEmail?: string;
  ageGroup?: AgeGroup | string;
  status: BookingStatus | string;
  paymentStatus?: string;
  clientSecret?: string;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface ApiError {
  message: string;
  statusCode?: number;
}

// Form data types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface BookingFormData {
  playerName: string;
  playerNickname?: string;
  playerAge: number;
  notes?: string;
}

export interface BookingUpdateData {
  status?: BookingStatus | string;
  paymentStatus?: PaymentStatus | string;
}

export interface TournamentRegistrationFormData {
  teamName: string;
  coachName: string;
  contactEmail: string;
  ageGroup: AgeGroup;
}

export interface SessionFormData {
  coachId?: number;
  title: string;
  sessionType: SessionType;
  description?: string;
  scheduledAt: string;
  durationMinutes: number;
  maxParticipants: number;
  priceInCents: number;
  location?: string;
  ageGroup?: string;
  skillLevel?: SkillLevel;
  imageUrl?: string;
  minAge?: number;
  maxAge?: number;
  featured?: boolean;
  waitlistEnabled?: boolean;
  published?: boolean;
  repeatWeeklyCount?: number;
}

export interface SessionUpdateData {
  coachId?: number;
  title?: string;
  sessionType?: SessionType;
  description?: string;
  scheduledAt?: string;
  durationMinutes?: number;
  maxParticipants?: number;
  priceInCents?: number;
  location?: string;
  ageGroup?: string;
  skillLevel?: SkillLevel;
  imageUrl?: string;
  minAge?: number;
  maxAge?: number;
  featured?: boolean;
  waitlistEnabled?: boolean;
  published?: boolean;
  status?: SessionStatus;
}

export interface SessionCatalogFilters {
  type?: string;
  ageGroup?: string;
  skillLevel?: SkillLevel | string;
  location?: string;
  minDurationMinutes?: number;
  maxDurationMinutes?: number;
  minPriceCents?: number;
  maxPriceCents?: number;
  dateFrom?: string;
  dateTo?: string;
  onlyOpenSpots?: boolean;
  page?: number;
  size?: number;
  sort?: "date" | "priceAsc" | "priceDesc" | "spots";
}

export interface SessionCatalogResult {
  items: Session[];
  page: number;
  size: number;
  total: number;
}

export interface WaitlistEntry {
  id: number;
  sessionId: number;
  userId?: number;
  userName?: string;
  userEmail?: string;
  playerName: string;
  playerNickname?: string;
  playerAge?: number;
  notes?: string;
  status: string;
  createdAt?: string;
}

export interface CreateWaitlistEntryData {
  playerName: string;
  playerNickname?: string;
  playerAge?: number;
  notes?: string;
}

export interface TournamentFormData {
  name: string;
  location?: string;
  startDate: string;
  endDate: string;
  ageGroups: AgeGroup[];
  maxTeams: number;
  entryFeeInCents: number;
  status?: AdminTournamentStatus;
}

export interface TournamentUpdateData {
  name?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  ageGroups?: AgeGroup[];
  maxTeams?: number;
  entryFeeInCents?: number;
  status?: AdminTournamentStatus;
}

export interface TournamentRegistrationUpdateData {
  teamName?: string;
  coachName?: string;
  contactEmail?: string;
  ageGroup?: AgeGroup;
  status?: BookingStatus | string;
  paymentStatus?: PaymentStatus | string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface SiteContentBlock {
  key: string;
  title?: string;
  subtitle?: string;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  metadataJson: string;
  metadata: Record<string, unknown>;
  updatedAt?: string;
}

export interface SiteContentBlockUpsertData {
  title?: string;
  subtitle?: string;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  metadataJson?: string;
}

export interface MediaAsset {
  id: number;
  sectionKey: string;
  mediaType: MediaType;
  title?: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  displayOrder: number;
  active: boolean;
  updatedAt?: string;
}

export interface CreateMediaAssetData {
  sectionKey: string;
  mediaType: MediaType;
  title?: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  displayOrder?: number;
  active?: boolean;
}

export interface UpdateMediaAssetData {
  sectionKey?: string;
  mediaType?: MediaType;
  title?: string;
  description?: string;
  url?: string;
  thumbnailUrl?: string;
  displayOrder?: number;
  active?: boolean;
}
