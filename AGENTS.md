# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

Cairo Transit PWA backend — a Node.js/Express REST API that wraps OpenTripPlanner (OTP) GraphQL and returns clean JSON optimised for Vue frontend consumption and IndexedDB storage. OTP itself runs in Docker and is not part of the Node codebase.

## Two Independent Components

```
backend/       Node.js Express API (the code we write)
otp-cairo/     Docker + data files to run OTP (infrastructure only)
```

These run as separate processes. The backend calls OTP over HTTP; they share nothing else.

---

## Backend — Commands

```bash
cd backend

# Install dependencies
npm install

# Development (auto-restarts on file save, Node 18+ built-in)
npm run dev          # node --watch server.js

# Production
npm start            # node server.js

# Test the endpoint manually
curl -s -X POST http://localhost:3000/api/plan \
  -H "Content-Type: application/json" \
  -d '{
    "from": { "lat": 30.06963, "lng": 31.28102, "label": "Abbassiya" },
    "to":   { "lat": 30.07286, "lng": 31.31725, "label": "Stadium" },
    "date": "2025-06-01",
    "time": "05:58:00",
    "preferences": { "modes": ["WALK", "SUBWAY"] }
  }'
```

Environment — `backend/.env`:
```
OTP_GRAPHQL_URL=http://localhost:8080/otp/routers/default/index/graphql
PORT=3000
```

---

## OTP — Commands

```bash
cd otp-cairo

# Start (builds graph on first run, ~2 min; subsequent restarts reuse graph.obj)
docker-compose up -d

# Force a full graph rebuild (after changing GTFS or OSM data)
docker-compose restart

# Watch build progress
docker logs otp-cairo -f

# Confirm OTP is ready
docker logs otp-cairo 2>&1 | grep "Grizzly server running"

# Check how many transit stops are isolated from the walk network
docker logs otp-cairo 2>&1 | grep "isolated"

# Direct OTP GraphQL test (bypasses the backend)
curl -s -X POST http://localhost:8080/otp/routers/default/index/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ plan(from:{lat:30.06963,lon:31.28102} to:{lat:30.07286,lon:31.31725} date:\"2025-06-01\" time:\"05:58:00\" transportModes:[{mode:SUBWAY},{mode:WALK}] numItineraries:3){itineraries{duration legs{mode from{name} to{name} route{shortName}}}}}"}' \
  | python -m json.tool
```

---

## Backend Architecture

```
server.js                       Express entry point, mounts /api router
src/routes/plan.js              POST /api/plan → planHandler
src/controllers/planController.js  Validates body, calls OTP, returns mapped JSON
src/services/otpClient.js       Builds GraphQL query string, calls OTP via fetch
src/mappers/tripMapper.js       Converts OTP response → frontend-ready shape
src/helpers/errors.js           ErrorCodes enum + makeError(code, msg, details)
```

### Request → Response Flow

1. `POST /api/plan` with `{ from, to, date, time, preferences }` hits `planController`
2. Controller validates six required fields; returns `VALIDATION_ERROR` (400) on failure
3. `otpClient.fetchOtpPlan` builds a GraphQL query string (modes are inlined as enum literals, not variables) and POSTs to OTP
4. On success, `tripMapper.mapOtpPlan` transforms the raw OTP response:
   - `planId` = SHA-256 of `from/to/date/time` (stable across identical requests)
   - `itineraryId` = `itin_001`, `itin_002`, …
   - `legId` = `leg_001_001`, `leg_001_002`, …
   - timestamps converted from Unix ms → ISO 8601
   - `duration` (seconds) → `durationMinutes`
   - `summary` built as `"Walk → Metro M3 → Walk"`
   - `transfers` = number of non-WALK legs − 1

### Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | Missing/invalid request fields |
| `OTP_EMPTY_PLAN` | 404 | OTP returned zero itineraries |
| `OTP_SERVICE_UNAVAILABLE` | 503 | OTP unreachable (ECONNREFUSED / 5xx) |
| `OTP_GRAPHQL_ERROR` | 502 | OTP returned GraphQL-level errors |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected exception |

All errors share the shape `{ error: { code, message, details } }`.

### Key Constraints

- `backend/` uses ES modules (`"type": "module"`) — use `import/export`, not `require`.
- `otpClient` uses **Node's built-in `fetch`** (Node 18+). No axios or node-fetch.
- The GraphQL `transportModes` list is built by string interpolation, not GraphQL variables, because OTP enums can't be passed as JSON variable values.

---

## OTP Data & GTFS Pipeline

The GTFS feed is the 2018 TfC Digital Cairo dataset. It required three post-processing steps before OTP can use it; scripts for all three live in `otp-cairo/scripts/`:

| Script | Purpose | Run when |
|--------|---------|----------|
| `fix_gtfs_dates.py` | Patches expired `calendar.txt` service dates to 2025–2030 | Once, after initial GTFS download |
| `add_frequencies.py` | Adds `frequencies.txt` — metro repeats every 5 min, 05:00–24:00 | Once, after date fix |
| `snap_stops_to_streets.py` | Snaps 2018 stop coordinates to nearest walkable OSM node (fixes ~524 isolated stops) | After replacing the OSM file |

Run order: `fix_gtfs_dates.py` → `add_frequencies.py` → `snap_stops_to_streets.py`, then `docker-compose restart`.

`snap_stops_to_streets.py` requires `pip install osmium scipy numpy` (or `py -m pip install ...` on Windows).

### Known Routing Limitation

The 2018 GTFS has only **one scheduled trip per metro line per direction** (departing ~06:00). `frequencies.txt` makes OTP treat each line as running every 5 minutes. Queries must use a date within `2025-01-01`–`2030-12-31` and a time when service is active (05:00–24:00 local Cairo time, `Africa/Cairo`).

### OTP GraphQL Endpoint

`http://localhost:8080/otp/routers/default/index/graphql` (legacy GTFS API, still active in OTP 2.6)

Useful diagnostic queries:
```graphql
# Find stops near a coordinate
{ stopsByRadius(lat: 30.06963, lon: 31.28102, radius: 500) {
    edges { node { stop { gtfsId name lat lon } distance } }
} }

# Check what patterns serve a stop
{ stop(id: "1:161_ABB_METRO_N") {
    name
    patterns { route { shortName mode } name }
} }
```
