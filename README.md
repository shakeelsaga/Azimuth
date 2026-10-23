<div align="center">
  <img src="./public/assets/Azimuth_Logo.png" alt="AZiMUTH Logo" width="120" height="120" style="border-radius: 16px; object-fit: contain;" />
  <h1>AZ<span style="color: #F01916;">i</span>MUTH</h1>
  <p><strong>Intelligent, human-crafted travel itineraries with real-time adaptation and safety routing.</strong></p>

  <p>
    <a href="https://azimuth-jcg8.onrender.com/" target="_blank">
      <img src="https://img.shields.io/badge/Live%20Demo-azimuth--jcg8.onrender.com-00c7b7?style=for-the-badge&logo=render&logoColor=white" alt="Live Demo" />
    </a>
  </p>

  <p>
    <a href="https://azimuth-jcg8.onrender.com/" target="_blank"><strong>Explore Live Application &rarr;</strong></a>
  </p>

  <p>
    <a href="#overview">Overview</a> •
    <a href="#core-features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#environment-variables">Environment Variables</a> •
    <a href="#testing--verification">Testing</a> •
    <a href="#known-limitations--trade-offs">Known Limitations</a>
  </p>
</div>

---

## Overview

> [!TIP]
> **Live Deployment:** Azimuth is live in production on Render. You can test the application directly at:  
> **👉 [https://azimuth-jcg8.onrender.com](https://azimuth-jcg8.onrender.com)**  
> *(Note: Render free tier instances spin down after inactivity; initial cold starts take ~30–45 seconds to wake up).*

**AZiMUTH** is a comprehensive travel planning application designed to turn open-ended travel ideas into balanced, day-by-day itineraries. Inspired by the incredible navigation of the **Arctic Tern** (a bird that journeys over 44,000 miles each year from pole to pole), Azimuth combines structured travel pacing, interactive mapping, budget tracking, weather context, and emergency SOS routing into a single, intuitive workspace.

Built with **Next.js 15 (App Router)**, **React 19**, **Tailwind CSS**, and **Prisma ORM**, Azimuth pairs modern full-stack web architecture with an automated multi-tier AI model cascade to deliver fast, reliable travel generation even under strict free-tier rate limits.

---

## Core Features

### 1. Interactive Intake & Preference Discovery
- **Natural Language Destination Matching:** Enter any city, country, or region with instant intelligent parsing.
- **Pill-Based Filter Controls:** Avoid clumsy dropdowns. Select trip duration, travel party style (solo, couple, family, friends), budget tier (budget, moderate, luxury), and interest tags (cuisine, history, hiking, culture, hidden gems) with high-contrast pill toggles.
- **Dynamic Clarifying Questions:** Tailored questions generated on-the-fly to refine your trip pace and special requirements before building the plan.

### 2. Day-by-Day Itinerary Engine
- **Balanced Pacing:** Intelligent morning, afternoon, and evening scheduling designed to avoid travel fatigue and rush.
- **Stop-Level Details:** Every stop includes estimated duration, realistic expense estimates, geographical coordinates, transport notes, and local tips.
- **Weather Forecast Context:** Integrated seasonal and daily weather predictions for each day of the journey.

### 3. Natural Language Tweaks & Stop Swaps
- **Single-Stop Replacement:** Swap any individual museum, cafe, or viewpoint for an alternative matching the same neighborhood and vibe.
- **Conversational Refinement:** Tweak the entire day or specific activities using plain English prompts (e.g., *"Make day 2 more relaxed and focused on local street food"*).

### 4. Interactive Map & Spatial Route Visualization
- **Leaflet & OpenStreetMap Integration:** Pinpoints every activity geographically with color-coded day markers.
- **Route Tracking:** Visualizes day routes to ensure activities are grouped logically without backtracking across town.

### 5. Budget Calculator & Financial Breakdown
- **Real-Time Cost Categorization:** Automatic tally of accommodation, transport, meals, activities, and miscellaneous expenses.
- **Interactive Budget Comparison:** Visual indicators comparing total estimated spend against your target budget ceiling.

### 6. Emergency SOS & Traveler Safety Beacon
- **One-Click Emergency Broadcast:** Rapid dispatch modal capturing real-time device GPS coordinates via the HTML5 Geolocation API.
- **Dual Email Notification:** Dispatches urgent alerts with direct Google Maps location pins to designated emergency contacts.
- **Resilient Fallback Pipeline:** If external email delivery is restricted, the alert, live coordinates, and timestamp are immediately secured in the database with a shareable emergency URL.

### 7. Full Trip Management & Persistence
- **User Authentication:** Dual authentication with NextAuth.js (Google OAuth and direct credentials registration).
- **Trip CRUD:** Save itineraries, view past journeys in your user profile, update details, or delete completed trips with strict user ownership validation.
- **Offline & Print Friendly:** Export full itineraries to clean, print-optimized sheets for travel without roaming data.

---

## Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [Next.js 15.5](https://nextjs.org/) | App Router, Server Components, API Route Handlers |
| **Frontend** | [React 19](https://react.dev/) + [Tailwind CSS](https://tailwindcss.com/) | Modern UI components, responsive layout, CSS variables |
| **Icons & Design** | [Lucide React](https://lucide.dev/) | Consistent, clean iconography |
| **Mapping** | [Leaflet](https://leafletjs.com/) + [React-Leaflet](https://react-leaflet.js.org/) | Interactive mapping and route visualization via OpenStreetMap |
| **Database** | [PostgreSQL](https://www.postgresql.org/) via [Prisma ORM 6](https://www.prisma.io/) | Relational storage for users, accounts, trips, and emergency alerts |
| **Authentication** | [NextAuth.js v4](https://next-auth.js.org/) | Session handling, Google OAuth 2.0, Credentials provider |
| **AI Integration** | [Vercel AI SDK](https://sdk.vercel.ai/) | Structured JSON output with Zod schema validation |
| **AI Providers** | Google Gemini & Groq | Primary Google models with automated Groq failover |
| **Email Delivery** | [Resend](https://resend.com/) + [Nodemailer](https://nodemailer.com/) | Transactional email with dual-provider SMTP fallback |
| **Testing** | [Jest](https://jestjs.io/) + [Testing Library](https://testing-library.com/) | Comprehensive unit and integration test coverage |

---

## Multi-Tier AI Cascade Architecture

Free-tier LLM endpoints often run into sudden rate limits (`HTTP 429 Too Many Requests`) or quota limits. Azimuth features a **resilient multi-tier model cascade** in `src/lib/ai.ts`:

<div align="center">
  <img src="./public/assets/flowchart.png" alt="AZiMUTH Multi-Tier AI Cascade Architecture" style="max-width: 100%; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);" />
</div>

If any model in the chain experiences rate limiting or transient timeouts, the engine automatically catches the error, advances to the next candidate model, and completes the itinerary without showing an error to the user.

---

## Getting Started

### Prerequisites
- **Node.js**: v18.18 or higher (v20+ recommended)
- **npm**: v9+
- **PostgreSQL**: A running PostgreSQL instance (local, Supabase, Neon, or Railway)
- **Google Gemini API Key**: From [Google AI Studio](https://aistudio.google.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shakeelsaga/Azimuth.git
   cd Azimuth
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory by copying `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your database URL and API keys (see [Environment Variables](#environment-variables)).

4. **Initialize Database:**
   Push the Prisma schema to your PostgreSQL database:
   ```bash
   npx prisma db push
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

| Variable | Required | Description | Example / Default |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/azimuth` |
| `NEXTAUTH_SECRET` | **Yes** | Secret for signing auth session tokens | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | **Yes** | Base URL of the application | `http://localhost:3000` |
| `GOOGLE_GENERATIVE_AI_API_KEY`| **Yes** | Google AI Studio API key | `AIzaSy...` |
| `GEMINI_MODEL` | No | Override default Gemini model | `gemini-3.5-flash` or `gemini-3-flash-preview` |
| `GROQ_API_KEY` | No | Optional Groq key for cross-provider fallback | `gsk_...` |
| `GROQ_MODEL` | No | Override default Groq model | `llama-3.3-70b-versatile` |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth client ID | `...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth client secret | `GOCSPX-...` |
| `RESEND_API_KEY` | Optional | Resend API key for email delivery | `re_...` |
| `EMAIL_FROM` | Optional | From email address for notifications | `Azimuth <onboarding@resend.dev>` |
| `GMAIL_USER` | Optional | Gmail address for Nodemailer fallback | `your-email@gmail.com` |
| `GMAIL_APP_PASSWORD` | Optional | 16-character Google App Password | `xxxx xxxx xxxx xxxx` |

---

## Testing & Verification

The project includes unit and integration tests covering API endpoints, data models, email dispatch logic, and trip management.

```bash
# Run all unit and integration tests
npm test

# Run TypeScript typecheck
npm run typecheck

# Build the Next.js production bundle
npm run build
```

Azimuth maintains **35 passing tests across 9 test suites**, zero TypeScript compilation errors, and clean production route builds across all 22 static and dynamic endpoints.

---

## Known Limitations & Trade-offs

Azimuth was built as a focused, high-speed engineering assessment. To maintain high velocity and deliver a working end-to-end application, deliberate trade-offs and architectural compromises were made:

### 1. Email Delivery & Sandbox Restrictions
> [!WARNING]
> **Resend Free-Tier Sandbox Restriction:** When using the default Resend onboarding domain (`onboarding@resend.dev`), Resend strictly blocks dispatch to any email address other than the verified account owner (`shakeelmohammedofficial@gmail.com`). Delivering to unverified recipients returns `HTTP 403 Forbidden`.

- **Current Mitigation:**
  - **Direct Onboarding:** Direct email/password registration bypasses the 2-step verification code gate, allowing new accounts to be created immediately without failing on email delivery.
  - **Security Advisory:** The Sign Up interface includes an in-app security notice clearly informing users that direct email accounts are unverified and strongly recommending **Continue with Google** for verified identity.
  - **Emergency SOS Resilience:** When email dispatch fails, the SOS route records the emergency event, timestamp, and live GPS coordinates to PostgreSQL and returns `HTTP 200` with the Google Maps link, ensuring travelers are never stranded.
- **Production Solution:** Configure a custom registered domain (e.g., `mail.azimuth.travel`) with verified SPF, DKIM, and DMARC DNS records.

### 2. AI Rate Limiting on Free Tier
> [!NOTE]
> **Gemini Free-Tier Quotas:** Free-tier keys for modern models like `gemini-3.8-flash` and `gemini-3.6-flash` have aggressive request-per-minute (RPM) limits and occasionally throw `HTTP 429 Resource Exhausted`. Furthermore, legacy models such as `gemini-2.5-flash` have been discontinued for new projects.

- **Current Mitigation:** The automated fallback cascade seamlessly shifts requests to `gemini-3.5-flash`, `gemini-3-flash-preview`, or Groq's high-throughput Llama endpoints if primary quotas are exceeded.

### 3. Flight & Accommodation Booking Engine
- **Current State:** Azimuth generates intelligent lodging suggestions, estimated costs, and neighborhood recommendations within each day's plan.
- **Limitation:** Live transactional booking (GDS integration like Amadeus, Sabre, or Booking.com APIs) is not implemented due to API key restrictions and commercial booking engine overhead.

### 4. Weather & Currency Data
- **Current State:** Weather predictions and currency estimates are dynamically estimated based on destination climatology and seasonal patterns.
- **Production Roadmap:** Direct integration with live meteorological APIs (e.g., OpenWeatherMap) and real-time forex rate feeds.

### 5. Browser Clipboard & Location Permissions
- **Current State:** Dispatching an emergency SOS requires the traveler to grant browser Geolocation permissions. In unpermitted contexts or over insecure HTTP connections, `navigator.clipboard.writeText()` may throw a `NotAllowedError`. The application catches these exceptions gracefully and renders direct selectable links.
