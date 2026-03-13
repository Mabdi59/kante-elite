# Kante Elite Training

Full-stack youth soccer training and tournament management platform built with Next.js, Spring Boot, and PostgreSQL.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, TanStack Query, React Hook Form + Zod |
| Backend | Java 17, Spring Boot 3.2, Maven, Spring Security, JPA, Flyway |
| Database | PostgreSQL 16 |
| Payments | Stripe |
| Auth | JWT (HS256) |

## Local Development

### Prerequisites

- Docker & Docker Compose
- Java 17+
- Node.js 18+
- Maven 3.9+

### 1 - Start the database

```bash
docker-compose up -d
```

### 2 - Configure environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Set the variables in your shell (or use a tool like `direnv`):

```bash
export DB_URL=jdbc:postgresql://localhost:5432/kanteelite
export DB_USERNAME=kanteelite
export DB_PASSWORD=kanteelite
export JWT_SECRET=change-me-to-a-long-random-secret
export STRIPE_SECRET_KEY=sk_test_...
export STRIPE_WEBHOOK_SECRET=whsec_...
export PAYMENT_PENDING_EXPIRATION_MINUTES=30
export PAYMENT_PENDING_CLEANUP_INTERVAL_MS=300000
export CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
export NEXT_PUBLIC_API_URL=http://localhost:8080
export NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3 - Run the backend

```bash
cd backend
mvn spring-boot:run
```

The API starts on **http://localhost:8080**.
Swagger UI: **http://localhost:8080/swagger-ui.html**

### 4 - Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The site opens on **http://localhost:3000**.

---

## Seed Data

Flyway `V2__seed.sql` inserts:

| Role | Email | Password |
|------|-------|----------|
| ADMIN | admin@kanteelite.com | Admin1234! |
| COACH | coach@kanteelite.com | Coach1234! |

Plus 3 sample training sessions and 1 sample tournament.

---

## Project Structure

```
kante-elite/
|-- backend/          # Spring Boot API
|   `-- src/
|       |-- main/java/com/kanteelite/backend/
|       |   |-- config/       # Security, CORS, Stripe, OpenAPI
|       |   |-- controller/   # REST controllers
|       |   |-- dto/          # Request & response DTOs
|       |   |-- entity/       # JPA entities
|       |   |-- exception/    # Global error handling
|       |   |-- repository/   # Spring Data JPA repos
|       |   |-- security/     # JWT util, filter, UserDetails
|       |   `-- service/      # Business logic
|       `-- resources/
|           `-- db/migration/ # Flyway SQL migrations
|-- frontend/         # Next.js app
|   `-- src/
|       |-- app/      # App Router pages
|       |-- components/
|       `-- lib/      # API client, auth context, types
|-- docker-compose.yml
|-- .env.example
`-- README.md
```

---

## API Reference

Full interactive docs at `/swagger-ui.html` after starting the backend.

### Auth
| Method | Path | Auth |
|--------|------|------|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| GET | /api/auth/me | Bearer |

### Sessions & Bookings
| Method | Path | Auth |
|--------|------|------|
| GET | /api/sessions | Public |
| GET | /api/sessions/featured | Public |
| POST | /api/sessions/{id}/bookings | PARENT |
| POST | /api/sessions/{id}/waitlist | PARENT |
| GET | /api/bookings/my | PARENT |
| GET | /api/bookings/{id} | PARENT/ADMIN |
| PATCH | /api/bookings/{id} | ADMIN |
| DELETE | /api/bookings/{id} | PARENT/ADMIN |

### Tournaments
| Method | Path | Auth |
|--------|------|------|
| GET | /api/tournaments | Public |
| GET | /api/tournaments/{id} | Public |
| POST | /api/tournaments/{id}/register | Bearer |

### Admin
| Method | Path | Auth |
|--------|------|------|
| GET | /api/admin/sessions | ADMIN |
| GET | /api/admin/sessions/{id} | ADMIN |
| POST | /api/admin/sessions | ADMIN |
| PATCH | /api/admin/sessions/{id} | ADMIN |
| DELETE | /api/admin/sessions/{id} | ADMIN |
| POST | /api/admin/sessions/{id}/duplicate | ADMIN |
| GET | /api/admin/sessions/{id}/waitlist | ADMIN |
| GET | /api/admin/tournaments | ADMIN |
| GET | /api/admin/tournaments/{id} | ADMIN |
| POST | /api/admin/tournaments | ADMIN |
| PATCH | /api/admin/tournaments/{id} | ADMIN |
| DELETE | /api/admin/tournaments/{id} | ADMIN |
| GET | /api/admin/registrations | ADMIN |
| GET | /api/admin/registrations/{id} | ADMIN |
| PATCH | /api/admin/registrations/{id} | ADMIN |
| DELETE | /api/admin/registrations/{id} | ADMIN |

### Site Content & Media
| Method | Path | Auth |
|--------|------|------|
| GET | /api/content/blocks | Public |
| GET | /api/content/blocks/{key} | Public |
| GET | /api/content/media | Public |
| GET | /api/admin/content/blocks | ADMIN |
| GET | /api/admin/content/blocks/{key} | ADMIN |
| PUT | /api/admin/content/blocks/{key} | ADMIN |
| DELETE | /api/admin/content/blocks/{key} | ADMIN |
| GET | /api/admin/content/media | ADMIN |
| GET | /api/admin/content/media/{id} | ADMIN |
| POST | /api/admin/content/media | ADMIN |
| PATCH | /api/admin/content/media/{id} | ADMIN |
| DELETE | /api/admin/content/media/{id} | ADMIN |

Common public content keys used by the frontend:

| Key | Purpose |
|-----|---------|
| `nav.brand` | Navbar brand text + `navLinks` metadata |
| `footer.main` | Footer brand/body/contact + `quickLinks` metadata |
| `home.hero` | Home hero title/subtitle/body + CTA/stats metadata |
| `home.features` | Home features section + cards metadata |
| `home.testimonials` | Testimonials section + items metadata |
| `home.pricing` | Pricing section + tiers metadata |
| `home.faq` | FAQ section + items metadata |
| `home.location` | Location/contact section + map metadata |
| `home.photos` | Photos section title/body + empty state metadata |
| `home.videos` | Videos section title/body + empty state metadata |
| `about.page` | About page content + mission/headings/values/coaches/stats metadata |
| `programs.page` | Programs page title/body + overview/filter copy metadata |
| `tournaments.page` | Tournaments page title/body + filter/CTA copy metadata |
| `contact.page` | Contact page content + labels/messages metadata |

Default media section keys:

| Section Key | Media Type |
|-------------|------------|
| `HOME_PHOTOS` | `PHOTO` |
| `HOME_VIDEOS` | `VIDEO` |

### Payments
| Method | Path | Auth |
|--------|------|------|
| POST | /api/webhooks/stripe | Public (signature verified) |

---

## Stripe Webhooks (local testing)

```bash
stripe listen --forward-to localhost:8080/api/webhooks/stripe
```

Events handled:
- `payment_intent.succeeded` -> marks booking/registration as CONFIRMED
- `payment_intent.payment_failed` -> marks as FAILED
