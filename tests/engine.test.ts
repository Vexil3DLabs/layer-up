import { describe, expect, it } from 'vitest';
import {
  JOB_BOARD,
  JOB_TYPES,
  MAINTENANCE,
  MATERIALS,
  PRINTERS,
  REPUTATION,
  START,
  TIME,
  WEAR,
} from '../src/data';
import {
  assignJob,
  buyFilament,
  buyPrinter,
  collectJob,
  createInitialState,
  failChance,
  printSeconds,
  refundJob,
  reputationMultiplier,
  retryJob,
  servicePrinter,
  tick,
  type BoardJob,
  type GameState,
} from '../src/engine';

/** Put a known job on the board and return it. */
function addJob(state: GameState, typeId: 'keychain' | 'organiser' = 'keychain', payout = 10): BoardJob {
  const job: BoardJob = {
    id: state.nextId++,
    typeId,
    customer: 'Test',
    payout,
    expiresAt: state.clock + 100000,
  };
  state.board.push(job);
  return job;
}

function startPrint(state: GameState, typeId: 'keychain' | 'organiser' = 'keychain') {
  const job = addJob(state, typeId);
  const printer = state.printers[0]!;
  const res = assignJob(state, job.id, printer.id);
  expect(res.ok).toBe(true);
  return { job, printer };
}

describe('initial state', () => {
  it('matches the Milestone 1 starting values', () => {
    const s = createInitialState(1);
    expect(s.cash).toBe(START.cash);
    expect(s.cash).toBe(250);
    expect(s.reputation).toBe(2);
    expect(s.printers).toHaveLength(1);
    expect(s.printers[0]!.modelId).toBe('nib');
    expect(s.filamentKg.pla).toBe(1);
    expect(s.board.length).toBeGreaterThanOrEqual(JOB_BOARD.MIN_JOBS);
    expect(s.board.length).toBeLessThanOrEqual(JOB_BOARD.MAX_JOBS);
  });
});

describe('tick and job completion', () => {
  it('advances progress and finishes after the scaled duration', () => {
    const s = createInitialState(1);
    const { printer } = startPrint(s);
    printer.print!.failAt = null; // force success
    const duration = printSeconds(JOB_TYPES.keychain, PRINTERS.nib);
    expect(duration).toBeCloseTo(TIME.SECONDS_PER_PRINT_HOUR); // 1 h / speed 1.0

    tick(s, duration / 2);
    expect(printer.status).toBe('printing');
    expect(printer.print!.elapsed).toBeCloseTo(duration / 2);

    tick(s, duration / 2 + 0.01);
    expect(printer.status).toBe('done');
  });

  it('collect pays cash and reputation and frees the printer', () => {
    const s = createInitialState(1);
    const { printer } = startPrint(s);
    printer.print!.failAt = null;
    tick(s, 100);
    const cashBefore = s.cash;
    const repBefore = s.reputation;
    const res = collectJob(s, printer.id);
    expect(res.ok).toBe(true);
    expect(s.cash).toBeCloseTo(cashBefore + 10);
    expect(s.reputation).toBeCloseTo(repBefore + REPUTATION.GAIN_ON_COLLECT);
    expect(printer.status).toBe('idle');
    expect(s.stats.jobsDone).toBe(1);
  });

  it('uses filament up front and refuses to start without enough', () => {
    const s = createInitialState(1);
    s.filamentKg.pla = 0.04;
    const job = addJob(s, 'keychain');
    const res = assignJob(s, job.id, s.printers[0]!.id);
    expect(res.ok).toBe(false);
    s.filamentKg.pla = 0.2;
    expect(assignJob(s, job.id, s.printers[0]!.id).ok).toBe(true);
    expect(s.filamentKg.pla).toBeCloseTo(0.15);
  });

  it('scales payout with reputation (×0.8 at 1★ to ×1.3 at 5★)', () => {
    expect(reputationMultiplier(1)).toBeCloseTo(0.8);
    expect(reputationMultiplier(5)).toBeCloseTo(1.3);
    expect(reputationMultiplier(3)).toBeCloseTo(1.05);
  });

  it('keeps the board between 3 and 5 jobs and refreshes it over time', () => {
    const s = createInitialState(7);
    const initialIds = new Set(s.board.map((j) => j.id));
    for (let i = 0; i < 100; i++) {
      tick(s, 5);
      expect(s.board.length).toBeGreaterThanOrEqual(JOB_BOARD.MIN_JOBS);
      expect(s.board.length).toBeLessThanOrEqual(JOB_BOARD.MAX_JOBS);
    }
    expect(s.board.some((j) => initialIds.has(j.id))).toBe(false);
  });
});

