import { JOB_TYPES, MATERIALS, PRINTERS, PRINTER_MODEL_IDS, type PrinterModelId } from '../src/data';
import {
  assignJob,
  assignBlockReason,
  buyFilament,
  buyPrinter,
  buyPrinterBlockReason,
  collectAll,
  printSeconds,
  refundJob,
  retryJob,
  servicePrinter,
  type GameState,
} from '../src/engine';

/** A bot is a play style. It "checks in" every `checkInSeconds` of simulated time. */
export interface Bot {
  name: string;
  /** How often the simulated player taps the screen (active play). */
  checkInSeconds: number;
  /** Cash the bot refuses to spend below when buying printers. */
  reserveCash: number;
  /** Service a printer when its wear reaches this (100 = only repair after a breakdown). */
  serviceAtWear: number;
  /** Which printer the bot will buy next, or null if it is not saving for one. */
  nextPrinter(state: GameState): PrinterModelId | null;
}

/** Buys the best printer it can afford, immediately; ignores maintenance until things break. */
export const greedyUpgrader: Bot = {
  name: 'greedy upgrader',
  checkInSeconds: 4,
  reserveCash: 0,
  serviceAtWear: 100,
  nextPrinter(state) {
    const options = PRINTER_MODEL_IDS.filter((id) => buyPrinterBlockReason(state, id) === null);
    if (options.length === 0) return null;
    return options.sort((a, b) => PRINTERS[b].price - PRINTERS[a].price)[0]!;
  },
};

/** Keeps a cash buffer, services printers early, and saves for the better printer. */
export const cautiousSaver: Bot = {
  name: 'cautious saver',
  checkInSeconds: 6,
  reserveCash: 60,
  serviceAtWear: 35,
  nextPrinter(state) {
    const target: PrinterModelId = 'nibPlus';
    if (state.cash < PRINTERS[target].price + this.reserveCash) return null;
    return buyPrinterBlockReason(state, target) === null ? target : null;
  },
};

export const BOTS: Bot[] = [greedyUpgrader, cautiousSaver];

/** One "check-in": do everything a sensible player would do on the Floor, Jobs and Shop screens. */
export function playCheckIn(state: GameState, bot: Bot): void {
  collectAll(state);

  for (const p of state.printers) {
    if (p.status === 'failed') {
      if (retryJob(state, p.id).ok) continue;
      if (p.wear >= 100 && servicePrinter(state, p.id).ok) continue;
      // Not enough filament: top up first, then retry; otherwise refund.
      topUpFilament(state, bot);
      if (!retryJob(state, p.id).ok && p.serviceRemaining === 0) refundJob(state, p.id);
    }
  }

  for (const p of state.printers) {
    if (p.status === 'idle' && p.serviceRemaining === 0 && p.wear >= bot.serviceAtWear) {
      servicePrinter(state, p.id);
    }
  }

  const next = bot.nextPrinter(state);
  if (next) buyPrinter(state, next);

  topUpFilament(state, bot);

  // Assign the most profitable job per second to each free printer.
  for (const p of state.printers) {
    if (p.status !== 'idle') continue;
    let best: { id: number; score: number } | null = null;
    for (const job of state.board) {
      if (assignBlockReason(state, job, p) !== null) continue;
      const type = JOB_TYPES[job.typeId];
      const profit = job.payout - type.kg * MATERIALS[type.material].costPerKg;
      const score = profit / printSeconds(type, PRINTERS[p.modelId]);
      if (!best || score > best.score) best = { id: job.id, score };
    }
    if (best) assignJob(state, best.id, p.id);
  }
}

function topUpFilament(state: GameState, bot: Bot): void {
  const want = 0.5 * state.printers.length + 0.1;
  if (state.filamentKg.pla >= want) return;
  const price = MATERIALS.pla.costPerKg;
  if (state.cash >= price * 5 + bot.reserveCash) buyFilament(state, 'pla', 5);
  else if (state.cash >= price) buyFilament(state, 'pla', 1);
}
