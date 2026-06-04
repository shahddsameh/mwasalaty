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
- `scannerProfileStore.js` — three hardcoded demo profiles (Bus 14, Bus 108, Metro Line 2); `getAllProfiles / getProfileById`

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

Stripe is installed but **not used**. All payments are simulated (`paymentMethod: 'SIMULATED'`, `paymentId: 'pay_sim_...'`). Do not wire real Stripe calls without switching to a production Egyptian gateway (PayMob/Fawry) first.

### Transit modes

`TRANSIT_MODES = { BUS, METRO, SUBWAY, TRAM, RAIL, MICROBUS }`. Only these modes produce ticketable legs; `WALK` legs are filtered out at creation time. SUBWAY legs carry tier-based station limits (Tier 1: 1–9, Tier 2: 10–16, Tier 3: 17+).

### Environment variables (`.env` in `backend/`)

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Server listen port |
| `CLIENT_URL` | `http://localhost:5173` | CORS allowed origin |
| `STRIPE_SECRET_KEY` | — | Installed but unused in MVP |
| `OTP_GRAPHQL_URL` | `http://localhost:8080/otp/…` | OpenTripPlanner endpoint (plan router, currently commented out) |
