# Product

## Register

product

## Users

Everyday public-transport riders in Greater Cairo — commuters, students, and visitors moving across a dense, multi-modal, often confusing network (metro, bus, microbus, walking). They open the app on a phone, frequently on the move, on patchy connectivity, in bright outdoor light, sometimes in a hurry at a stop. Many read Arabic (RTL) first; many switch to English. A second audience is operators/admins who scan tickets and manage routes, stops, users, and support from a desktop dashboard.

The core job: *"Tell me how to get from where I am to where I'm going, right now, in a way I can trust."* Secondary jobs: buy and show a ticket, follow live turn-by-turn guidance, save frequent places, get help.

## Product Purpose

Mwasalaty is a Cairo public-transport journey planner and ticketing PWA. It plans multi-modal routes, sells and validates QR tickets, offers an AI trip-planning assistant, works offline for cached routes/tickets, and gives operators an admin/scanner toolset. Success = a rider trusts the route it gives them, gets there faster than guessing, and can pay and board without friction — even on a weak connection.

## Brand Personality

**Trustworthy, fast, local.** Calm, confident, practical — an everyday utility that clearly *knows Cairo*. Voice is plain and direct, bilingual-native (Arabic and English read as first-class, not translated). It reassures without hand-holding and never wastes the rider's time. Amber-gold primary signals energy and wayfinding; deep navy signals dependability.

## Anti-references

- **Generic SaaS dashboard** — no gradient-heavy hero-metric landing, no endless identical icon+heading+text card grids, no startup-template gloss.
- **Cluttered government transit portal** — not dense, bureaucratic, or hard to scan; hierarchy and breathing room matter.
- **Childish / over-illustrated** — no cartoon mascots, playful blobs, or toy-like UI; it's a real utility people depend on.
- **Cold enterprise gray** — not lifeless all-gray corporate; warmth comes from the amber accent, transport-mode color coding, and confident type.

## Design Principles

1. **Trust is the product.** Every route, time, and price should read as reliable. Clear states (loading, empty, error, offline) and honest, specific copy beat decoration.
2. **Built for the stop, not the desk.** Mobile-first, thumb-reachable, legible in sunlight, resilient on bad connections and offline. Performance is a feature.
3. **Bilingual as a first-class citizen.** Arabic (RTL) and English (LTR) are equals — layout, typography, and iconography must hold up in both directions.
4. **Color carries meaning, not mood.** Transport modes, place types, and states have a consistent color vocabulary; the rider learns it once and reads the network faster.
5. **Earned familiarity.** Use standard, trusted patterns for standard tasks; spend novelty only where it genuinely speeds the rider up.

## Accessibility & Inclusion

Target WCAG 2.1 AA. Body text ≥4.5:1, large/UI text ≥3:1 in both light and dark themes. Full RTL/LTR support. Honor `prefers-reduced-motion` and `prefers-color-scheme`. Touch targets ≥44px. Don't rely on color alone for transport-mode/state meaning (pair with icon/label). High legibility outdoors (sufficient contrast, no thin light-gray-on-tint body text).
