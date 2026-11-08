import { JOB_BOARD, JOB_TYPES, MATERIALS, TIME, WEAR } from '../data';
import { jobStats, spawnJob } from './state';
import { modelOf, wearPerSecond } from './formulas';
import type { GameState, PrinterState } from './types';

/**
 * Advance the game by `dtSeconds`. This is the ONLY place time passes.
 * Offline catch-up calls this same function with the elapsed time.
 * Mutates `state` in place (the UI store clones before calling).
 */
export function tick(state: GameState, dtSeconds: number): void {
  let remaining = Math.max(0, dtSeconds);
  while (remaining > 1e-9) {
    const dt = Math.min(remaining, TIME.TICK_STEP_MAX);
    step(state, dt);
    remaining -= dt;
  }
}

function step(state: GameState, dt: number): void {
  state.clock += dt;
  for (const printer of state.printers) {
    if (printer.serviceRemaining > 0) stepService(printer, dt);
    if (printer.status === 'printing') stepPrint(state, printer, dt);
  }
  stepBoard(state, dt);
}

function stepService(printer: PrinterState, dt: number): void {
  printer.serviceRemaining = Math.max(0, printer.serviceRemaining - dt);
  if (printer.serviceRemaining === 0) printer.serviceKind = null;
}

function stepPrint(state: GameState, printer: PrinterState, dt: number): void {
  const print = printer.print;
  if (!print) {
    printer.status = 'idle';
    return;
  }
  const wearRate = wearPerSecond();
  const tDone = print.duration - print.elapsed;
  const tFail = print.failAt === null ? Infinity : print.failAt - print.elapsed;
  const tBreak = (WEAR.MAX - printer.wear) / wearRate;
  const tEnd = Math.min(tDone, tFail, tBreak);

  const adv = Math.max(0, Math.min(dt, tEnd));
  print.elapsed += adv;
  printer.wear = Math.min(WEAR.MAX, printer.wear + adv * wearRate);

  const typeId = print.job.typeId;
  const electricity = (modelOf(printer).powerPerHour * adv) / TIME.SECONDS_PER_PRINT_HOUR;
  state.cash -= electricity;
  state.stats.spentElectricity += electricity;
  jobStats(state, typeId).electricity += electricity;

  if (tEnd > dt) return; // still printing

  const type = JOB_TYPES[typeId];
  const material = MATERIALS[type.material];

  if (tEnd === tFail || tEnd === tBreak) {
    // Failure: filament used up to this point is lost, the rest goes back to stock.
    print.failReason = tEnd === tFail ? 'random' : 'breakdown';
    if (print.failReason === 'breakdown') printer.wear = WEAR.MAX;
    const usedFraction = Math.min(1, print.elapsed / print.duration);
    const lostKg = type.kg * usedFraction;
    state.filamentKg[type.material] += type.kg - lostKg;
    const lostCost = lostKg * material.costPerKg;
    state.stats.printFailures += 1;
    jobStats(state, typeId).failures += 1;
    jobStats(state, typeId).filamentCost += lostCost;
    printer.status = 'failed';
    return;
  }

  // Success.
  print.elapsed = print.duration;
  printer.status = 'done';
  state.stats.printsFinished += 1;
  jobStats(state, typeId).filamentCost += type.kg * material.costPerKg;
}

function stepBoard(state: GameState, dt: number): void {
  state.board = state.board.filter((j) => j.expiresAt > state.clock);
  while (state.board.length < JOB_BOARD.MIN_JOBS) spawnJob(state);

  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    if (state.board.length < JOB_BOARD.MAX_JOBS) spawnJob(state);
    state.spawnTimer = JOB_BOARD.SPAWN_INTERVAL;
  }
}

export interface AwaySummary {
  seconds: number;
  /** Prints that finished while away. */
  finished: number;
  /** Prints that failed while away. */
  failed: number;
}

/**
 * Offline catch-up: simulate `elapsedSeconds` using the normal tick (capped at 24 h).
 * Printers finish their current job but never start a new one (no queue/automation yet).
 */
export function catchUp(state: GameState, elapsedSeconds: number): AwaySummary {
  const seconds = Math.min(Math.max(0, elapsedSeconds), TIME.OFFLINE_CAP_SECONDS);
  const finished0 = state.stats.printsFinished;
  const failed0 = state.stats.printFailures;
  tick(state, seconds);
  return {
    seconds,
    finished: state.stats.printsFinished - finished0,
    failed: state.stats.printFailures - failed0,
  };
}
