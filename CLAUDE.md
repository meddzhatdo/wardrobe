# Wardrobe App — Project Context

## What this is
A personal wardrobe management app. Users photograph or link their clothing, the app enriches items with AI metadata, and generates outfit suggestions based on weather. Live at **https://wardrobe-two-lime.vercel.app**.

## Stack
- **Frontend**: React (Vite), plain CSS (no Tailwind), Lucide icons
- **Backend**: Vercel serverless functions in `/api/` (Node.js, CommonJS-style exports)
- **Database + Auth**: Supabase (Postgres + Supabase Auth)
- **AI**: Anthropic Claude (called directly via `fetch` to the Anthropic API — no SDK)
- **Monitoring**: New Relic browser agent (keys are `VITE_NR_*`, intentionally public-facing)
- **Error tracking**: Sentry (via `api/_sentry.js`)
- **Deployment**: Vercel, project name `wardrobe`, org `meddzhatdo`

## Frontend structure
```
src/
  WardrobeApp.jsx       # Root: auth state, global state, tab routing
  supabase.js           # Supabase client (anon key, frontend-safe)
  lib/
    constants.js        # BOARDS, ITEMS, TABS, OUTFIT_GOALS, CSS vars
    db.js               # dbItemToApp(), dbOutfitToApp(), collageToDbPayload()
    image.js            # bg removal, enrichItem(), base64 helpers
    weather.js          # wmoCondition(), fmtHour()
    collage.jsx         # Canvas collage logic, aiOutfitToCanvasItems()
  components/
    WardrobeTab.jsx     # Item grid, filtering, boards
    TodayTab.jsx        # Daily outfit suggestions, weather
    StudioTab.jsx       # Canvas collage editor
    StylistTab.jsx      # AI stylist chat (conversation history sidebar)
    AnalyticsTab.jsx    # Wear tracking, stats
    ProfileTab.jsx      # User profile, sizes, style preferences
    modals/
      AuthModal.jsx         # Sign in / Sign up / Forgot password / Recovery
      AddMethodModal.jsx    # Choose how to add item (photo, link, manual)
      AddFromLinkModal.jsx  # URL scraper flow
      AddItemModal.jsx      # Item form with bg removal + AI enrichment
      ItemModal.jsx         # View/edit existing item
      BackgroundEraserModal.jsx
      AddToCollageModal.jsx
      OnboardingModal.jsx
```

Tabs are lazily mounted: once a tab is visited it stays mounted (in `mountedTabs` Set) to preserve state, but only the active tab is visible. Active tab persists to `localStorage`.

## API routes (`/api/*.js`)
All routes follow the same pattern:
1. CORS headers + OPTIONS preflight
2. Method guard (POST only)
3. Auth: extract Bearer token → `supabase.auth.getUser(token)` → 401 if invalid
4. Rate limit: `checkRateLimit()` from `_rateLimit.js` → 429 if exceeded
5. Input validation → 400
6. Business logic
7. Sentry captures unexpected errors → 500

| Route | Purpose |
|---|---|
| `generate-outfits.js` | Calls Anthropic with wardrobe items + weather → returns 3 outfit suggestions |
| `enrich-item.js` | Calls Anthropic with item image → returns structured attributes (warmthRating, etc.) |
| `scrape-item.js` | Fetches a product URL via `_safeFetch.js`, parses JSON-LD + og: tags → returns name/brand/price/image |
| `proxy-image.js` | Proxies external images for the bg-removal worker |
| `ai-stylist.js` | AI stylist chat, maintains conversation history |
| `delete-account.js` | Deletes user data + Supabase auth account |

### Shared helpers
- `_audit.js` — `logAuditEvent()` writes to Supabase `audit_logs` table (also used for rate limiting)
- `_rateLimit.js` — reads `audit_logs` to count events in a time window, fails open on error
- `_sentry.js` — `initSentry()` + `Sentry.captureException()`
- `_safeFetch.js` — `safeFetch()` wraps `fetch` with SSRF protection; `BLOCKED` regex blocks localhost/private IPs

## Environment variables
| Variable | Where used | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | Frontend + API | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend + API | Safe to expose — enforces RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | API only | Never `VITE_` prefix — bypasses RLS |
| `ANTHROPIC_API_KEY` | API only | Never `VITE_` prefix |
| `VITE_APP_URL` | API (CORS origin) | Production URL |
| `VITE_NR_*` | Frontend | New Relic browser agent keys — intentionally public |

`VITE_` prefix = bundled into frontend JS by Vite. Non-`VITE_` = server-only.

## Auth flow
- Supabase Auth handles sign-in, sign-up, password reset, OAuth
- Frontend: `supabase.auth.onAuthStateChange()` in `WardrobeApp.jsx`
- API: every route re-validates the JWT via `supabase.auth.getUser(token)` — never trusts client-supplied user IDs
- Password recovery: Supabase sends a magic link → app detects `type=recovery` in URL hash → shows `AuthModal` in recovery mode

## Testing
- **Runner**: Vitest (`npm test` = `vitest run`)
- **Environment**: `node` by default (set in `vite.config.js`); per-file `// @vitest-environment happy-dom` for component tests
- **Component tests**: `@testing-library/react` + `happy-dom`
- **Mocking**: `vi.mock()` for modules, `vi.stubGlobal('fetch', mockFetch)` for Anthropic calls
- **Important**: `vi.mock()` is hoisted above imports — factory functions cannot reference outer `const` variables. Pattern: inline `vi.fn()` in factory, then re-import the mocked module to get a reference.

Test files:
- `api/__tests__/generate-outfits.test.js`
- `api/__tests__/enrich-item.test.js`
- `api/__tests__/scrape-item.test.js`
- `src/lib/__tests__/weather.test.js`
- `src/components/__tests__/AuthModal.test.jsx`

## Security decisions
- RLS must be enabled on all Supabase tables — auth alone is not enough
- `SUPABASE_SERVICE_ROLE_KEY` is used only in `_rateLimit.js` (needs to read audit logs cross-user) and `delete-account.js`
- SSRF protection on `scrape-item.js` via `_safeFetch.js` + URL validation before fetch
- Rate limiting on all AI routes via audit log counting (not an in-memory counter — survives cold starts)
- Security headers in `vercel.json`: CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy

## Key conventions
- API routes use `req.body` (already parsed by Vercel) — no `body-parser` needed
- Anthropic responses often wrap JSON in markdown fences or prose — always strip ` ```json ``` ` and extract with a `{...}` or `[...]` regex before `JSON.parse()`
- `dbItemToApp()` / `dbOutfitToApp()` normalize DB snake_case rows to camelCase app objects — always go through these when reading from Supabase
- Collage canvas: fixed design size `DESIGN_W × DESIGN_H` from `lib/collage.jsx`, scaled to display at render time
- The `audit_logs` table serves double duty: security audit trail + rate limit counter
