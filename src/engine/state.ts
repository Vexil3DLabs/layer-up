import {
  JOB_BOARD,
  JOB_TYPES,
  JOB_TYPE_IDS,
  CUSTOMERS,
  MATERIAL_IDS,
  PAYOUT,
  START,
  STARTING_TIER,
  type MaterialId,
  type PrinterModelId,
} from '../data';
import { pickWeighted, rand, randRange } from './rng';
import { reputationMultiplier, round2 } from './formulas';
import type { BoardJob, GameState, JobTypeStats, PrinterState, Stats } from './types';

export function newPrinter(state: GameState, modelId: PrinterModelId): PrinterState {
  return {
    id: state.nextId++,
    modelId,
    status: 'idle',
    wear: 0,
    print: null,
    serviceRemaining: 0,
    serviceKind: null,
  };
}

export function emptyJobStats(): JobTypeStats {
  return { completed: 0, failures: 0, revenue: 0, filamentCost: 0, electricity: 0 };
}

function emptyStats(): Stats {
  return {
    jobsDone: 0,
    printsFinished: 0,
    printFailures: 0,
    refunds: 0,
    earned: 0,
    spentFilament: 0,
    spentPrinters: 0,
    spentService: 0,
    spentElectricity: 0,
    byJob: {},
  };
}

/** Stats bucket for a job type, created on demand. */
export function jobStats(state: GameState, typeId: string): JobTypeStats {
  return (state.stats.byJob[typeId] ??= emptyJobStats());
}

/** Create a new job and add it to the board. Uses the seeded RNG. */
export function spawnJob(state: GameState): BoardJob {
  const types = JOB_TYPE_IDS.map((id) => JOB_TYPES[id]).filter((t) => t.tier <= state.tier);
  const type = pickWeighted(state, types, (t) => t.weight);
  const variance = randRange(state, PAYOUT.VARIANCE_MIN, PAYOUT.VARIANCE_MAX);
  const customer = CUSTOMERS[Math.floor(rand(state) * CUSTOMERS.length)]!;
  const job: BoardJob = {
    id: state.nextId++,
    typeId: type.id,
    customer,
    payout: round2(type.basePayout * reputationMultiplier(state.reputation) * variance),
    expiresAt:
      state.clock + randRange(state, JOB_BOARD.LIFETIME_MIN, JOB_BOARD.LIFETIME_MAX),
  };
  state.board.push(job);
  return job;
}

export function createInitialState(seed = 1): GameState {
  const filamentKg = {} as Record<MaterialId, number>;
  for (const id of MATERIAL_IDS) filamentKg[id] = 0;
  Object.assign(filamentKg, START.filamentKg);

  const state: GameState = {
    clock: 0,
    rng: seed >>> 0,
    nextId: 1,
    tier: STARTING_TIER,
    cash: START.cash,
    reputation: START.reputation,
    filamentKg,
    printers: [],
    board: [],
    spawnTimer: JOB_BOARD.SPAWN_INTERVAL,
    stats: emptyStats(),
  };
  for (const modelId of START.printers) state.printers.push(newPrinter(state, modelId));
  for (let i = 0; i < JOB_BOARD.INITIAL_JOBS; i++) spawnJob(state);
  return state;
}
