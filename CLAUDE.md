# CLAUDE.md — How to work on this project

You are building a mobile-first idle/management game. The full design is in `GAME_DESIGN.md`. The milestone plan is in `BUILD_PLAN.md`.

**The owner (Riaan) has very little time.** He is not a game developer. He will start a session, walk away, then play the result on his phone for about 10 minutes. Work autonomously. Do not stop to ask questions unless you are truly blocked. Make a sensible choice instead and log it in `DECISIONS.md`.

---

## Every session, in this order

1. Read `PROGRESS.md`, `FEEDBACK.md` and `DECISIONS.md` (create them if missing).
2. Fix anything raised in `FEEDBACK.md` before starting new milestone work, unless it conflicts with `GAME_DESIGN.md`. If it does, log the conflict in `DECISIONS.md` and leave it for Riaan.
3. Build the next unfinished milestone in `BUILD_PLAN.md`.
4. Run `npm run test` and `npm run sim`. Both must pass.
5. Update `PROGRESS.md` (see template below) and commit with a clear message.
6. End with a short plain-English summary: what changed, what to test on the phone, and anything that needs Riaan's decision.

---

## Tech stack (fixed — do not change without logging why)

- Vite + React + TypeScript (strict mode)
- Zustand for game state
- Vitest for tests
- No backend. Save to `localStorage` with a **versioned save schema** and migration functions, so old saves never break.
- PWA (installable, works offline) from Milestone 2
- Capacitor wrapping happens only in Milestone 5

Do not add other dependencies unless clearly necessary. Log any new dependency in `DECISIONS.md` with the reason.

---

## Architecture rules

- **Game engine is pure TypeScript** in `/src/engine/` with no React imports. The UI and the balance simulator both use the same engine.
- **All tunable numbers live in `/src/data/`** (printers, materials, jobs, tiers, staff, events, time scale). No magic numbers in logic or UI.
- **Time is simulated by `tick(state, dtSeconds)`.** Offline catch-up calls the same logic with the elapsed time (in chunks if needed). Never rely on `setInterval` accuracy for game logic.
- **Randomness uses a seeded RNG** stored in state, so the sim is reproducible and tests are deterministic.
- Folder layout:
  - `/src/engine` — state types, tick, actions, economy formulas
  - `/src/data` — tunables
  - `/src/ui` — React screens and components
  - `/src/save` — persistence and migrations
  - `/sim` — headless balance simulator
  - `/tests` — Vitest tests

---

## Balance simulator (`npm run sim`)

A headless script that runs the engine with bot strategies (at least "greedy upgrader" and "cautious saver") over simulated play, then prints:
- time to reach each premises tier vs. the targets in `GAME_DESIGN.md` §4
- cash curve summary (stalls, explosions)
- % of printer time idle, failure rate, profit per job type

It exits with an error if any tier target is missed by more than 50% either way. When you change balance numbers, rerun the sim and record before/after in `PROGRESS.md`.

---

## Mobile UI rules

- Design for a 390 px wide portrait screen first. It must also work at 360 px.
- Touch targets at least 44 px. Primary actions within thumb reach (lower half of the screen).
- Bottom tab bar navigation. No hover-only interactions.
- Readable at arm's length: body text 16 px minimum.
- Respect safe areas (`env(safe-area-inset-*)`).

---

## Content rules

- **No real brand names**: printers, filament, slicers, marketplaces, companies. Use the fictional brands in `GAME_DESIGN.md` §5. Check them against real 3D printing brands you know of; if one clashes, rename it and log it.
- No copyrighted art, characters, logos, music or fonts that need licences. Draw everything with SVG/CSS; use system fonts or open-licence fonts.
- No monetisation, ads, analytics or tracking code until Milestone 5.

---

## Testing on Riaan's phone

At the end of every milestone, give Riaan the exact steps to play it. Default is local network: run `npm run dev -- --host`, then open the shown network address on a phone on the same Wi-Fi. If Riaan sets up a GitHub repo, add a free static deploy (e.g. GitHub Pages) so he gets a link that works anywhere, and note it in `PROGRESS.md`.

---

## File templates

**PROGRESS.md**
```
## Milestone N — <name> — <date>
Status: done / partial
Built: ...
Sim results: tier times vs targets ...
Test on phone: ...
Needs Riaan: ...
```

**FEEDBACK.md** (Riaan writes here after playing)
```
## After milestone N
- ...
```

**DECISIONS.md**
```
- <date> — <decision> — <reason>
```
