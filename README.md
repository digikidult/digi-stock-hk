# DIGI STOCK HK — 7-Eleven Digimon Stock Reports

Mobile-first Cantonese community reporting site for Digimon figurine sightings at Hong Kong 7-Eleven stores. Non-commercial, unofficial, no real-time official inventory integration.

## Features
- Region, keyword and stock-status filtering
- Stock reports: in / out, optional short note, Hong Kong timestamp
- Reports older than 24 hours do not imply current stock
- Community store additions and Google Maps search links
- Public aggregated stats; anonymous Supabase accounts; SQL RLS / 10-minute reporting cooldown / 30-minute store submission cooldown
- User input HTML-escaped before display

## Setup
1. Create a GitHub repository, e.g. `digi-stock-hk`.
2. Create a Supabase project at https://supabase.com.
3. Go to **SQL Editor**, run `schema.sql`, then `seed.sql` to load 15 verified sample listings (not the full HK store directory).
4. In **Authentication → Providers → Anonymous**, enable anonymous sign-ins. If bot protection / CAPTCHA is available on your project, enable it. Protect admin credentials and review Supabase usage limits.
5. In Supabase **Project Settings → API**, copy the **Project URL** and **publishable key** (legacy anon key is also compatible). Paste into `config.js`. **Never paste a service_role / secret key here.**
6. In GitHub, upload `index.html`, `styles.css`, `app.js`, `config.js`. Under **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, `main`, `/ (root)`. Your site will generally be at `https://YOURUSERNAME.github.io/digi-stock-hk/`.
7. Test submitting a report on the live HTTPS site. The backend must be set up before contributions work.

## Notes on safety and data quality
- Public submissions are **unverified**. The most recent report within 24 hours appears; older reports become unknown. A single report is not sufficient to confirm stock and may be wrong.
- Anyone can create new anonymous accounts; per-account submission cooldowns are **not strong anti-spam**. For a public launch, add CAPTCHA / Turnstile with backend verification, moderation and stronger server-side/IP throttling (e.g. Supabase Edge Function). Periodically remove abusive records via Supabase dashboard.
- This proof of concept starts with only 15 store listings and allows additions; it **does not claim to cover every HK branch**. Build a full approved official directory with proper sourcing/revalidation before describing coverage as complete.
- Store addresses were selected from the official directory at https://www.7-eleven.com.hk/zh-hant/store_locator; check ongoing location changes manually.
- Frontend loads the 10,000 latest public reports, enough for a pilot, not scalable indefinitely. For a large launch use a database view/RPC returning the latest record per store, paginated browsing and indexed summary counters.
- Do not submit personal data or unauthorized photos. If you publish this publicly, add a privacy policy, abuse contact, and data retention plan.

## Local preview
Open `index.html` through a local HTTP server (for JS module support), e.g. `python -m http.server 8000`. With empty `config.js`, the website works in read-only preview mode with 15 branches and zero reports. When connected, the view uses live Supabase data.
