# Changelog

## v1.2.0 — Secure persistence and release readiness

### 2026-10-22 23:50:00 +05:30

- Standardized the application release version to `1.2.0`.
- Sanitized release-facing documentation and implementation language.
- Added the initial Prisma migration for the configured Neon `production` branch.
- Verified authentication, user-isolated trip persistence, emergency contacts, SOS delivery boundaries, retention controls, and deployment setup documentation.
- Confirmed that Twilio remains optional and unconfigured; Resend email delivery is the configured testing path.
- Preserved the existing frontend deferral and backend API scope.

## v1.1.0 — Backend foundation

### 2026-10-22 23:40:00 +05:30

- Created and applied the initial Prisma migration to the configured Neon `production` branch.
- Verified the schema is up to date and Prisma client generation succeeds.
- Confirmed the automated suite, strict typecheck, and production verification workflow remain clean.
- Documented that Twilio remains intentionally optional and unconfigured.

### 2026-10-22 22:30:00 +05:30

Added backend account and safety foundations:

- Added Auth.js email/password and Google OAuth sign-in with bcrypt password hashing.
- Added Prisma PostgreSQL models for users, OAuth accounts, saved trips, emergency contacts, and SOS audit events.
- Added authenticated, user-isolated trip save/list/resume/update APIs.
- Added emergency contact management and authenticated SOS delivery through Resend and/or Twilio.
- Documented deployment, migration, OAuth, and SOS provider setup in `Implementation File/backend-auth-database-sos.md`.

### 2026-10-22 19:51:30 +05:30

The initial Azimuth backend foundation was added:

- Set up a strict Next.js 15, React 19, and TypeScript project.
- Added shared, schema-validated Zod contracts for trip planning.
- Added geo utilities, including the street-adjusted Haversine distance calculation.
- Added Open-Meteo weather integration with a one-hour best-effort in-memory cache and a 3.5-second abort timeout. Weather failures return an empty forecast so they do not block itinerary generation.
- Added environment and error helpers, keeping provider keys server-only.
- Added Gemini and Groq provider selection through the Vercel AI SDK's `generateObject`.
- Added all four `POST /api/trip/*` routes: questions, generate, swap-stop, and tweak.
- Made the validated request's location, day count, and map center authoritative over generated itinerary data.
- Added two schema-validated offline demo trips.
- Added automated tests covering successful structured responses, missing-provider-key mode, malformed input, rate limiting, and timeouts.
- Kept the frontend intentionally deferred so the backend could be independently built and tested.

### 2026-10-22 20:05:29 +05:30

Provider configuration and backend verification were completed:

- Updated the provider models to the currently available `gemini-3.8-flash` and `openai/gpt-oss-120b` models.
- Configured provider selection to prefer Groq when both providers are available.
- Added server-side provider error logging without exposing credentials.
- Live-tested all four trip routes with both provider credentials configured; each returned HTTP 200 with the expected response shape.
- Confirmed that the automated suite passes all 15 tests.
- Confirmed that type checking and the production build both pass.
- Confirmed that live provider calls are verified; frontend work remains intentionally deferred.
