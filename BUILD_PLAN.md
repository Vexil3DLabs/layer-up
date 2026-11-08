# BUILD_PLAN.md — Milestones

Build one milestone per session, in order. A milestone is done only when every checkbox passes, `npm run test` passes, and (from Milestone 2) `npm run sim` passes. Tick the boxes as you go.

Owner time budget: Milestones 1–3 must need no more than ~1 hour of Riaan's time in total. If something would need more of his time, simplify it.

---

## Milestone 1 — Vertical slice (Garage, one printer)

Goal: the smallest version that is a real game. Prove the core loop is fun.

- [x] Project scaffolded per `CLAUDE.md` (Vite, React, TS strict, Zustand, Vitest, folder layout)
- [x] `PROGRESS.md`, `FEEDBACK.md`, `DECISIONS.md` created
- [x] Fictional brand names checked against real brands; any clashes renamed and logged
- [x] `/src/data` holds Tier 1 printers (Nib, Nib Plus), PLA, and the two Tier 1 jobs
- [x] Player starts with $250 cash, 1× Nib, 1 kg PLA, 2★ reputation
- [x] Job Board shows 3–5 jobs that refresh over time
- [x] Assign job → printer prints with a progress bar → Collect → cash + reputation
- [x] Failures happen per the formula; retry or refund works
- [x] Wear and maintenance work
- [x] Buy filament; buy a second printer (2 slots in the Garage)
- [x] Save/load to localStorage with schema version 1
- [x] Offline catch-up: close the app for 5 minutes, reopen, finished jobs are waiting
- [x] Floor, Job Board and Shop screens, bottom tab bar, playable at 390 px
- [x] Engine unit tests: tick, job completion, failure roll, wear, save/load round-trip
- [x] Phone test instructions written in `PROGRESS.md`

**Riaan tests:** Is the first 5 minutes fun? Is it clear what to do without help?

---

## Milestone 2 — Early game (Tiers 1–2) + balance sim

- [ ] Home Workshop tier with unlock requirement and premises upgrade flow
- [ ] PETG and TPU; Spoolhouse vs Prism Polymers filament
- [ ] Kestrel K2 and K2 Max printers; all Tier 2 jobs
- [ ] Rush jobs and deadlines; reputation affects payouts and job quality
- [ ] Business screen: cash, income vs expenses, reputation
- [ ] Balance simulator (`npm run sim`) with two bot strategies, reporting per `CLAUDE.md`
- [ ] Tier 2 reached in ~20 min of simulated active play (± 50%)
- [ ] PWA: installable to home screen, works offline
- [ ] Save migration v1 → v2 tested
- [ ] Light polish: coin pop on collect, clear failure state

**Riaan tests:** Does the jump to the Home Workshop feel like a reward? Any point where he's waiting with nothing to do?

---

## Milestone 3 — Scale-up (Tiers 3–5)

- [ ] Rented Unit, Print Farm and Industrial Facility tiers with rent and unlock requirements
- [ ] ABS, ASA, Nylon, CF-Nylon; enclosure rules
- [ ] Arcwell and Monolith printers, including the large-format bay
- [ ] All remaining job types
- [ ] Team screen; Technician, Sales Rep, Designer, Floor Manager with wages
- [ ] Job queue and auto-start (Technician / automation upgrade); offline rule per `GAME_DESIGN.md` §3
- [ ] Contracts and recurring contracts with deadlines and penalties
- [ ] Random events (max one per session), including grid outage + backup power upgrade
- [ ] Negative-cash handling (warning, no game over)
- [ ] All tier pacing targets pass in the sim
- [ ] Performance check: 40+ printers and long offline gaps (24 h+) catch up in under 1 second

**Riaan tests:** Does the print farm feel different to play than the garage? Is late game too easy or too slow?

### ⛔ Kill test (Riaan, after Milestone 3)

Share the game link with 10 people from the maker community. **If fewer than 3 come back to it unprompted within a week, stop the project.** Record the result in `PROGRESS.md`. Do not start Milestone 4 until Riaan writes "kill test passed" in `FEEDBACK.md`.

---

## Milestone 4 — Polish

- [ ] Consistent visual style: printer silhouettes and brand accent colours, premises backgrounds per tier
- [ ] Sound effects with a mute toggle
- [ ] First-time tutorial (short, skippable, no walls of text)
- [ ] Achievements / milestones list
- [ ] Number formatting for big values (1.2k, 3.4M)
- [ ] Accessibility pass: contrast, text size, no colour-only meaning
- [ ] Final balance pass from sim + Riaan's feedback

---

## Milestone 5 — Ship decision (only after the kill test passes)

Riaan decides the purpose before this milestone starts: standalone paid game, free with ads/IAP, or brand funnel. Do not build monetisation until he has written his choice in `FEEDBACK.md`.

- [ ] Wrap with Capacitor for Android and iOS
- [ ] App icons, splash screen, store screenshots
- [ ] Monetisation per Riaan's decision
- [ ] Privacy policy page
- [ ] Store listing text drafted (title checked for clashes with existing games)
- [ ] Checklist of account/fee steps only Riaan can do (Google Play, Apple Developer)
