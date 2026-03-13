"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Filter,
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
  Target,
  UserRound,
  Users2,
  X,
  Zap,
} from "lucide-react";
import BookingFlow from "@/components/BookingFlow";
import RevealSection from "@/components/RevealSection";
import { getFeaturedSession, getSessionCatalog } from "@/lib/api";
import { useSiteContentBlock } from "@/lib/siteContent";
import type {
  Session,
  SessionCatalogFilters,
  SessionType,
  SkillLevel,
} from "@/lib/types";

type TypeFilter = "ALL" | SessionType;
type ViewMode = "grid" | "calendar";
type SortKey = NonNullable<SessionCatalogFilters["sort"]>;

type ProgramCategory = {
  type: SessionType;
  title: string;
  description: string;
  startingPrice: string;
  icon: string;
  badge: string | undefined;
  detailsPath: string;
};

type ProgramCategoryMeta = { items: ProgramCategory[] };

const PAGE_SIZE = 12;
const MIN_PRICE = 0;
const DEFAULT_MAX_PRICE = 250;
const AGE_GROUPS = ["U8", "U10", "U12", "U14", "U16", "U18"];
const SKILL_LEVELS: SkillLevel[] = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "ALL_LEVELS",
];
const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: "Soonest first", value: "date" },
  { label: "Price: low to high", value: "priceAsc" },
  { label: "Price: high to low", value: "priceDesc" },
  { label: "Most open spots", value: "spots" },
];
const CATEGORY_FALLBACK: ProgramCategory[] = [
  {
    type: "PRIVATE",
    title: "Private Training",
    description:
      "One-on-one coaching tailored to athlete goals and confidence building.",
    startingPrice: "$80/session",
    icon: "target",
    badge: "High Impact",
    detailsPath: "/programs/private",
  },
  {
    type: "GROUP",
    title: "Group Sessions",
    description: "Technical and tactical development in high-energy pods.",
    startingPrice: "$35/session",
    icon: "users",
    badge: "Most Popular",
    detailsPath: "/programs/group",
  },
  {
    type: "SPEED",
    title: "Speed & Agility",
    description: "Explosive acceleration and movement mechanics training.",
    startingPrice: "$45/session",
    icon: "zap",
    badge: undefined,
    detailsPath: "/programs/speed",
  },
];

