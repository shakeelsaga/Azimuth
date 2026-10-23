# Changelog

## v1.2.0 — Secure persistence and release readiness

### 2026-10-23 12:22:00 +05:30

- Gracefully handled missing emergency contacts and clipboard permissions in SOS modal:
  - Eliminated `NotAllowedError` by wrapping clipboard API calls in `try...catch` with automatic document textarea fallback.
  - Added clear inline alert banner when no emergency contacts are configured (HTTP 409) or user is unauthenticated (HTTP 401), with a direct action link to manage contacts in `/profile`.
- Enriched SOS alert emails with verified traveler identity:
  - Updated `POST /api/sos` to query traveler account details and include full name and registered email in both plain text and structured HTML email broadcasts to emergency contacts.
- Implemented email verification at the Sign Up stage via 6-digit codes:
  - Created `POST /api/auth/register/send-code` sending numeric 6-digit verification codes via Resend (`SOS_FROM_EMAIL` / `AUTH_FROM_EMAIL`).
  - Updated `POST /api/auth/register` to verify the 6-digit code against `prisma.verificationToken` before creating the account and setting `emailVerified`.
  - Added 2-step verification workflow in `src/app/login/page.tsx` with code input, resend button, and automated sign-in upon verification.
- Added database existence check and 6-digit code verification for Forgot Password:
  - Updated `POST /api/auth/password-reset/request` to verify the email exists in the database first, returning HTTP 404 with helpful feedback if not found.
  - Dispatched 6-digit reset codes via Resend and updated `POST /api/auth/password-reset/complete` to verify the code and update the password directly in the login flow.
- Verified 100% test pass rate across 6 test suites (21 tests), strict TypeScript typechecking, and successful production build across all 21 routes.

### 2026-10-23 11:54:00 +05:30

- Conditionally hid home screen account callout for authenticated users:
  - Integrated `useSession` in `HeroIntake.tsx` to automatically hide the bottom account invitation card when a user is signed in.
- Enhanced provider failover and rate limit classification:
  - Added alternative provider failover in `POST /api/trip/questions` to seamlessly switch models upon encountering rate limits or quota exhaustion.
  - Improved `createGenerationError` in `src/lib/route-utils.ts` to inspect nested error statuses and classify quota exhaustion errors as HTTP 429.
- Verified 100% test pass rate across 6 test suites (21 tests) and strict TypeScript typechecking.

### 2026-10-23 11:45:00 +05:30

- Configured remote image domains for Google OAuth user avatars:
  - Added `*.googleusercontent.com` and `lh3.googleusercontent.com` to `images.remotePatterns` in `next.config.ts`.
  - Added image error fallback handling in `UserProfileMenu.tsx` to gracefully revert to user initials if avatar image loading fails.
- Verified 100% test pass rate across 6 test suites (21 tests) and strict TypeScript typechecking.

### 2026-10-23 11:23:00 +05:30

- Revised conversion rates to 94.90 INR per USD and updated global exchange benchmarks:
  - Updated `USD_TO_INR = 94.90` in `src/lib/currency.ts` and refreshed world currency benchmarks (Japan JPY 155, Indonesia IDR 16,250, Thailand THB 36.8, Euro EUR 0.93, UK GBP 0.79, UAE AED 3.67, Singapore SGD 1.35, Australia AUD 1.55, Canada CAD 1.39, South Korea KRW 1,390, Vietnam VND 25,450, Turkey TRY 34.5, Switzerland CHF 0.90, India INR 94.90).
  - Updated unit tests in `src/lib/currency.test.ts` and conversion note in `PackingBudgetSheet.tsx`.
- Implemented split-screen Login/Signup experience (`/login`):
  - Left pane displays `/assets/Login_Herio_Image.png` with subtle dark overlay and editorial copy ("Every journey begins with a calm intention").
  - Right pane provides an editorial auth card supporting both Sign In and Create Account tabs.
  - Added Google OAuth sign-in integration featuring the official Google Favicon logo (`/assets/Google_Favicon.svg`).
  - Wrapped root client providers with NextAuth `<SessionProvider>`.
  - Added auto-verification in `POST /api/auth/register` to support seamless development and testing signups.
