/**
 * Balance simulator: `npm run sim`
 * Runs the real engine headless with bot strategies and compares pacing against GAME_DESIGN §4.
 * Exits with an error if a tier target is missed by more than 50% either way.
 */
import { JOB_TYPES, JOB_TYPE_IDS, NEXT_TIER_PREVIEW, TIME } from '../src/data';
import { createInitialState, tick, type GameState } from '../src/engine';
import { BOTS, playCheckIn, type Bot } from './bots';

const SEEDS = 15;
const MAX_MINUTES = 60;
const TOLERANCE = 0.5;

interface RunResult {
  /** Seconds until the next-tier unlock requirement was met, or null. */
  reachedAt: number | null;
  /** Seconds until a second printer was bought, or null. */
  secondPrinterAt: number | null;
  minuteCash: number[];
  printerSeconds: { printing: number; service: number; waiting: number; idle: number };
  state: GameState;
}

function runOnce(bot: Bot, seed: number): RunResult {
  const state = createInitialState(seed);
  const req = NEXT_TIER_PREVIEW.requirement;
  const res: RunResult = {
    reachedAt: null,
    secondPrinterAt: null,
    minuteCash: [],
    printerSeconds: { printing: 0, service: 0, waiting: 0, idle: 0 },
    state,
  };
  const totalSeconds = MAX_MINUTES * 60;
  let sinceCheckIn = bot.checkInSeconds; // check in right at the start

  for (let t = 0; t < totalSeconds; t++) {
    if (sinceCheckIn >= bot.checkInSeconds) {
      playCheckIn(state, bot);
      sinceCheckIn = 0;
    }
    tick(state, 1);
    sinceCheckIn += 1;

    for (const p of state.printers) {
      if (p.status === 'printing') res.printerSeconds.printing++;
      else if (p.serviceRemaining > 0) res.printerSeconds.service++;
      else if (p.status === 'done' || p.status === 'failed') res.printerSeconds.waiting++;
      else res.printerSeconds.idle++;
    }
    if (res.secondPrinterAt === null && state.printers.length >= 2) res.secondPrinterAt = t + 1;
    if ((t + 1) % 60 === 0) res.minuteCash.push(state.cash);
    if (state.cash >= req.cash && state.stats.jobsDone >= req.jobsDone) {
      res.reachedAt = t + 1;
      break;
    }
  }
  return res;
}

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const n = s.length;
  if (n === 0) return NaN;
  return n % 2 ? s[(n - 1) / 2]! : (s[n / 2 - 1]! + s[n / 2]!) / 2;
};
const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
const fmtMin = (sec: number | null): string =>
  sec === null || Number.isNaN(sec) ? 'not reached' : `${(sec / 60).toFixed(1)} min`;
const pct = (x: number): string => `${(x * 100).toFixed(1)}%`;
const money = (x: number): string => `$${x.toFixed(2)}`;

let failed = false;
console.log('Layer Up balance sim');
console.log(`${SEEDS} seeds per bot, up to ${MAX_MINUTES} simulated minutes of active play each.\n`);

