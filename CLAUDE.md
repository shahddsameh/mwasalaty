# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the `backend/` directory.

```bash
# Install dependencies
npm install

# Start the server (port 3000 by default)
npm start

# The server also reads PORT from .env if set
node server.js
```

There are no tests configured (`npm test` is a placeholder).

## Architecture

Mwasalaty is a Cairo public-transport journey-planning and QR ticketing backend. The frontend lives at a separate origin (`http://localhost:5173`). This repo is the Express API only.

### Request flow

```
Client → POST/GET /api/*
  → backend/src/routes/ticket.js                          (route declarations)
  → backend/src/controllers/ticketController.js           (HTTP layer, STATUS_MAP error→code)
  → backend/src/services/ticketService.js                 (all business logic)
  → backend/src/stores/{ticketStore,scannerProfileStore}.js  (in-memory Maps)
```

### Key service functions (`ticketService.js`)

| Function | What it does |
|---|---|
| `createTicket(body)` | Filters transit legs, assigns 12-char IDs, 24 h expiry, stores per-leg `fareAmount` from `leg.fare` |
| `validateLeg(ticketId, legId, opts)` | Operator marks a leg used; checks expiry, refund state, SUBWAY station-tier limits |
| `scanValidate(qrPayload, scannerProfileId)` | QR scanner path; matches leg by mode+route against a scanner profile, marks used |
| `refundTicket(ticketId, legIds?)` | Refunds unused legs; 24 h grace window after expiry; updates ticket status to `refunded` / `partial_refund` |
| `getTicketById(ticketId)` | Simple lookup with 404 throw |

### Data stores

Both stores are **in-memory Maps** — data is lost on restart. There is no database.

- `ticketStore.js` — `saveTicket / getTicket / updateTicket`
- `scannerProfileStore.js` — hardcoded demo profiles; `getAllProfiles / getProfileById`. Each profile is **single-mode** (`scanValidate` matches `leg.mode === profile.mode`). Generic scanners: `scanner_bus_001` (BUS), `scanner_subway_001` (SUBWAY); plus route-specific demos `scanner_bus_14`, `scanner_bus_108`, `scanner_subway_m2`. Only **BUS** and **SUBWAY** exist in the graph data (METRO is treated as SUBWAY; no TRAM/RAIL/MICROBUS). WALK legs are never validated.

### Ticket & leg lifecycle

Leg statuses: `unused` → `used` (via validate) or `refunded` (via refund endpoint).

Ticket status is recomputed by `resolveTicketStatus(ticket)` after every leg mutation:

| Leg states | ticket.status |
|---|---|
| All used | `used` |
| All refunded | `refunded` |
| Any refunded (mix with used or unused) | `partially_refunded` |
| All unused (or no mutation yet) | `active` |

`payment.status` stays `paid` when `ticket.status` becomes `used`. It becomes `refunded` or `partially_refunded` only when a refund occurs. `payment.refundedAmount` and `payment.refundedAt` accumulate across multiple refund calls.

### Error handling pattern

`ticketService.js` throws plain objects `{ code, message, details }`.  
`ticketController.js` maps `ErrorCodes` → HTTP status via `STATUS_MAP`, then calls `makeError()` from `helpers/errors.js`.  
Add new error codes to **both** `ErrorCodes` in `errors.js` and `STATUS_MAP` in `ticketController.js`.

### Payment

Payments go through **PayMob (Accept) test checkout** via the Unified Checkout / Intention API. No SDK — `paymobService.js` uses native `fetch` + `node:crypto`.

Flow:
1. `POST /api/payments/checkout-session` → `paymentService.createCheckoutSession` builds a PayMob intention (`POST https://accept.paymob.com/v1/intention/`) and returns `{ sessionId, checkoutUrl }`. `sessionId` is our generated `special_reference` (`mwasalaty_<itineraryId>_<ts>`), which also keys `paymentSessionStore`.
2. Frontend redirects to `checkoutUrl` (`accept.paymob.com/unifiedcheckout/?publicKey=…&clientSecret=…`).
3. `POST /api/payments/paymob-webhook` (the intention `notification_url`) → `handleWebhookEvent` verifies the `hmac` query param (HMAC-SHA512 over ordered transaction fields) and, on `obj.success === true`, creates the ticket. PayMob posts JSON, so no raw-body middleware is needed.
4. `GET /api/payments/checkout-session/:sessionId/result` → polled by the frontend; 202 while pending, `PAYMENT_FAILED` if cancelled/failed, `{ ticket }` once issued.

Paid tickets store `payment.method = 'PAYMOB_TEST'`, `payment.status = 'paid'`, `paymobOrderId`, `paymobTransactionId`. Refunds (`POST /api/tickets/:id/refund`) call PayMob's auth-token + `void_refund/refund` endpoint (needs `PAYMOB_API_KEY`) and tag legs with `paymobRefundId`. The older simulated path (`paymentMethod: 'SIMULATED'`) still works for tickets created directly via `POST /api/tickets`.

### Transit modes

`TRANSIT_MODES = { BUS, METRO, SUBWAY, TRAM, RAIL, MICROBUS }` is the permissive allowlist for ticketable legs; `WALK` legs are filtered out at creation time. SUBWAY legs carry tier-based station limits (Tier 1: 1–9, Tier 2: 10–16, Tier 3: 17+). **In practice the live OSM+GTFS graph only contains `BUS` and `SUBWAY`** (metro). `METRO` is treated as `SUBWAY` (the GTFS term); the app standardizes on `SUBWAY`. Local geocoding (`geocodingService.js` `LOCAL_PLACES`) and the frontend `placeSuggestions` are derived from the graph's covered stops so every suggestion can be routed.

## Operator app

`operator/` is a separate Vue 3 + TypeScript + Tailwind PWA for bus and subway operators.
It consumes the existing scanner endpoints only: `GET /api/scanner-profiles`,
`POST /api/tickets/scan/validate`, `POST /api/tickets/:id/legs/:legId/validate`, and
`GET /api/tickets/:id`. It does not require backend changes.

The app stores the selected scanner profile and shift tally in `localStorage`, and stores
offline scanned ticket payloads in IndexedDB via `idb-keyval`. Offline scans are never
shown as green admit decisions; they are queued as `unverified` and reconciled when the
browser returns online. Run it with `pnpm --filter operator dev` on port 5174.

### Environment variables (`.env` in `backend/`)

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Server listen port |
| `CLIENT_URL` | `http://localhost:5173` | CORS allowed origin + PayMob `redirection_url` base |
| `BACKEND_URL` | `http://localhost:3000` | Public base URL used to build the PayMob `notification_url` (webhook) |
| `PAYMOB_SECRET_KEY` | — | Authorization for the Intention API |
| `PAYMOB_PUBLIC_KEY` | — | Used in the Unified Checkout URL |
| `PAYMOB_INTEGRATION_ID` | — | Card integration id → `payment_methods` |
| `PAYMOB_HMAC_SECRET` | — | Verifies webhook callbacks (HMAC-SHA512) |
| `PAYMOB_API_KEY` | — | Only needed for refunds (legacy auth token) |
| `OTP_GRAPHQL_URL` | `http://localhost:8080/otp/…` | OpenTripPlanner endpoint (plan router, currently commented out) |

<!-- SPECKIT START -->
## Active Spec Kit plan

- **001-operator-scanner-pwa** — Operator Ticket-Scanner PWA (a new `operator/` PWA on the
  Vue 3 + TS + Tailwind stack; consumes existing backend endpoints, no backend changes).
  Plan: `specs/001-operator-scanner-pwa/plan.md`
<!-- SPECKIT END -->

