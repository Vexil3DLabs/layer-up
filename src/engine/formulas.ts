import {
  JOB_TYPES,
  MAINTENANCE,
  MATERIALS,
  PRINTERS,
  REPUTATION,
  SIZE_RANK,
  TIME,
  WEAR,
  type JobType,
  type MaterialDef,
  type PrinterModel,
} from '../data';
import type { PrinterState } from './types';

export const modelOf = (p: PrinterState): PrinterModel => PRINTERS[p.modelId];

/** failChance = (printer.baseFail + material.mod) × (1 + wear / 50). Capped at 95%. */
export function failChance(model: PrinterModel, material: MaterialDef, wear: number): number {
  const base = model.baseFail + material.failMod;
  return Math.min(0.95, Math.max(0, base * (1 + wear / WEAR.FAIL_DIVISOR)));
}

/** Real seconds a job takes on a printer. */
export function printSeconds(job: JobType, model: PrinterModel): number {
  const material = MATERIALS[job.material];
  return (job.baseHours / (model.speed * material.speedMult)) * TIME.SECONDS_PER_PRINT_HOUR;
}

/** A printer can take a job if its size class ≥ the job's and it supports the material. */
export function canHandle(model: PrinterModel, job: JobType): boolean {
  return SIZE_RANK[model.size] >= SIZE_RANK[job.size] && model.materials.includes(job.material);
}

/** Reputation → payout multiplier: ×0.8 at 1★ to ×1.3 at 5★, clamped. */
export function reputationMultiplier(reputation: number): number {
  const t = Math.min(1, Math.max(0, (reputation - 1) / 4));
  return REPUTATION.MULT_AT_1_STAR + t * (REPUTATION.MULT_AT_5_STARS - REPUTATION.MULT_AT_1_STAR);
}

export const clampReputation = (r: number): number =>
  Math.min(REPUTATION.MAX, Math.max(REPUTATION.MIN, r));

/** Wear points gained per real second of printing. */
export const wearPerSecond = (): number => WEAR.PER_PRINT_HOUR / TIME.SECONDS_PER_PRINT_HOUR;

export function serviceCost(p: PrinterState): number {
  const price = modelOf(p).price;
  return round2(price * (p.wear >= WEAR.MAX ? MAINTENANCE.REPAIR_COST_FRACTION : MAINTENANCE.COST_FRACTION));
}

export const serviceKindFor = (p: PrinterState): 'maintenance' | 'repair' =>
  p.wear >= WEAR.MAX ? 'repair' : 'maintenance';

export const jobType = (typeId: keyof typeof JOB_TYPES): JobType => JOB_TYPES[typeId];

export const round2 = (n: number): number => Math.round(n * 100) / 100;
