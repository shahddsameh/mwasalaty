# Mwasalaty Operator

Mobile-first PWA for bus and subway operators. It selects a scanner profile, scans the
passenger ticket QR, validates against the existing backend endpoints, and queues scans
captured while offline.

## Run

```bash
pnpm install
pnpm --filter operator dev
pnpm --filter operator test
pnpm --filter operator build
```

The dev server runs on `http://localhost:5174` and proxies `/api` to
`http://localhost:3000`.

## Backend and Tickets

Start the backend from `backend/` first:

```bash
npm install
npm start
```

To get a scannable ticket, either use the passenger frontend booking flow or create a
ticket directly through `POST /api/tickets`. The QR must encode:

```json
{
  "ticketId": "ticket_...",
  "type": "MWASALATY_MVP_TICKET",
  "signature": "..."
}
```

## Camera and iOS

Android Chrome is the primary target. The scanner uses `BarcodeDetector` when available
and falls back to ZXing. On iOS, test both an installed PWA and a normal Safari tab. If
camera access is blocked in the installed PWA on the supported iOS version, use the
Safari tab fallback for this MVP.

## Spec Pointers

- Feature spec: `../specs/001-operator-scanner-pwa/spec.md`
- Implementation plan: `../specs/001-operator-scanner-pwa/plan.md`
- Manual test guide: `./MANUAL_TESTING.md`
