import type { JobTypeId, MaterialId, PrinterModelId } from '../data';

export type PrinterStatus = 'idle' | 'printing' | 'done' | 'failed';
export type FailReason = 'random' | 'breakdown';

/** A job waiting on the board. */
export interface BoardJob {
  id: number;
  typeId: JobTypeId;
  customer: string;
  /** Final payout, already including reputation and variance. */
  payout: number;
  /** Game clock (seconds) at which this job leaves the board. */
  expiresAt: number;
}

/** The job currently on a printer, plus progress of the current attempt. */
export interface PrintState {
  job: BoardJob;
  /** Real seconds this attempt takes in total. */
  duration: number;
  /** Real seconds of this attempt already printed. */
  elapsed: number;
  /** Elapsed seconds at which a random failure hits, or null if this attempt will succeed. */
  failAt: number | null;
  failReason: FailReason | null;
  attempts: number;
}

export interface PrinterState {
  id: number;
  modelId: PrinterModelId;
  status: PrinterStatus;
  /** 0–100. */
  wear: number;
  print: PrintState | null;
  /** Seconds of maintenance/repair left. While > 0 the printer cannot start or retry. */
  serviceRemaining: number;
  serviceKind: 'maintenance' | 'repair' | null;
}

export interface JobTypeStats {
  completed: number;
  failures: number;
  revenue: number;
  filamentCost: number;
  electricity: number;
}

export interface Stats {
  jobsDone: number;
  /** Prints that reached "done" (including ones not yet collected). */
  printsFinished: number;
  printFailures: number;
  refunds: number;
  earned: number;
  spentFilament: number;
  spentPrinters: number;
  spentService: number;
  spentElectricity: number;
  byJob: Record<string, JobTypeStats>;
}

export interface GameState {
  /** Seconds of simulated game time since the save started. */
  clock: number;
  /** Seeded RNG state (mulberry32). */
  rng: number;
  nextId: number;
  tier: number;
  cash: number;
  /** 0–5 stars (fractional). */
  reputation: number;
  filamentKg: Record<MaterialId, number>;
  printers: PrinterState[];
  board: BoardJob[];
  /** Seconds until the next board job may appear. */
  spawnTimer: number;
  stats: Stats;
}

export type ActionResult = { ok: true; amount?: number } | { ok: false; reason: string };
export const OK: ActionResult = { ok: true };
export const fail = (reason: string): ActionResult => ({ ok: false, reason });