describe('failure roll', () => {
  it('follows (baseFail + materialMod) × (1 + wear/50)', () => {
    const pla = MATERIALS.pla;
    expect(failChance(PRINTERS.nib, pla, 0)).toBeCloseTo(0.12);
    expect(failChance(PRINTERS.nib, pla, 50)).toBeCloseTo(0.24);
    expect(failChance(PRINTERS.nib, pla, 100)).toBeCloseTo(0.36);
    expect(failChance(PRINTERS.nibPlus, pla, 0)).toBeCloseTo(0.09);
  });

  it('fails about 12% of the time on a fresh Nib (seeded, deterministic)', () => {
    const s = createInitialState(42);
    let fails = 0;
    const N = 4000;
    for (let i = 0; i < N; i++) {
      s.filamentKg.pla = 10;
      const p = s.printers[0]!;
      p.wear = 0;
      p.status = 'idle';
      p.print = null;
      const job = addJob(s);
      assignJob(s, job.id, p.id);
      if (p.print!.failAt !== null) fails++;
    }
    expect(fails / N).toBeGreaterThan(0.1);
    expect(fails / N).toBeLessThan(0.14);
  });

  it('is reproducible with the same seed', () => {
    const run = () => {
      const s = createInitialState(99);
      const out: Array<number | null> = [];
      for (let i = 0; i < 20; i++) {
        s.filamentKg.pla = 10;
        const p = s.printers[0]!;
        p.status = 'idle';
        p.print = null;
        const job = addJob(s);
        assignJob(s, job.id, p.id);
        out.push(p.print!.failAt);
      }
      return out;
    };
    expect(run()).toEqual(run());
  });

  it('loses only the filament used so far, then retry costs more filament and time', () => {
    const s = createInitialState(1);
    const { printer } = startPrint(s, 'organiser'); // 0.15 kg
    const duration = printer.print!.duration;
    printer.print!.failAt = duration * 0.5;
    tick(s, duration);
    expect(printer.status).toBe('failed');
    // started with 1.0 kg, lost half of 0.15 kg
    expect(s.filamentKg.pla).toBeCloseTo(1 - 0.075);

    const res = retryJob(s, printer.id);
    expect(res.ok).toBe(true);
    expect(printer.status).toBe('printing');
    expect(printer.print!.attempts).toBe(2);
    expect(printer.print!.elapsed).toBe(0);
    expect(s.filamentKg.pla).toBeCloseTo(1 - 0.075 - 0.15);
  });

  it('refund drops reputation and frees the printer without paying', () => {
    const s = createInitialState(1);
    const { printer } = startPrint(s);
    printer.print!.failAt = 1;
    tick(s, 10);
    expect(printer.status).toBe('failed');
    const cash = s.cash;
    const rep = s.reputation;
    expect(refundJob(s, printer.id).ok).toBe(true);
    expect(printer.status).toBe('idle');
    expect(s.cash).toBe(cash);
    expect(s.reputation).toBeCloseTo(rep - REPUTATION.LOSS_ON_REFUND);
    expect(s.stats.refunds).toBe(1);
  });

  it('cannot retry without enough filament', () => {
    const s = createInitialState(1);
    const { printer } = startPrint(s, 'organiser');
    printer.print!.failAt = 1;
    tick(s, 10);
    s.filamentKg.pla = 0;
    expect(retryJob(s, printer.id).ok).toBe(false);
  });
});

describe('wear and maintenance', () => {
  it('adds 1 wear per print hour', () => {
    const s = createInitialState(1);
    const { printer } = startPrint(s, 'organiser'); // 3 print hours on a Nib
    printer.print!.failAt = null;
    tick(s, 100);
    expect(printer.wear).toBeCloseTo(3 * WEAR.PER_PRINT_HOUR);
  });

  it('maintenance costs 2% of price, resets wear and takes the printer offline briefly', () => {
    const s = createInitialState(1);
    const p = s.printers[0]!;
    p.wear = 40;
    const cash = s.cash;
    expect(servicePrinter(s, p.id).ok).toBe(true);
    expect(s.cash).toBeCloseTo(cash - PRINTERS.nib.price * MAINTENANCE.COST_FRACTION);
    expect(p.wear).toBe(0);
    expect(p.serviceRemaining).toBe(MAINTENANCE.SECONDS);

    const job = addJob(s);
    expect(assignJob(s, job.id, p.id).ok).toBe(false); // offline
    tick(s, MAINTENANCE.SECONDS + 0.1);
    expect(p.serviceRemaining).toBe(0);
    expect(assignJob(s, job.id, p.id).ok).toBe(true);
  });

  it('breaks down at 100 wear, needs a 10% repair, then can retry', () => {
    const s = createInitialState(1);
    const p = s.printers[0]!;
    p.wear = 99.5;
    const { printer } = startPrint(s, 'organiser');
    printer.print!.failAt = null;
    tick(s, 60);
    expect(printer.status).toBe('failed');
    expect(printer.print!.failReason).toBe('breakdown');
    expect(printer.wear).toBe(WEAR.MAX);
    expect(retryJob(s, printer.id).ok).toBe(false); // needs repair

    const cash = s.cash;
    expect(servicePrinter(s, printer.id).ok).toBe(true);
    expect(s.cash).toBeCloseTo(cash - PRINTERS.nib.price * MAINTENANCE.REPAIR_COST_FRACTION);
    expect(printer.serviceKind).toBe('repair');
    tick(s, MAINTENANCE.REPAIR_SECONDS + 0.1);
    expect(retryJob(s, printer.id).ok).toBe(true);
  });

  it('refuses to service a printer that is mid-print', () => {
    const s = createInitialState(1);
    const { printer } = startPrint(s);
    printer.wear = 30;
    expect(servicePrinter(s, printer.id).ok).toBe(false);
  });
});

describe('shop', () => {
  it('buys filament', () => {
    const s = createInitialState(1);
    expect(buyFilament(s, 'pla', 5).ok).toBe(true);
    expect(s.filamentKg.pla).toBe(6);
    expect(s.cash).toBeCloseTo(250 - 5 * MATERIALS.pla.costPerKg);
  });

  it('buys a second printer, then the Garage is full (2 slots)', () => {
    const s = createInitialState(1);
    s.cash = 1000;
    expect(buyPrinter(s, 'nib').ok).toBe(true);
    expect(s.printers).toHaveLength(2);
    expect(s.cash).toBe(800);
    const again = buyPrinter(s, 'nibPlus');
    expect(again.ok).toBe(false);
    expect(s.printers).toHaveLength(2);
  });

  it('blocks purchases without cash (including when cash is negative)', () => {
    const s = createInitialState(1);
    s.cash = 150;
    expect(buyPrinter(s, 'nib').ok).toBe(false);
    s.cash = -5;
    expect(buyFilament(s, 'pla', 1).ok).toBe(false);
  });
});