- Implemented unsaved trip authentication guards:
  - Created `UnsavedTripModal.tsx` intercepting unauthenticated attempts to Save trip, dispatch SOS, or return to the Home screen from an active unsaved itinerary.
  - Prompts travelers to log in/sign up so itinerary details are preserved to their personal cloud library.
- Added user profile avatar & navigation menu (`UserProfileMenu.tsx`):
  - Positioned at the top right of the home screen and workspace navigation bar.
  - Displays user profile picture or capitalized name/email initials in an ink circle avatar when authenticated, replacing the login button.
  - Interactive dropdown provides direct navigation to "My Profile & SOS", "Saved Trips", and "Log Out".
- Added account invitation section at the bottom of the home screen:
  - Editorial card below sample trips inviting travelers to create an account or sign in for cloud sync and emergency protection.
- Built dedicated Profile page (`/profile`):
  - Displays authenticated user credentials (Name, Email, Auth Type, Verified Status) without displaying passwords.
  - Added password management form for credentials users with validation and backend update via `POST /api/auth/change-password`.
  - Integrated Emergency SOS Contacts management: fetches, displays, adds, and removes verified emergency contacts with phone and email validation.
  - Added prominent Log Out action.
- Verified 100% test pass rate across 6 test suites (21 tests) and strict TypeScript typechecking.

### 2026-10-23 10:52:00 +05:30

- Fixed "Need to tweak something" processing and added interactive loading indicators:
  - Added multi-tier resilience to `POST /api/trip/tweak` and `POST /api/trip/swap-stop`: queries primary provider (Google `gemini-3.5-flash`), seamlessly fails over to Groq (`openai/gpt-oss-120b`, completing in ~1.3s), and includes an itinerary-aware deterministic fallback so requests never fail with "couldnt process the request".
  - Created animated `LoadingDots` component with staggered bouncing keyframes in `QuickTweakDock.tsx`.
  - Displayed live loading feedback: clicking a suggested prompt pill displays `{prompt} ...` with animated bouncing dots, the submit button shifts to animated dots while processing, and a status bar displays "Thinking through changes to your itinerary •••".
- Converted all trip prices to INR (₹) with local currency options:
  - Created `src/lib/currency.ts` utility providing USD-to-INR conversions (`1 USD ≈ ₹86.5`) alongside destination-specific local currencies (e.g. Japan JPY `¥`, Indonesia IDR `Rp`, Europe EUR `€`, UK GBP `£`, Thailand THB `฿`, Vietnam VND `₫`).
  - Added dual price formatting functions `formatDualPrice()` and `convertPriceRangeString()`.
  - Updated `StopCard.tsx` to render stop estimated entrance/activity costs and overnight stay price ranges in INR with local currency alongside (or `Free entry` when cost is zero).
  - Updated `PackingBudgetSheet.tsx` with dual INR and local currency values for Accommodation, Food & Drinks, Transit & Tickets, and Total Daily Estimates, plus an interactive 3-way toggle pill (`₹ INR + Local`, `₹ INR`, `Local currency`).
  - Updated `PrintView.tsx` with dual INR and local currency formatting across print sheets and overnight stay summaries.
  - Added unit test suite in `src/lib/currency.test.ts` verifying calculations, range parsing, and formatting.
- Verified 100% test pass rate across 6 test suites (21 tests) and strict TypeScript typechecking.

### 2026-10-23 10:16:00 +05:30

- Resolved trip generation failures by switching to Google AI provider and hardening schema validation:
  - Updated `src/lib/env.ts` to prioritize Google Generative AI over Groq by default and support explicit runtime override via `AI_PROVIDER=google`.
  - Configured `gemini-3.5-flash` in `src/lib/ai.ts` to avoid free-tier daily request limits on 3.8 and overcome Groq JSON truncation cutoffs.
  - Increased `LLM_TIMEOUT_MS` to 90 seconds in `src/lib/ai.ts` to provide ample headroom for multi-day dense itinerary generation.
  - Made array constraints flexible in `TripPlanSchema` (`packingItems: min(3).max(6)`, `beforeYouGoTips: min(2).max(5)`, `suggestedTweakPrompts: min(2).max(5)`) and added count guidance in `generate/route.ts` to eliminate strict schema validation rejections.
  - Verified live trip generation against `POST /api/trip/generate` with HTTP 200 response and 100% test pass rate across all 17 unit tests.

