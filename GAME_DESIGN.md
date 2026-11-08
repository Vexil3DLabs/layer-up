# GAME_DESIGN.md — 3D Print Business Sim

**Working title:** Layer Up (placeholder — check it doesn't clash with an existing game before any store listing)
**Platform:** Mobile-first web app (portrait), later wrapped as iOS/Android
**Genre:** Idle / management hybrid
**Session target:** 2–5 minutes, several times a day
**Pitch:** Start in a garage with one cheap printer. Take jobs, fight failed prints, buy better machines, and grow into an industrial print farm running large-format printers on corporate contracts.

---

## 1. Design pillars

1. **Real print-business logic, simplified.** Failed prints, nozzle wear, material choice, slow big jobs, and the jump from hobby jobs to B2B contracts should feel true to anyone who has run printers. This is the game's edge over generic tycoon games.
2. **Every printer is a decision.** Cheap and unreliable vs. expensive and fast vs. big and slow. No printer is strictly better at every price point.
3. **The player's job changes as they grow.** Early: hands-on (start every print, fix every failure). Late: managerial (hire staff, automate, chase contracts). Scaling up should feel like *letting go of the tools*.
4. **Idle-friendly.** Printers keep running while the app is closed. Coming back should always have something to collect.

---

## 2. Core loop (every 30–60 seconds of play)

1. **Check the Job Board** — jobs show: customer, part, material, size class, print hours, payout, deadline.
2. **Assign a job** to an idle printer that can handle the size and material.
3. **Print runs in real time** (scaled — see Time).
4. **Collect** the finished job → cash + reputation. Or deal with a **failed print** (lost filament, lost time, retry or refund).
5. **Spend** — filament, maintenance, new printers, upgrades, staff, moving to a bigger premises.

**Session loop (every visit):** open app → collect offline results → clear failures → restock filament → queue new jobs → buy one upgrade → close.

**Long loop:** reach the next premises tier → unlock new printer class, materials, job types and systems.

---

## 3. Time

- Real-time with offline catch-up. Game state advances by elapsed real time on load.
- `SECONDS_PER_PRINT_HOUR` controls speed (starting value: 6 real seconds per in-game print hour at Tier 1). Tune it via the balance sim, not by feel.
- Real duration = `job.baseHours / printer.speed × SECONDS_PER_PRINT_HOUR`.
- Early jobs finish in seconds to a couple of minutes. Late-game large-format jobs run for real hours, which is what makes offline play matter.
- **Offline rule:** a printer finishes its current job while offline but does **not** start another one unless the player has a queue/automation upgrade or a Technician. This makes staff and automation the scaling mechanic, as in a real print farm.

---

## 4. Premises tiers (progression ladder)

| Tier | Premises | Printer slots | Unlocks | Running costs | Unlock requirement (starting values) |
|---|---|---|---|---|---|
| 1 | Garage | 2 | PLA, small hobby jobs | Electricity only | Start |
| 2 | Home Workshop | 4 | PETG, TPU, online-store orders, maintenance kit upgrades | Electricity | $1,500 cash + 50 jobs done |
| 3 | Rented Unit | 8 | ABS/ASA, enclosed printers, first staff hire, B2B prototype jobs | Rent/day + electricity | $8,000 + 3★ reputation |
| 4 | Print Farm | 24 | Automation (job queue, auto-eject), bulk filament discounts, recurring contracts | Rent/day, wages, electricity | $40,000 + 3.5★ + 5 contracts done |
| 5 | Industrial Facility | 40 + large-format bay | Nylon / carbon-fibre materials, large-format printers, corporate contracts | Rent/day, wages, electricity | $150,000 + 4★ + 20 contracts done |

Pacing targets (the balance sim must check these): Tier 2 in ~20 min of active play, Tier 3 in ~2 hours, Tier 4 in ~1–2 days of normal check-ins, Tier 5 in ~1 week.

---

## 5. Fictional brands

No real brand names anywhere: printers, filament, slicers, marketplaces. **Claude Code must check each name below against real 3D printing brands and replace any that clash**, logging the change in DECISIONS.md.

**Printer brands**
- **Sproutline** — budget entry machines. Cheap, slow, temperamental. The brand every new player starts on.
- **Kestrel Works** — prosumer speed machines. Fast, good value, open frame.
- **Arcwell** — enclosed engineering printers. Handle difficult materials, very reliable, pricey.
- **Monolith Systems** — commercial large-format machines. Huge build volumes, huge prices.

**Filament brands**
- **Spoolhouse** — budget filament. Cheaper, slightly higher failure chance.
- **Prism Polymers** — premium filament. Costs more, lowers failure chance.

**Hidden partner hook:** keep a config flag `partnerBrand: null` so a real filament brand could be added later as a sponsor without a refactor. Off by default. Do not build any partner content.

---

## 6. Economy — starting values

All values live in `/src/data/`. These are starting points for the balance sim, not final numbers. Currency is displayed with a configurable symbol (default `$`).

### 6.1 Printers

| Model | Brand | Price | Speed | Size class | Base fail % | Materials | Power $/hr | Tier |
|---|---|---|---|---|---|---|---|---|
| Nib | Sproutline | 200 | 1.0 | S | 12% | PLA | 0.02 | 1 |
| Nib Plus | Sproutline | 350 | 1.3 | M | 9% | PLA, PETG | 0.03 | 1 |
| K2 | Kestrel Works | 600 | 2.5 | M | 6% | PLA, PETG, TPU | 0.04 | 2 |
| K2 Max | Kestrel Works | 900 | 2.5 | L | 5% | PLA, PETG, TPU | 0.06 | 2 |
| Vault | Arcwell | 1,800 | 2.8 | M | 4% | + ABS, ASA, Nylon | 0.08 | 3 |
| Vault Pro | Arcwell | 3,500 | 3.2 | L | 3% | + CF-Nylon, multi-material | 0.10 | 4 |
| M1 | Monolith Systems | 12,000 | 2.0 | XL | 5% | PLA, PETG, ABS, ASA | 0.60 | 5 |
| M3 | Monolith Systems | 45,000 | 3.0 | XXL | 2% | All | 1.50 | 5 |

A printer can take a job if its size class ≥ the job's size class and it supports the material.

### 6.2 Filament (per kg)

| Material | Cost | Fail modifier | Notes |
|---|---|---|---|
| PLA | 18 | +0% | Starter material |
| PETG | 20 | +1% | |
| TPU | 30 | +3% | Flexible, slow (speed ×0.7) |
| ABS | 22 | +4% (+0% if enclosed) | Needs enclosure from Tier 3 |
| ASA | 28 | +3% (+0% if enclosed) | |
| Nylon | 45 | +4% | Enclosed only |
| CF-Nylon | 70 | +3% | Vault Pro / M3 only |

Spoolhouse filament: cost ×0.85, fail +2%. Prism Polymers: cost ×1.25, fail −2%.

### 6.3 Job types

| Job | Size | Material | Filament kg | Base hours | Base payout | Tier |
|---|---|---|---|---|---|---|
| Keychain batch | S | PLA | 0.05 | 1 | 8 | 1 |
| Desk organiser | S | PLA | 0.15 | 3 | 22 | 1 |
| Replacement part | M | PETG | 0.15 | 3 | 35 | 2 |
| Phone grips | S | TPU | 0.10 | 2 | 28 | 2 |
| Cosplay helmet | L | PLA | 0.90 | 14 | 140 | 2 |
| Engineering prototype | M | ABS/ASA | 0.40 | 8 | 160 | 3 |
| Enclosure batch (B2B) | M | ASA | 1.20 | 20 | 420 | 3 |
| Jigs & fixtures contract | L | CF-Nylon | 3.00 | 36 | 1,200 | 4 |
| Signage / display piece | XL | PETG | 6.00 | 48 | 1,800 | 5 |
| Vehicle body panel | XXL | ASA | 14.00 | 90 | 5,500 | 5 |

**Payout rule:** `payout = basePayout × reputationMultiplier × randomVariance(0.85–1.15)`. Rush jobs (shorter deadline) pay ×1.4. Margin should feel realistic: hobby jobs give high percentage margin but tiny absolute profit; industrial jobs give lower percentage margin but large absolute profit.

### 6.4 Failure and maintenance

- `failChance = (printer.baseFail + material.mod + brand.mod) × (1 + wear / 50)`, reduced by Technician and upgrades.
- Failure is rolled at a random point in the print. Filament used up to that point is lost.
- On failure the player can retry (uses more filament and time) or refund (reputation hit).
- **Wear** goes up 1 point per print hour (0–100). **Maintenance** resets wear: costs 2% of the printer's price and takes the printer offline for a short time. At 100 wear the printer needs a repair (10% of price).

### 6.5 Reputation

- 0–5 stars, starting at 2★.
- On-time delivery and quality raise it; late delivery, refunds and cancellations lower it.
- Reputation scales payouts (×0.8 at 1★ → ×1.3 at 5★) and unlocks better jobs and contracts.

### 6.6 Running costs

- Electricity: per printer per print hour (table above).
- Rent: Tier 3 $40/day, Tier 4 $180/day, Tier 5 $600/day. Charged in game time.
- Wages: per staff member per day (see Staff).
- If cash goes negative: no new purchases, warning banner. No game over. Bankruptcy isn't fun on mobile.

---

## 7. Staff (Tier 3+)

| Role | Wage/day | Effect |
|---|---|---|
| Technician | 60 | Auto-starts queued jobs on up to 6 printers; −20% fail chance; auto-maintains at 70 wear |
| Sales Rep | 80 | Better job board (+1 job slot, +10% payouts), brings recurring contracts |
| Designer | 100 | Unlocks "custom design" jobs (×2 payout, longer lead time) |
| Floor Manager | 150 | Tier 4+. Technicians cover 12 printers each |

---

## 8. Contracts (Tier 3+)

Multi-part orders from businesses: e.g. "40 enclosures over 5 days." They pay a large lump sum on completion, with a penalty for missing the deadline. Recurring contracts (Tier 4+) refresh weekly while reputation stays above a threshold. Contracts are what drive the jump from workshop to print farm.

---

## 9. Random events (light touch, max one per session)

- **Grid outage** — all printers pause for a period. Unlocks a backup power upgrade (inverter/battery). A subtle nod to South African load shedding that works for any player.
- **Filament sale** — 30% off one material for a limited time.
- **Viral order** — a product goes viral; a burst of small high-paying jobs.
- **Clogged nozzle** — one printer gets +50 wear instantly.
- **Big client enquiry** — an above-tier contract offer with a tight deadline.

---

## 10. Screens

1. **Floor** (home) — premises view with printer cards: status, progress bar, collect/fix buttons.
2. **Job Board** — available jobs; tap to assign.
3. **Shop** — printers, filament, upgrades.
4. **Team** (Tier 3+) — hire and manage staff.
5. **Business** — cash, income/expenses, reputation, premises upgrade button.

Navigation is a bottom tab bar. Portrait only. Everything reachable with one thumb.

---

## 11. Art and audio direction

- Clean flat vector style, built from code (SVG/CSS). No copyrighted assets, no stock images.
- Each printer brand has a recognisable silhouette and accent colour.
- Satisfying feedback: progress bars, a coin "pop" on collect, a distinct failure sound.
- Audio is added in Milestone 4 and can be toggled off.

---

## 12. Out of scope (until the kill test passes)

Multiplayer, accounts, cloud save, monetisation code, ads, app store builds, localisation, 3D graphics.