function parseIntParam(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function parseType(value: string | null): TypeFilter {
  if (!value) return "ALL";
  const normalized = value.trim().toUpperCase();
  if (
    normalized === "PRIVATE" ||
    normalized === "GROUP" ||
    normalized === "SPEED"
  )
    return normalized;
  return "ALL";
}

function encodeType(value: TypeFilter): string | null {
  return value === "ALL" ? null : value.toLowerCase();
}

function parseSort(value: string | null): SortKey {
  if (value === "priceAsc" || value === "priceDesc" || value === "spots")
    return value;
  return "date";
}

function parseView(value: string | null): ViewMode {
  return value?.toLowerCase() === "calendar" ? "calendar" : "grid";
}

function formatPrice(cents: number): string {
  return `$${Math.round(cents / 100)}`;
}

function formatSkill(level?: string): string {
  if (!level) return "All Levels";
  return level
    .toLowerCase()
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function formatType(type: SessionType): string {
  if (type === "PRIVATE") return "Private";
  if (type === "GROUP") return "Group";
  return "Speed";
}

function typeBadge(type: SessionType): string {
  if (type === "PRIVATE")
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (type === "GROUP") return "bg-blue-100 text-blue-800 border-blue-200";
  return "bg-amber-100 text-amber-800 border-amber-200";
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDay(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "Date TBD";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "Duration TBD";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem === 0 ? `${hours} hr` : `${hours} hr ${rem} min`;
}

function getAvailability(session: Session): {
  available: number;
  capacity: number;
  openPercent: number;
  soldOut: boolean;
  label: string;
  tone: string;
} {
  const capacity = session.maxParticipants ?? 0;
  const current = session.currentParticipants ?? 0;
  const available = session.availableSpots ?? Math.max(0, capacity - current);

  if (capacity <= 0) {
    return {
      available: 0,
      capacity: 0,
      openPercent: 100,
      soldOut: false,
      label: "Open enrollment",
      tone: "bg-emerald-500",
    };
  }

  const openPercent = Math.max(
    0,
    Math.min(100, Math.round((available / capacity) * 100)),
  );
  const soldOut = available <= 0;
  let tone = "bg-emerald-500";
  if (soldOut || openPercent <= 25) tone = "bg-red-500";
  else if (openPercent <= 55) tone = "bg-amber-500";

  return {
    available,
    capacity,
    openPercent,
    soldOut,
    label: soldOut ? "Sold Out" : `${available}/${capacity} spots left`,
    tone,
  };
}

function countdownLabel(scheduledAt: string, nowMs: number): string | null {
  const target = new Date(scheduledAt).getTime();
  if (!Number.isFinite(target)) return null;
  const diff = target - nowMs;
  if (diff <= 0 || diff > 48 * 60 * 60 * 1000) return null;
  const mins = Math.floor(diff / 60000);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const rem = mins % 60;
  if (days > 0)
    return `Starts in ${days} day${days === 1 ? "" : "s"} ${hours} hour${hours === 1 ? "" : "s"}`;
  if (hours > 0)
    return `Starts in ${hours} hour${hours === 1 ? "" : "s"} ${rem} min`;
  return `Starts in ${Math.max(1, rem)} min`;
}

function renderIcon(name: string, active: boolean) {
  const className = `h-5 w-5 ${active ? "text-white" : "text-green-700"}`;
  const normalized = name.trim().toLowerCase();
  if (normalized === "users" || normalized === "group")
    return <Users2 className={className} />;
  if (normalized === "zap" || normalized === "speed")
    return <Zap className={className} />;
  return <Target className={className} />;
}

type FilterControlsProps = {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  ageGroup: string;
  setAgeGroup: (value: string) => void;
  skillLevel: string;
  setSkillLevel: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  locations: string[];
  minDuration: number | null;
  setMinDuration: (value: number | null) => void;
  maxDuration: number | null;
  setMaxDuration: (value: number | null) => void;
  minPrice: number;
  setMinPrice: (value: number) => void;
  maxPrice: number;
  setMaxPrice: (value: number) => void;
  priceCeiling: number;
  onlyOpenSpots: boolean;
  setOnlyOpenSpots: (value: boolean) => void;
  sortBy: SortKey;
  setSortBy: (value: SortKey) => void;
  onChange: () => void;
};

function FilterControls(props: FilterControlsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Search
        </label>
        <div className="relative mt-1.5">
          <Search className="h-4 w-4 text-gray-400 absolute left-3 top-3.5" />
          <input
            value={props.searchTerm}
            onChange={(event) => {
              props.setSearchTerm(event.target.value);
              props.onChange();
            }}
            placeholder="Search session, coach, location..."
            className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Age Group
          </label>
          <select
            value={props.ageGroup}
            onChange={(event) => {
              props.setAgeGroup(event.target.value);
              props.onChange();
            }}
            className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All ages</option>
            {AGE_GROUPS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Skill Level
          </label>
          <select
            value={props.skillLevel}
            onChange={(event) => {
              props.setSkillLevel(event.target.value);
              props.onChange();
            }}
            className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All levels</option>
            {SKILL_LEVELS.map((item) => (
              <option key={item} value={item}>
                {formatSkill(item)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Location
          </label>
          <select
            value={props.location}
            onChange={(event) => {
              props.setLocation(event.target.value);
              props.onChange();
            }}
            className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All locations</option>
            {props.locations.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Min Duration
          </label>
          <select
            value={props.minDuration ?? ""}
            onChange={(event) => {
              props.setMinDuration(parseIntParam(event.target.value));
              props.onChange();
            }}
            className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Any</option>
            {[30, 45, 60, 75, 90, 120].map((item) => (
              <option key={item} value={item}>
                {item} min
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Max Duration
          </label>
          <select
            value={props.maxDuration ?? ""}
            onChange={(event) => {
              props.setMaxDuration(parseIntParam(event.target.value));
              props.onChange();
            }}
            className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Any</option>
            {[30, 45, 60, 75, 90, 120].map((item) => (
              <option key={item} value={item}>
                {item} min
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto,auto] gap-4 items-end">
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500">
            <span>Price Range</span>
            <span>
              ${props.minPrice} - ${props.maxPrice}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            <input
              type="range"
              min={MIN_PRICE}
              max={props.priceCeiling}
              step={5}
              value={Math.min(props.minPrice, props.maxPrice)}
              onChange={(event) => {
                const value = Number(event.target.value);
                props.setMinPrice(Math.min(value, props.maxPrice));
                props.onChange();
              }}
              className="w-full accent-green-700"
            />
            <input
              type="range"
              min={MIN_PRICE}
              max={props.priceCeiling}
              step={5}
              value={Math.max(props.minPrice, props.maxPrice)}
              onChange={(event) => {
                const value = Number(event.target.value);
                props.setMaxPrice(Math.max(value, props.minPrice));
                props.onChange();
              }}
              className="w-full accent-green-700"
            />
          </div>
        </div>

        <label className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={props.onlyOpenSpots}
            onChange={(event) => {
              props.setOnlyOpenSpots(event.target.checked);
              props.onChange();
            }}
            className="rounded border-gray-300 text-green-700 focus:ring-green-500"
          />
          Open spots only
        </label>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Sort
          </label>
          <select
            value={props.sortBy}
            onChange={(event) => {
              props.setSortBy(event.target.value as SortKey);
              props.onChange();
            }}
            className="mt-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default function ProgramsClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sessionsRef = useRef<HTMLElement | null>(null);
  const queryRef = useRef(searchParams.toString());

  const [activeType, setActiveType] = useState<TypeFilter>(() =>
    parseType(searchParams.get("type")),
  );
  const [searchTerm, setSearchTerm] = useState(
    () => searchParams.get("q") ?? "",
  );
  const [ageGroup, setAgeGroup] = useState(() => searchParams.get("age") ?? "");
  const [skillLevel, setSkillLevel] = useState(
    () => searchParams.get("level") ?? "",
  );
  const [location, setLocation] = useState(
    () => searchParams.get("location") ?? "",
  );
  const [minDuration, setMinDuration] = useState<number | null>(() =>
    parseIntParam(searchParams.get("durationMin")),
  );
  const [maxDuration, setMaxDuration] = useState<number | null>(() =>
    parseIntParam(searchParams.get("durationMax")),
  );
  const [minPrice, setMinPrice] = useState(
    () => parseIntParam(searchParams.get("minPrice")) ?? MIN_PRICE,
  );
  const [maxPrice, setMaxPrice] = useState(
    () => parseIntParam(searchParams.get("maxPrice")) ?? DEFAULT_MAX_PRICE,
  );
  const [onlyOpenSpots, setOnlyOpenSpots] = useState(
    () => searchParams.get("open") === "true",
  );
  const [sortBy, setSortBy] = useState<SortKey>(() =>
    parseSort(searchParams.get("sort")),
  );
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    parseView(searchParams.get("view")),
  );
  const [page, setPage] = useState(() =>
    Math.max(0, (parseIntParam(searchParams.get("page")) ?? 1) - 1),
  );
  const [bookIntent, setBookIntent] = useState(
    () => searchParams.get("book") === "true",
  );

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [locations, setLocations] = useState<string[]>([]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const contentBlock = useSiteContentBlock<ProgramCategoryMeta>(
    "programs.category_cards",
    {
      key: "programs.category_cards",
      metadata: { items: CATEGORY_FALLBACK },
    },
  );

  const categoryItems = useMemo(() => {
    const raw = contentBlock.metadata.items;
    if (!Array.isArray(raw)) return CATEGORY_FALLBACK;
    const parsed = raw
      .map((item) => {
        const type = parseType(
          typeof item.type === "string" ? item.type : null,
        );
        if (type === "ALL") return null;
        return {
          type,
          title:
            typeof item.title === "string" && item.title.trim()
              ? item.title.trim()
              : formatType(type),
          description:
            typeof item.description === "string" && item.description.trim()
              ? item.description.trim()
              : "Elite player development training.",
          startingPrice:
            typeof item.startingPrice === "string" && item.startingPrice.trim()
              ? item.startingPrice.trim()
              : "$35/session",
          icon:
            typeof item.icon === "string" && item.icon.trim()
              ? item.icon.trim()
              : "target",
          badge:
            typeof item.badge === "string" && item.badge.trim()
              ? item.badge.trim()
              : undefined,
          detailsPath:
            typeof item.detailsPath === "string" && item.detailsPath.trim()
              ? item.detailsPath.trim()
              : `/programs/${type.toLowerCase()}`,
        } satisfies ProgramCategory;
      })
      .filter((item): item is ProgramCategory => item !== null);

    return parsed.length > 0 ? parsed : CATEGORY_FALLBACK;
  }, [contentBlock.metadata.items]);

  const hasSearch = searchTerm.trim().length > 0;

  const serverFilters = useMemo<SessionCatalogFilters>(() => {
    const filters: SessionCatalogFilters = {
      sort: sortBy,
      onlyOpenSpots,
      page: hasSearch ? 0 : page,
      size: hasSearch ? 100 : PAGE_SIZE,
    };
    if (activeType !== "ALL") filters.type = activeType;
    if (ageGroup) filters.ageGroup = ageGroup;
    if (skillLevel) filters.skillLevel = skillLevel;
    if (location) filters.location = location;
    if (minDuration != null) filters.minDurationMinutes = minDuration;
    if (maxDuration != null) filters.maxDurationMinutes = maxDuration;
    if (minPrice > MIN_PRICE) filters.minPriceCents = minPrice * 100;
    if (maxPrice > MIN_PRICE) filters.maxPriceCents = maxPrice * 100;
    return filters;
  }, [
    activeType,
    ageGroup,
    hasSearch,
    location,
    maxDuration,
    maxPrice,
    minDuration,
    minPrice,
    onlyOpenSpots,
    page,
    skillLevel,
    sortBy,
  ]);

  const sessionsQuery = useQuery({
    queryKey: ["session-catalog", serverFilters],
    queryFn: () => getSessionCatalog(serverFilters),
    placeholderData: (previous) => previous,
  });

  const featuredQuery = useQuery({
    queryKey: ["featured-session"],
    queryFn: getFeaturedSession,
    staleTime: 60_000,
  });

  useEffect(() => {
    const incoming = sessionsQuery.data?.items ?? [];
    if (incoming.length === 0 && !featuredQuery.data?.location) return;

    setLocations((current) => {
      const next = new Set(current);
      for (const session of incoming) {
        if (session.location?.trim()) next.add(session.location.trim());
      }
      if (featuredQuery.data?.location?.trim())
        next.add(featuredQuery.data.location.trim());
      const sorted = Array.from(next).sort((a, b) => a.localeCompare(b));
      if (
        sorted.length === current.length &&
        sorted.every((item, idx) => item === current[idx])
      ) {
        return current;
      }
      return sorted;
    });
  }, [featuredQuery.data, sessionsQuery.data?.items]);
  const observedMaxPrice = useMemo(() => {
    const sessions = sessionsQuery.data?.items ?? [];
    let maxCents = featuredQuery.data?.priceInCents ?? 0;
    for (const session of sessions) {
      if ((session.priceInCents ?? 0) > maxCents)
        maxCents = session.priceInCents;
    }
    if (maxCents <= 0) return DEFAULT_MAX_PRICE;
    return Math.max(50, Math.ceil(maxCents / 500) * 5);
  }, [featuredQuery.data?.priceInCents, sessionsQuery.data?.items]);

  useEffect(() => {
    setMaxPrice((current) =>
      Math.min(Math.max(current, minPrice), observedMaxPrice),
    );
  }, [minPrice, observedMaxPrice]);

  useEffect(() => {
    const params = new URLSearchParams();
    const typeParam = encodeType(activeType);
    if (typeParam) params.set("type", typeParam);
    if (searchTerm.trim()) params.set("q", searchTerm.trim());
    if (ageGroup) params.set("age", ageGroup);
    if (skillLevel) params.set("level", skillLevel);
    if (location) params.set("location", location);
    if (minDuration != null) params.set("durationMin", String(minDuration));
    if (maxDuration != null) params.set("durationMax", String(maxDuration));
    if (minPrice > MIN_PRICE) params.set("minPrice", String(minPrice));
    if (maxPrice !== DEFAULT_MAX_PRICE)
      params.set("maxPrice", String(maxPrice));
    if (onlyOpenSpots) params.set("open", "true");
    if (sortBy !== "date") params.set("sort", sortBy);
    if (viewMode !== "grid") params.set("view", viewMode);
    if (page > 0) params.set("page", String(page + 1));
    if (bookIntent) params.set("book", "true");

    const next = params.toString();
    if (next === queryRef.current) return;
    queryRef.current = next;
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [
    activeType,
    ageGroup,
    bookIntent,
    location,
    maxDuration,
    maxPrice,
    minDuration,
    minPrice,
    onlyOpenSpots,
    page,
    pathname,
    router,
    searchTerm,
    skillLevel,
    sortBy,
    viewMode,
  ]);

  const baseSessions = useMemo(
    () => sessionsQuery.data?.items ?? [],
    [sessionsQuery.data?.items],
  );
  const searchedSessions = useMemo(() => {
    if (!hasSearch) return baseSessions;
    const query = searchTerm.trim().toLowerCase();
    return baseSessions.filter((session) => {
      const haystack = [
        session.title,
        session.description ?? "",
        session.location ?? "",
        session.coachName ?? "",
        session.ageGroup ?? "",
        session.skillLevel ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [baseSessions, hasSearch, searchTerm]);

  const renderedSessions = useMemo(() => {
    if (!hasSearch) return searchedSessions;
    const start = page * PAGE_SIZE;
    return searchedSessions.slice(start, start + PAGE_SIZE);
  }, [hasSearch, page, searchedSessions]);

  const totalResults = hasSearch
    ? searchedSessions.length
    : (sessionsQuery.data?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));

  useEffect(() => {
    const maxPage = Math.max(0, totalPages - 1);
    if (page > maxPage) setPage(maxPage);
  }, [page, totalPages]);

  useEffect(() => {
    if (!bookIntent || selectedSession || renderedSessions.length === 0) return;
    setSelectedSession(renderedSessions[0]);
    setBookIntent(false);
  }, [bookIntent, renderedSessions, selectedSession]);

  const groupedCalendar = useMemo(() => {
    const map = new Map<string, Session[]>();
    for (const session of renderedSessions) {
      const date = new Date(session.scheduledAt);
      const key = Number.isNaN(date.getTime())
        ? "Date TBD"
        : date.toISOString().slice(0, 10);
      map.set(key, [...(map.get(key) ?? []), session]);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, sessions]) => ({
        key,
        label: key === "Date TBD" ? key : formatDay(key),
        sessions: sessions.sort((a, b) =>
          a.scheduledAt.localeCompare(b.scheduledAt),
        ),
      }));
  }, [renderedSessions]);

  const featuredSession = useMemo(() => {
    if (!featuredQuery.data) return null;
    if (activeType !== "ALL" && featuredQuery.data.sessionType !== activeType)
      return null;
    return featuredQuery.data;
  }, [activeType, featuredQuery.data]);

  const onFilterChange = () => setPage(0);
  const resetFilters = () => {
    setActiveType("ALL");
    setSearchTerm("");
    setAgeGroup("");
    setSkillLevel("");
    setLocation("");
    setMinDuration(null);
    setMaxDuration(null);
    setMinPrice(MIN_PRICE);
    setMaxPrice(DEFAULT_MAX_PRICE);
    setOnlyOpenSpots(false);
    setSortBy("date");
    setPage(0);
  };

  const isLoading = sessionsQuery.isLoading && !sessionsQuery.data;
  const isErrored = sessionsQuery.isError;

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <RevealSection>
          <section className="rounded-3xl bg-gradient-to-br from-green-900 via-green-800 to-green-700 text-white px-6 py-10 sm:px-10 sm:py-12 pitch-lines">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                <Star className="h-3.5 w-3.5 text-yellow-300" /> Elite Programs
              </div>
              <h1 className="mt-4 text-3xl sm:text-5xl font-extrabold leading-tight">
                Programs Built To Develop Elite Skills And Competitive
                Confidence
              </h1>
              <p className="mt-4 text-green-100 text-base sm:text-lg">
                Filter by age, skill, location, and availability to book the
                right training session in seconds.
              </p>
            </div>
          </section>
        </RevealSection>

        <RevealSection className="mt-8">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categoryItems.map((item) => {
              const active = activeType === item.type;
              return (
                <article
                  key={item.type}
                  className={`elevate-card rounded-2xl border p-5 bg-white ${active ? "border-green-700 shadow-lg ring-2 ring-green-200" : "border-gray-200"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveType(item.type);
                        setPage(0);
                        sessionsRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }}
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold border ${active ? "bg-green-700 border-green-700 text-white" : "bg-green-50 border-green-100 text-green-800 hover:bg-green-100"}`}
                    >
                      {renderIcon(item.icon, active)} {item.title}
                    </button>
                    {item.badge && (
                      <span className="rounded-full bg-yellow-100 text-yellow-800 text-[11px] font-bold px-2.5 py-1 border border-yellow-200">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-3 min-h-12">
                    {item.description}
                  </p>
                  <p className="text-sm font-semibold text-green-700 mt-2">
                    Starting at {item.startingPrice}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveType(item.type);
                        setPage(0);
                        sessionsRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }}
                      className="text-sm font-semibold text-green-700 hover:underline"
                    >
                      Filter sessions
                    </button>
                    <Link
                      href={item.detailsPath}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-green-700"
                    >
                      View Program Details <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        </RevealSection>

        <RevealSection className="mt-8">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                <SlidersHorizontal className="h-4 w-4 text-green-700" /> Filters
                & Sorting
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  View
                </span>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold border ${viewMode === "grid" ? "bg-green-700 text-white border-green-700" : "bg-white text-gray-700 border-gray-200"}`}
                >
                  Grid
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("calendar")}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold border ${viewMode === "calendar" ? "bg-green-700 text-white border-green-700" : "bg-white text-gray-700 border-gray-200"}`}
                >
                  Calendar
                </button>
              </div>
            </div>

            <div className="hidden md:block mt-5">
              <FilterControls
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                ageGroup={ageGroup}
                setAgeGroup={setAgeGroup}
                skillLevel={skillLevel}
                setSkillLevel={setSkillLevel}
                location={location}
                setLocation={setLocation}
                locations={locations}
                minDuration={minDuration}
                setMinDuration={setMinDuration}
                maxDuration={maxDuration}
                setMaxDuration={setMaxDuration}
                minPrice={minPrice}
                setMinPrice={setMinPrice}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                priceCeiling={observedMaxPrice}
                onlyOpenSpots={onlyOpenSpots}
                setOnlyOpenSpots={setOnlyOpenSpots}
                sortBy={sortBy}
                setSortBy={setSortBy}
                onChange={onFilterChange}
              />
            </div>

            <div className="md:hidden mt-4">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700"
              >
                <Filter className="h-4 w-4 text-green-700" /> Open filters
              </button>
            </div>
          </section>
        </RevealSection>

        <section ref={sessionsRef} className="mt-9">
          {featuredSession && (
            <RevealSection className="mb-6">
              <article className="rounded-3xl border-2 border-yellow-300 bg-gradient-to-br from-white via-yellow-50 to-green-50 p-6 sm:p-8 shadow-lg">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-yellow-300 text-green-900 text-xs font-extrabold px-3 py-1">
                    Featured Session
                  </span>
                  <span
                    className={`rounded-full border text-xs font-bold px-2.5 py-1 ${typeBadge(featuredSession.sessionType)}`}
                  >
                    {formatType(featuredSession.sessionType)}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr,250px] gap-6">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                      {featuredSession.title}
                    </h2>
                    {featuredSession.description && (
                      <p className="text-gray-600 mt-2 max-w-3xl">
                        {featuredSession.description}
                      </p>
                    )}
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-gray-700">
                      <div className="rounded-xl bg-white border border-gray-200 px-3 py-2">
                        <div className="text-xs text-gray-500">Date</div>
                        <div className="font-semibold">
                          {formatDateTime(featuredSession.scheduledAt)}
                        </div>
                      </div>
                      <div className="rounded-xl bg-white border border-gray-200 px-3 py-2">
                        <div className="text-xs text-gray-500">Duration</div>
                        <div className="font-semibold">
                          {formatDuration(featuredSession.durationMinutes)}
                        </div>
                      </div>
                      <div className="rounded-xl bg-white border border-gray-200 px-3 py-2">
                        <div className="text-xs text-gray-500">Location</div>
                        <div className="font-semibold">
                          {featuredSession.location ?? "TBD"}
                        </div>
                      </div>
                      <div className="rounded-xl bg-white border border-gray-200 px-3 py-2">
                        <div className="text-xs text-gray-500">Coach</div>
                        <div className="font-semibold">
                          {featuredSession.coachName ?? "Coach Team"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-green-100 bg-white p-4 sm:p-5">
                    <div className="text-sm text-gray-500">From</div>
                    <div className="text-3xl font-extrabold text-green-800">
                      {formatPrice(featuredSession.priceInCents)}
                    </div>
                    <div className="text-xs text-gray-500">per athlete</div>
                    <button
                      type="button"
                      onClick={() => setSelectedSession(featuredSession)}
                      className="lift-button mt-4 w-full rounded-xl bg-yellow-400 text-green-900 font-extrabold px-4 py-3 hover:bg-yellow-300"
                    >
                      Book Featured Session
                    </button>
                  </div>
                </div>
              </article>
            </RevealSection>
          )}

          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-2xl font-extrabold text-gray-900">
              Available Sessions
            </h2>
            <div className="text-sm text-gray-600">
              {totalResults} result{totalResults === 1 ? "" : "s"}
            </div>
          </div>

          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-gray-200 bg-white p-4"
                >
                  <div className="h-36 rounded-xl skeleton-shimmer" />
                  <div className="mt-4 h-4 w-2/3 rounded skeleton-shimmer" />
                  <div className="mt-3 h-3 w-1/2 rounded skeleton-shimmer" />
                  <div className="mt-5 h-9 rounded-xl skeleton-shimmer" />
                </div>
              ))}
            </div>
          )}

          {isErrored && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
              Could not load sessions. Please refresh and try again.
            </div>
          )}

          {!isLoading && !isErrored && renderedSessions.length === 0 && (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                No sessions match your filters
              </h3>
              <p className="text-gray-600 mt-2">
                Try adjusting age group, location, or price range.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="lift-button mt-5 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Reset all filters
              </button>
            </div>
          )}

          {!isLoading && !isErrored && renderedSessions.length > 0 && (
            <div
              className={`transition-opacity duration-300 ${sessionsQuery.isFetching ? "opacity-70" : "opacity-100"}`}
            >
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {renderedSessions.map((session) => {
                    const availability = getAvailability(session);
                    const countdown = countdownLabel(
                      session.scheduledAt,
                      nowMs,
                    );
                    const soldOut = availability.soldOut;
                    return (
                      <article
                        key={session.id}
                        className="elevate-card rounded-2xl border border-gray-200 bg-white overflow-hidden"
                      >
                        <div className="relative h-44 bg-gray-100">
                          {session.imageUrl ? (
                            <Image
                              src={session.imageUrl}
                              alt={session.title}
                              className="h-full w-full object-cover"
                              fill
                              sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-green-100 to-green-200" />
                          )}
                          <div className="absolute left-3 top-3 flex items-center gap-2">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${typeBadge(session.sessionType)}`}
                            >
                              {formatType(session.sessionType)}
                            </span>
                            {soldOut && (
                              <span className="rounded-full border border-red-200 bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-700">
                                Sold Out
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-bold text-gray-900">
                            {session.title}
                          </h3>
                          <div className="mt-2 space-y-1.5 text-sm text-gray-600">
                            <div className="inline-flex items-center gap-2">
                              <CalendarDays className="h-4 w-4 text-green-700" />
                              <span>{formatDateTime(session.scheduledAt)}</span>
                            </div>
                            <div className="inline-flex items-center gap-2">
                              <Clock3 className="h-4 w-4 text-green-700" />
                              <span>
                                {formatDuration(session.durationMinutes)}
                              </span>
                            </div>
                            <div className="inline-flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-green-700" />
                              <span>{session.location ?? "Location TBD"}</span>
                            </div>
                            <div className="inline-flex items-center gap-2">
                              <UserRound className="h-4 w-4 text-green-700" />
                              <span>{session.coachName ?? "Coach Team"}</span>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-gray-100 border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-700">
                              {formatSkill(session.skillLevel)}
                            </span>
                            {session.ageGroup && (
                              <span className="rounded-full bg-gray-100 border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-700">
                                {session.ageGroup}
                              </span>
                            )}
                          </div>
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-xs font-semibold text-gray-600 mb-1.5">
                              <span>{availability.label}</span>
                              <span>{availability.openPercent}% open</span>
                            </div>
                            <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                              <div
                                className={`h-full ${availability.tone}`}
                                style={{
                                  width: `${availability.openPercent}%`,
                                }}
                              />
                            </div>
                          </div>
                          {countdown && (
                            <p className="mt-3 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                              {countdown}
                            </p>
                          )}
                          <div className="mt-4 flex items-end justify-between gap-3">
                            <div>
                              <p className="text-2xl font-extrabold text-gray-900">
                                {formatPrice(session.priceInCents)}
                              </p>
                              <p className="text-xs text-gray-500 -mt-1">
                                per athlete
                              </p>
                            </div>
                            <button
                              type="button"
                              disabled={soldOut && !session.waitlistEnabled}
                              onClick={() => setSelectedSession(session)}
                              className={`lift-button w-36 rounded-xl px-4 py-2.5 text-sm font-extrabold ${soldOut && !session.waitlistEnabled ? "bg-gray-200 text-gray-500 cursor-not-allowed" : soldOut ? "bg-white border border-green-700 text-green-700 hover:bg-green-50" : "bg-green-700 text-white hover:bg-green-800"}`}
                            >
                              {soldOut
                                ? session.waitlistEnabled
                                  ? "Join Waitlist"
                                  : "Sold Out"
                                : "Book Now"}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedCalendar.map((group) => (
                    <article
                      key={group.key}
                      className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
                    >
                      <div className="bg-green-50 border-b border-green-100 px-5 py-3">
                        <h3 className="text-sm sm:text-base font-bold text-green-900">
                          {group.label}
                        </h3>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {group.sessions.map((session) => {
                          const availability = getAvailability(session);
                          const soldOut = availability.soldOut;
                          return (
                            <div
                              key={session.id}
                              className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                            >
                              <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span
                                    className={`rounded-full border text-[11px] font-bold px-2 py-0.5 ${typeBadge(session.sessionType)}`}
                                  >
                                    {formatType(session.sessionType)}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatDateTime(session.scheduledAt)}
                                  </span>
                                </div>
                                <h4 className="font-bold text-gray-900">
                                  {session.title}
                                </h4>
                                <p className="text-sm text-gray-600 mt-0.5">
                                  {formatDuration(session.durationMinutes)} |{" "}
                                  {session.location ?? "Location TBD"} |{" "}
                                  {session.coachName ?? "Coach Team"}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 md:min-w-[290px] md:justify-end">
                                <div className="text-right">
                                  <p className="text-lg font-extrabold text-gray-900">
                                    {formatPrice(session.priceInCents)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {availability.label}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  disabled={soldOut && !session.waitlistEnabled}
                                  onClick={() => setSelectedSession(session)}
                                  className={`lift-button rounded-xl px-4 py-2 text-sm font-extrabold ${soldOut && !session.waitlistEnabled ? "bg-gray-200 text-gray-500 cursor-not-allowed" : soldOut ? "bg-white border border-green-700 text-green-700 hover:bg-green-50" : "bg-green-700 text-white hover:bg-green-800"}`}
                                >
                                  {soldOut
                                    ? session.waitlistEnabled
                                      ? "Join Waitlist"
                                      : "Sold Out"
                                    : "Book Now"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isLoading && !isErrored && totalPages > 1 && (
            <nav className="mt-7 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                disabled={page === 0}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page + 1} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((current) => Math.min(totalPages - 1, current + 1))
                }
                disabled={page >= totalPages - 1}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          )}
        </section>
      </main>

      <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 mobile-safe-bottom">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="lift-button inline-flex items-center gap-2 rounded-full bg-green-700 text-white px-5 py-3 text-sm font-extrabold shadow-xl"
        >
          <Filter className="h-4 w-4" /> Filter Sessions
        </button>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[75] bg-black/40 backdrop-blur-sm md:hidden">
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-gray-900">Filters</h3>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-full border border-gray-200 p-2 text-gray-600"
                aria-label="Close filters"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4">
              <FilterControls
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                ageGroup={ageGroup}
                setAgeGroup={setAgeGroup}
                skillLevel={skillLevel}
                setSkillLevel={setSkillLevel}
                location={location}
                setLocation={setLocation}
                locations={locations}
                minDuration={minDuration}
                setMinDuration={setMinDuration}
                maxDuration={maxDuration}
                setMaxDuration={setMaxDuration}
                minPrice={minPrice}
                setMinPrice={setMinPrice}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                priceCeiling={observedMaxPrice}
                onlyOpenSpots={onlyOpenSpots}
                setOnlyOpenSpots={setOnlyOpenSpots}
                sortBy={sortBy}
                setSortBy={setSortBy}
                onChange={onFilterChange}
              />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-xl bg-green-700 px-4 py-3 text-sm font-extrabold text-white"
              >
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}

      <BookingFlow
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
        onBooked={() => {
          setSelectedSession(null);
          void sessionsQuery.refetch();
          void featuredQuery.refetch();
        }}
      />
    </>
  );
}
