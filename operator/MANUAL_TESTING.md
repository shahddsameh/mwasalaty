# Operator PWA Manual Test Guide

Use this guide after starting the backend and `pnpm --filter operator dev`. Open
`http://localhost:5174` on a camera-capable device on the same network.

## Phase 1 - Setup

1. Run `pnpm --filter operator dev`.
   Expected: Vite serves the operator app on port `5174`.
2. Run `pnpm --filter operator build`.
   Expected: Type-check and production build pass, and `operator/dist/sw.js` is generated.
3. Open the app.
   Expected: Arabic RTL page loads with scanner-profile selection.

## Phase 2 - Foundational

1. With the backend running, open `/`.
   Expected: scanner profiles load from `GET /api/scanner-profiles`.
2. Select `scanner_bus_001` or another profile.
   Expected: the app starts a shift and routes to `/dashboard`.
3. Refresh the browser.
   Expected: the selected profile is restored and guarded pages stay accessible.
4. Stop the backend and reload `/`.
   Expected: if a profile was cached, the picker can still show/select that scanner; otherwise it shows the sign-in error with Retry.

## Phase 3 - US1 Online Ticket Validation

1. Create or book a ticket whose QR payload is `{ ticketId, type: "MWASALATY_MVP_TICKET", signature }`.
   Expected: QR is readable by the operator scanner.
2. Select a matching scanner profile, then scan an unused matching ticket.
   Expected: `/result/valid` shows green "Valid - admit passenger" and returns to scan after a short countdown.
3. Scan the same ticket again.
   Expected: `/result/used` shows amber "Already used" and does not auto-dismiss.
4. Scan a tampered JSON payload or wrong `type`.
   Expected: `/result/invalid` shows red "Invalid - do not admit".
5. Scan a ticket for a different mode/route.
   Expected: `/result/no-match` shows the neutral no-match decision.
6. Scan a ticket with two unused matching legs for the selected profile.
   Expected: `/result/ambiguous` lists candidate legs; selecting one validates it and routes to the valid result.
7. Open `/ticket/<ticketId>`.
   Expected: ticket status and every leg status render with unused/used/refunded tags.

## Phase 4 - US2 Offline and Camera Recovery

1. Deny camera permission and open `/scan`.
   Expected: permission-denied state appears with Try again and Camera Help; no manual ticket lookup appears.
2. Open `/camera-help`.
   Expected: camera enable guidance is available, including while offline.
3. Go offline, then scan a valid-looking ticket QR.
   Expected: `/result/unverified` shows slate "Recorded - not verified"; the scan appears in `/sync` as pending.
4. Reload or close/reopen the installed PWA while offline.
   Expected: the shell opens from cache, restores the last scanner context, and reaches the scanner.
5. Reconnect.
   Expected: the queue sync routine runs. Items reconciled as already-used or invalid are flagged in `/sync`.

## Phase 5 - US3 Shift and Review

1. Scan several tickets with mixed outcomes.
   Expected: `/dashboard` shows updated counts by outcome.
2. Open `/history`.
   Expected: scans appear reverse-chronologically with color-coded outcomes and timestamps.
3. Open `/shift-summary`.
   Expected: totals, route, duration, and End shift are visible.
4. End the shift with pending queue items.
   Expected: a warning is shown, ending is allowed, and `/sync` keeps the pending items after sign-out/reselect.
5. Open `/account`.
   Expected: operator/profile identity, app version, install hint, and sign-out are shown; sign-out never clears the queue.

## Phase 6 - Polish and Cross-Cutting

1. Use the app default Arabic UI.
   Expected: layout is RTL with no clipped text or wrong-side spacing.
2. Compare key screens with glare or bright display.
   Expected: green admit, amber already-used, red reject, neutral no-match, and slate offline are distinguishable at arm's length.
3. Run `pnpm --filter operator test`.
   Expected: outcome mapping, ambiguous-leg selection, queue reconciliation, and i18n coverage tests pass.
4. Measure online scan to settled result.
   Expected: under 3 seconds in good camera/network conditions.
5. Measure offline scan attempt to unverified state.
   Expected: under 2 seconds.
6. Install on Android Chrome, go fully offline, and cold-launch.
   Expected: usable scanner loads under 4 seconds.
7. On a real iOS device, test both installed PWA and Safari tab camera access.
   Expected: if installed PWA camera is blocked, Safari tab remains the documented fallback for this MVP.
