## Milestone 1 — Vertical slice (Garage, one printer) — 2026-11-08
Status: done

Built:
- Vite + React + TypeScript (strict) + Zustand + Vitest, folder layout per `CLAUDE.md`.
- Pure TypeScript engine in `/src/engine` (no React): `tick(state, dt)`, seeded RNG, job/print/failure/wear/maintenance logic, shop actions.
- All tunables in `/src/data` (printers Nib + Nib Plus, PLA, the two Tier 1 jobs, Garage with 2 slots, time scale, wear, reputation, job board).
- Start: $250, 1× Nib, 1 kg PLA, 2★.
- Job Board with 3–5 jobs that expire and refresh over time.
- Assign job → printer prints with a progress bar → Collect → cash + reputation.
- Failures follow `(baseFail + materialMod) × (1 + wear/50)`; rolled per attempt, filament used up to the failure point is lost. Retry (more filament + time) or Refund (−0.25★).
- Wear (+1 per print hour), Maintenance (2% of price, resets wear), Repair at 100 wear (10% of price, and the print fails if wear hits 100 mid-print).
- Shop: buy filament (1 kg / 5 kg), buy a second printer (Garage has 2 slots).
- Save/load to `localStorage`, schema version 1, with a migration framework (v1 → v2 is tested in Milestone 2). Autosaves every 5 s and when the app is hidden/closed.
- Offline catch-up: on reopening (or returning to the tab) the elapsed time runs through the same `tick`. Finished prints wait for you; printers never start a new job on their own. Capped at 24 h.
- Floor, Job Board and Shop screens with a bottom tab bar, checked at 390 px and 360 px. Welcome-back banner after being away, plain-English "what to do next" hint on the Floor, and a "Next goal" card.
- Tests: 28 passing (tick, job completion, failure formula + seeded statistics, wear, maintenance, breakdown/repair, shop, save/load round-trip, corrupt/future saves, offline catch-up, 24 h catch-up speed).
- Balance sim (`npm run sim`) built early, with two bots (greedy upgrader, cautious saver).

Sim results (first run, so no "before"):
| Bot | Tier 2 unlock ($1,500 + 50 jobs) | Target | Result |
|---|---|---|---|
| Greedy upgrader (checks in every 4 s) | median 14.3 min (13.3–15.0) | ~20 min (10–30 allowed) | PASS |
| Cautious saver (checks in every 6 s) | median 14.8 min (14.1–15.5) | ~20 min (10–30 allowed) | PASS |

- Tier 2 (Home Workshop) is not built yet. The sim measures how long the bots take to *meet its unlock requirement* inside the Garage. Tiers 3–5 are not built, so there is nothing to measure yet.
- Failure rate: 23.8% of attempts for the greedy bot (it ignores maintenance), 15.6% for the cautious bot (maintains at 35 wear). Maintenance clearly pays off.
- Printer time (greedy): printing 74%, waiting to be collected 24%, maintenance 2%, idle 0%. The bot is always on the screen. Real players will be slower, so ~14 min of bot play should feel like ~20 min for a human. I left it alone until Riaan has played it.
- Profit per job: Keychain batch ≈ $8.2 (≈ $82 per print-minute), Desk organiser ≈ $23 (≈ $77 per print-minute). They are nearly equal per minute, so the small jobs are not a trap and the big ones are not a must.
- Cash curve (median): 5 min ≈ $510 (greedy) / $170 (cautious), 10 min ≈ $1,080 / $800. No explosions. Some flat minutes ("stalls") from buying printers or maintenance.

Test on phone:
1. Open a **new** terminal window (Node.js was installed during this session, so older terminals will not find `npm`).
2. Go to the project and start the dev server:
   ```
   cd "C:\Users\riaan\OneDrive\Vexil 3D Labs\(Vexil 3D Labs)\Business Plan\Claude\layer-up"
   npm run dev -- --host
   ```
3. If Windows asks about the firewall for Node.js, tick **Private networks** and click Allow.
4. Put your phone on the **same Wi-Fi** as this PC. Open the address that says `Network:` in the terminal. This PC's address looked like `http://192.168.68.105:5173`, but use whatever the terminal prints.
5. Play the first 5 minutes without any help from me. Things to try:
   - Jobs tab → tap a job → watch it print on the Floor → Collect.
   - Buy a second printer in the Shop (you can afford a Nib straight away, or save for the Nib Plus).
   - Let a print fail (about 1 in 8) and try Retry and Refund.
   - Watch the Wear bar. Try Maintain before it gets high.
   - Close the browser tab for a few minutes, then reopen it. You should see "Welcome back!" and finished prints waiting.
6. Stop the server with Ctrl+C when done. (The dev server only works while it runs on the PC. A link that works anywhere needs the GitHub repo + Pages step.)

**Link that works anywhere (GitHub Pages): https://vexil3dlabs.github.io/layer-up/** — repo: https://github.com/Vexil3DLabs/layer-up (public). It redeploys automatically on every push to `main` (tests must pass first). Open it on your phone, no Wi-Fi setup needed. The save lives in that browser on that device, so the phone and PC have separate saves.

Needs Riaan:
- Play it and write your feedback in `FEEDBACK.md`, especially: Is the first 5 minutes fun? Is it clear what to do without help?
- Decide whether to put the project on GitHub so I can add a free link that works anywhere (otherwise it is local Wi-Fi only).
- Optional: the project folder lives in OneDrive, and `node_modules` has thousands of small files that OneDrive will try to sync. Consider moving the project outside OneDrive (e.g. `C:\dev\layer-up`). See `DECISIONS.md`.
- Optional: do a quick web search for the fictional brand names (see `DECISIONS.md`). I could only check them against my own knowledge, not the live internet.
