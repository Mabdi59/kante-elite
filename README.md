# Kante Elite Training

Full-stack youth soccer training and tournament management platform built with Next.js, Spring Boot, and PostgreSQL.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, TanStack Query, React Hook Form + Zod |
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

### 1 — Start the database

```bash
docker-compose up -d
```

### 2 — Configure environment

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
export NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 3 — Run the backend

```bash
cd backend
mvn spring-boot:run
```

The API starts on **http://localhost:8080**.  
Swagger UI: **http://localhost:8080/swagger-ui.html**

### 4 — Run the frontend

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
├── backend/          # Spring Boot API
│   └── src/
│       ├── main/java/com/kanteelite/backend/
│       │   ├── config/       # Security, CORS, Stripe, OpenAPI
│       │   ├── controller/   # REST controllers
│       │   ├── dto/          # Request & response DTOs
│       │   ├── entity/       # JPA entities
│       │   ├── exception/    # Global error handling
│       │   ├── repository/   # Spring Data JPA repos
│       │   ├── security/     # JWT util, filter, UserDetails
│       │   └── service/      # Business logic
│       └── resources/
│           └── db/migration/ # Flyway SQL migrations
├── frontend/         # Next.js app
│   └── src/
│       ├── app/      # App Router pages
│       ├── components/
│       └── lib/      # API client, auth context, types
├── docker-compose.yml
├── .env.example
└── README.md
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
| POST | /api/bookings | PARENT |
| GET | /api/bookings/my | PARENT |

### Tournaments
| Method | Path | Auth |
|--------|------|------|
| GET | /api/tournaments | Public |
| GET | /api/tournaments/{id} | Public |
| POST | /api/tournaments/{id}/register | Bearer |

### Admin
| Method | Path | Auth |
|--------|------|------|
| POST | /api/admin/sessions | ADMIN |
| PATCH | /api/admin/sessions/{id} | ADMIN |
| POST | /api/admin/tournaments | ADMIN |
| GET | /api/admin/registrations | ADMIN |

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
- `payment_intent.succeeded` → marks booking/registration as CONFIRMED
- `payment_intent.payment_failed` → marks as FAILED

