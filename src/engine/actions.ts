import {
  FAILURE,
  JOB_TYPES,
  MATERIALS,
  PRINTERS,
  REPUTATION,
  WEAR,
  MAINTENANCE,
  tierDef,
  type MaterialId,
  type PrinterModelId,
} from '../data';
import { rand, randRange } from './rng';
import {
  canHandle,
  clampReputation,
  failChance,
  modelOf,
  printSeconds,
  round2,
  serviceCost,
  serviceKindFor,
} from './formulas';
import { jobStats, newPrinter } from './state';
import { fail, OK, type ActionResult, type BoardJob, type GameState, type PrinterState } from './types';

const findPrinter = (state: GameState, id: number): PrinterState | undefined =>
  state.printers.find((p) => p.id === id);

/** Why a printer cannot start/retry right now, or null if it can. */
export function printerBlockReason(printer: PrinterState): string | null {
  if (printer.serviceRemaining > 0) return 'Printer is being serviced';
  if (printer.wear >= WEAR.MAX) return 'Printer needs a repair first';
  return null;
}

/** Why `printer` cannot take `job` right now, or null if it can. */
export function assignBlockReason(
  state: GameState,
  job: BoardJob,
  printer: PrinterState,
): string | null {
  const type = JOB_TYPES[job.typeId];
  const model = modelOf(printer);
  if (printer.status !== 'idle') return 'Printer is busy';
  const blocked = printerBlockReason(printer);
  if (blocked) return blocked;
  if (!canHandle(model, type)) return `${model.name} cannot print this job`;
  if (state.filamentKg[type.material] < type.kg - 1e-9) {
    return `Need ${type.kg} kg ${MATERIALS[type.material].name} — buy filament in the Shop`;
  }
  return null;
}

/** Idle printers that can take this job right now. */
export function eligiblePrinters(state: GameState, job: BoardJob): PrinterState[] {
  return state.printers.filter((p) => assignBlockReason(state, job, p) === null);
}

/** Start (or restart) an attempt: uses filament, rolls whether this attempt will fail. */
function beginAttempt(state: GameState, printer: PrinterState, job: BoardJob, attempts: number): void {
  const type = JOB_TYPES[job.typeId];
  const material = MATERIALS[type.material];
  const model = modelOf(printer);
  const duration = printSeconds(type, model);

  state.filamentKg[type.material] -= type.kg;
  const willFail = rand(state) < failChance(model, material, printer.wear);
  const failAt = willFail ? duration * randRange(state, FAILURE.POINT_MIN, FAILURE.POINT_MAX) : null;

  printer.print = { job, duration, elapsed: 0, failAt, failReason: null, attempts };
  printer.status = 'printing';
}

export function assignJob(state: GameState, jobId: number, printerId: number): ActionResult {
  const job = state.board.find((j) => j.id === jobId);
  const printer = findPrinter(state, printerId);
  if (!job) return fail('That job is no longer on the board');
  if (!printer) return fail('Printer not found');
  const reason = assignBlockReason(state, job, printer);
  if (reason) return fail(reason);
  state.board = state.board.filter((j) => j.id !== jobId);
  beginAttempt(state, printer, job, 1);
  return OK;
}

/** Collect a finished print: cash + reputation. */
export function collectJob(state: GameState, printerId: number): ActionResult {
  const printer = findPrinter(state, printerId);
  if (!printer || printer.status !== 'done' || !printer.print) return fail('Nothing to collect');
  const { job } = printer.print;
  state.cash += job.payout;
  state.reputation = clampReputation(state.reputation + REPUTATION.GAIN_ON_COLLECT);
  state.stats.jobsDone += 1;
  state.stats.earned += job.payout;
  const js = jobStats(state, job.typeId);
  js.completed += 1;
  js.revenue += job.payout;
  printer.print = null;
  printer.status = 'idle';
  return { ok: true, amount: job.payout };
}

export function collectAll(state: GameState): ActionResult {
  let total = 0;
  for (const p of state.printers) {
    if (p.status === 'done') {
      const r = collectJob(state, p.id);
      if (r.ok) total += r.amount ?? 0;
    }
  }
  return total > 0 ? { ok: true, amount: round2(total) } : fail('Nothing to collect');
}

/** Retry a failed print: uses more filament and time. */
export function retryJob(state: GameState, printerId: number): ActionResult {
  const printer = findPrinter(state, printerId);
  if (!printer || printer.status !== 'failed' || !printer.print) return fail('Nothing to retry');
  const blocked = printerBlockReason(printer);
  if (blocked) return fail(blocked);
  const { job, attempts } = printer.print;
  const type = JOB_TYPES[job.typeId];
  if (state.filamentKg[type.material] < type.kg - 1e-9) {
    return fail(`Need ${type.kg} kg ${MATERIALS[type.material].name} to retry`);
  }
  beginAttempt(state, printer, job, attempts + 1);
  return OK;
}

/** Give up on a failed print: the customer is refunded and reputation drops. */
export function refundJob(state: GameState, printerId: number): ActionResult {
  const printer = findPrinter(state, printerId);
  if (!printer || printer.status !== 'failed') return fail('Nothing to refund');
  state.reputation = clampReputation(state.reputation - REPUTATION.LOSS_ON_REFUND);
  state.stats.refunds += 1;
  printer.print = null;
  printer.status = 'idle';
  return OK;
}

/** Maintenance (resets wear, 2% of price) or repair (at 100 wear, 10% of price). */
export function servicePrinter(state: GameState, printerId: number): ActionResult {
  const printer = findPrinter(state, printerId);
  if (!printer) return fail('Printer not found');
  if (printer.status === 'printing') return fail('Wait for the print to finish');
  if (printer.serviceRemaining > 0) return fail('Already being serviced');
  if (printer.wear < 1) return fail('No wear to fix');
  const cost = serviceCost(printer);
  if (state.cash < cost) return fail('Not enough cash');
  const kind = serviceKindFor(printer);
  state.cash -= cost;
  state.stats.spentService += cost;
  printer.wear = 0;
  printer.serviceKind = kind;
  printer.serviceRemaining = kind === 'repair' ? MAINTENANCE.REPAIR_SECONDS : MAINTENANCE.SECONDS;
  return OK;
}

export function buyFilament(state: GameState, material: MaterialId, kg: number): ActionResult {
  const cost = round2(MATERIALS[material].costPerKg * kg);
  if (state.cash < cost) return fail('Not enough cash');
  state.cash -= cost;
  state.stats.spentFilament += cost;
  state.filamentKg[material] += kg;
  return OK;
}

export function printerSlotsFree(state: GameState): number {
  return tierDef(state.tier).printerSlots - state.printers.length;
}

export function buyPrinterBlockReason(state: GameState, modelId: PrinterModelId): string | null {
  const model = PRINTERS[modelId];
  if (model.tier > state.tier) return 'Not unlocked yet';
  if (printerSlotsFree(state) <= 0) return 'No free printer slot';
  if (state.cash < model.price) return 'Not enough cash';
  return null;
}

export function buyPrinter(state: GameState, modelId: PrinterModelId): ActionResult {
  const reason = buyPrinterBlockReason(state, modelId);
  if (reason) return fail(reason);
  const model = PRINTERS[modelId];
  state.cash -= model.price;
  state.stats.spentPrinters += model.price;
  state.printers.push(newPrinter(state, modelId));
  return OK;
}