for (const bot of BOTS) {
  const runs: RunResult[] = [];
  for (let i = 0; i < SEEDS; i++) runs.push(runOnce(bot, 1000 + i));

  const reached = runs.map((r) => r.reachedAt).filter((x): x is number => x !== null);
  const medianReach = reached.length === runs.length ? median(reached) : NaN;

  console.log(`=== ${bot.name} (checks in every ${bot.checkInSeconds}s) ===`);

  // Tier targets
  const targetSec = NEXT_TIER_PREVIEW.targetMinutes * 60;
  const lo = targetSec * (1 - TOLERANCE);
  const hi = targetSec * (1 + TOLERANCE);
  const ok = !Number.isNaN(medianReach) && medianReach >= lo && medianReach <= hi;
  if (!ok) failed = true;
  console.log(
    `Tier 2 (${NEXT_TIER_PREVIEW.name}) requirement ` +
      `($${NEXT_TIER_PREVIEW.requirement.cash} + ${NEXT_TIER_PREVIEW.requirement.jobsDone} jobs): ` +
      `median ${fmtMin(medianReach)} ` +
      `(range ${fmtMin(Math.min(...reached))} – ${fmtMin(Math.max(...reached))}, ${reached.length}/${runs.length} reached) ` +
      `vs target ~${NEXT_TIER_PREVIEW.targetMinutes} min (${(lo / 60).toFixed(0)}–${(hi / 60).toFixed(0)} allowed) -> ${ok ? 'PASS' : 'FAIL'}`,
  );
  console.log('Tiers 3–5: not built yet (Milestone 3).');
  console.log(`Second printer bought at: median ${fmtMin(median(runs.map((r) => r.secondPrinterAt ?? NaN)))}`);

  // Cash curve
  const checkpoints = [5, 10, 15, 20];
  const curve = checkpoints.map((m) => {
    const vals = runs.map((r) => r.minuteCash[m - 1]).filter((v): v is number => v !== undefined);
    return `${m}min ${vals.length ? money(median(vals)) : 'n/a'}`;
  });
  console.log(`Median cash curve: ${curve.join(' | ')}`);
  let stalls = 0;
  let explosions = 0;
  let windows = 0;
  for (const r of runs) {
    const deltas = r.minuteCash.map((c, i) => c - (i === 0 ? 250 : r.minuteCash[i - 1]!));
    const med = median(deltas);
    for (const d of deltas) {
      windows++;
      if (d <= 0) stalls++;
      if (med > 0 && d > 3 * med) explosions++;
    }
  }
  console.log(
    `Cash curve: stalls (minutes with no net gain) ${stalls}/${windows}, explosions (>3× typical minute) ${explosions}/${windows}`,
  );

  // Printer time
  const sum = { printing: 0, service: 0, waiting: 0, idle: 0 };
  for (const r of runs) for (const k of Object.keys(sum) as Array<keyof typeof sum>) sum[k] += r.printerSeconds[k];
  const total = sum.printing + sum.service + sum.waiting + sum.idle;
  console.log(
    `Printer time: printing ${pct(sum.printing / total)}, idle/no job ${pct(sum.idle / total)}, ` +
      `waiting for collect/retry ${pct(sum.waiting / total)}, in maintenance ${pct(sum.service / total)}`,
  );

  // Failures
  const fails = runs.reduce((a, r) => a + r.state.stats.printFailures, 0);
  const finishes = runs.reduce((a, r) => a + r.state.stats.printsFinished, 0);
  const refunds = runs.reduce((a, r) => a + r.state.stats.refunds, 0);
  console.log(`Failure rate: ${pct(fails / Math.max(1, fails + finishes))} of print attempts (${refunds} refunds total)`);

  // Profit per job type
  console.log('Profit per completed job (revenue − filament − power), and per print minute:');
  for (const id of JOB_TYPE_IDS) {
    let completed = 0, revenue = 0, filament = 0, power = 0;
    for (const r of runs) {
      const js = r.state.stats.byJob[id];
      if (!js) continue;
      completed += js.completed;
      revenue += js.revenue;
      filament += js.filamentCost;
      power += js.electricity;
    }
    if (completed === 0) {
      console.log(`  ${JOB_TYPES[id].name.padEnd(16)} (never completed)`);
      continue;
    }
    const profit = (revenue - filament - power) / completed;
    const printMin = (JOB_TYPES[id].baseHours * TIME.SECONDS_PER_PRINT_HOUR) / 60;
    console.log(
      `  ${JOB_TYPES[id].name.padEnd(16)} ${completed} done, ${money(profit)} per job, ~${money(profit / printMin)} per print-minute at speed 1.0`,
    );
  }
  console.log(`Avg jobs completed per run: ${mean(runs.map((r) => r.state.stats.jobsDone)).toFixed(0)}\n`);
}

if (failed) {
  console.error('SIM FAILED: a tier target was missed by more than 50%. Rebalance /src/data.');
  process.exit(1);
}
console.log('SIM PASSED: all tier targets within tolerance.');