### 2026-10-23 09:37:00 +05:30

- Refined micro-interactions for callouts and action buttons:
  - Isolated the arrow hover interaction on the Kyoto showcase card to nudge only the arrow glyph without translating the card container.
  - Isolated the arrow hover animation on the "Start planning" CTA so only the arrow nudges right while text stays stationary.
  - Restored the crisp 1px ink border outline to the top-left peeking brand logo container while keeping the image filled edge-to-edge.
  - Added an active-state arrow hover nudge to the natural language tweak dock submit button when input is ready.
- Verified with 17 automated tests and strict TypeScript type checking.

### 2026-10-23 09:30:00 +05:30

- Enhanced intake interactivity and corner brand mark positioning:
  - Added micro-lift (`translateY(-2px)`) and tonal background shifts on hover across all home page interactive elements (parameter pills, day count tiles, sample trips, city search items, and showcase card).
  - Added a smooth left-to-right animated underline expansion (`scaleX: 0 -> 1` with `transformOrigin: left`) on the "Start planning" button triggered when all required planning fields are selected.
  - Enhanced the top-left peeking logo card: enlarged to 210px square, filled completely by the brand image with zero yellow border or background padding, anchored with absolute positioning so it scrolls naturally with document scroll while preserving hover interaction.
- Verified with 17 automated tests and strict TypeScript type checking.

### 2026-10-23 09:22:00 +05:30

- Refined button layout, alignment, and tactile proportions:
  - Updated conversational question option pills to align titles and descriptive copy strictly to the left, preventing awkward visual centering on multi-line text descriptions.
  - Increased touch target dimensions and typography scale across all home intake interactive buttons:
    - Enlarged structural parameter pills (companions, trip vibe, budget range, sample trips) with increased padding, height, and font size.
    - Enlarged day count buttons to 52px square tiles with bolder number labels.
    - Increased destination search input height and dropdown result tap targets.
    - Scaled up the "Start planning" call-to-action button for prominent emphasis.
- Verified with 17 automated tests and strict TypeScript type checking.

### 2026-10-23 01:25:00 +05:30

- Refined the Azimuth frontend interface and interactions:
  - Configured high-resolution favicon metadata and icon routes using the official Azimuth brand mark.
  - Added a full-screen geometric loading transition during custom trip planning to prevent premature form rendering before personalized questions are loaded.
  - Standardized pill styling across all intake options, day selectors, stop cards, tweak prompts, and modal buttons with precise horizontal/vertical centering and balanced padding.
  - Added an oversized, peeking brand mark card in the top-left corner of the hero intake screen matching the Kyoto showcase card geometry and hover interaction.
  - Replaced all raw cartoon emojis throughout the application with monochrome Lucide vector icons, including dedicated weather, transit, dining, accommodation, and safety indicators.
  - Centered the unsaved changes indicator dot in the top navigation bar between action controls.
- Verified with 17 automated tests, strict TypeScript type checking, and successful Next.js production build.

### 2026-10-23 00:36:00 +05:30

- Built the complete Azimuth frontend workspace:
  - Added the monumental intake screen with debounced destination autocomplete, day selection, structural parameter pills, and sample trip previews.
  - Added conversational follow-up questions with single-select option pills, custom notes input, and calm fallback banners.
  - Added the split-screen day-by-day planner workspace with desktop side-by-side view, tablet support, and mobile bottom sheet map.
  - Added the tonal day selector with desktop vertical typography stack and mobile horizontal scroll strip.
  - Added activity stop cards with timing annotations, local food suggestions, overnight stays, and logistical transit bridges.
  - Added the smart plan change workflow with reason selection, skip vs. move relocation calculation, inline diff preview, and 10-level undo.
  - Added the natural language tweak dock with suggested prompt pills and clarification handling.
  - Added the synchronized monochrome vector map powered by MapLibre GL and Carto Positron tiles with numbered pins and dashed route lines.
  - Added slide-over utility panels for budget breakdown, weather packing items, before-you-go tips, and saved trips library.
  - Added real-time emergency assistance and GPS coordinate sharing.
  - Added clean A4 print view and URL sharing via compressed query parameters.
- Verified with 17 automated tests, strict TypeScript type checking, and successful Next.js production build.

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
- Documented deployment, migration, OAuth, and SOS provider setup for the application.

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
