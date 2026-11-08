import { describe, expect, it } from 'vitest';
import {
  assignJob,
  catchUp,
  createInitialState,
  printSeconds,
  tick,
  type BoardJob,
  type GameState,
} from '../src/engine';
import { JOB_TYPES, PRINTERS } from '../src/data';
import {
  loadGame,
  parseSave,
  saveGame,
  SAVE_KEY,
  SAVE_VERSION,
  serialize,
  type StorageLike,
} from '../src/save';
import { migrate } from '../src/save/migrations';

class MemoryStorage implements StorageLike {
  private data = new Map<string, string>();
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}

function startOrganiser(state: GameState): void {
  const job: BoardJob = {
    id: state.nextId++,
    typeId: 'organiser',
    customer: 'Test',
    payout: 22,
    expiresAt: state.clock + 1e6,
  };
  state.board.push(job);
  expect(assignJob(state, job.id, state.printers[0]!.id).ok).toBe(true);
  state.printers[0]!.print!.failAt = null; // force success
}

describe('save / load', () => {
  it('uses schema version 1', () => {
    expect(SAVE_VERSION).toBe(1);
    expect(JSON.parse(serialize(createInitialState(1), 0)).version).toBe(1);
  });

  it('round-trips the full state exactly', () => {
    const s = createInitialState(5);
    startOrganiser(s);
    tick(s, 7);
    const raw = serialize(s, 123456);
    const parsed = parseSave(raw);
    expect(parsed).not.toBeNull();
    expect(parsed!.savedAt).toBe(123456);
    expect(parsed!.game).toEqual(s);
  });

  it('a loaded game continues identically to the original (same RNG state)', () => {
    const a = createInitialState(5);
    startOrganiser(a);
    tick(a, 10);
    const b = parseSave(serialize(a, 0))!.game;
    tick(a, 200);
    tick(b, 200);
    expect(b).toEqual(a);
  });

  it('starts a new game when the save is missing, corrupt or from a future version', () => {
    const storage = new MemoryStorage();
    expect(loadGame(storage, 1000).isNew).toBe(true);

    storage.setItem(SAVE_KEY, '{not json');
    expect(loadGame(storage, 1000).isNew).toBe(true);

    storage.setItem(SAVE_KEY, JSON.stringify({ version: 999, savedAt: 0, game: {} }));
    expect(loadGame(storage, 1000).isNew).toBe(true);
  });

  it('runs registered migrations in order and rejects missing ones', () => {
    const file = { version: 1, savedAt: 0, game: { a: 1 } };
    const registry = {
      1: (g: Record<string, unknown>) => ({ ...g, b: 2 }),
      2: (g: Record<string, unknown>) => ({ ...g, c: 3 }),
    };
    expect(migrate(file, registry, 3)!.game).toEqual({ a: 1, b: 2, c: 3 });
    expect(migrate(file, { 1: registry[1] }, 3)).toBeNull(); // no path 2 → 3
  });
});

describe('offline catch-up', () => {
  it('finished jobs are waiting after 5 minutes away, and no new job is started', () => {
    const storage = new MemoryStorage();
    const s = createInitialState(3);
    startOrganiser(s);
    const savedAt = 1_000_000;
    saveGame(storage, s, savedAt);

    const result = loadGame(storage, savedAt + 5 * 60 * 1000);
    expect(result.isNew).toBe(false);
    const printer = result.game.printers[0]!;
    expect(printer.status).toBe('done');
    expect(result.away!.finished).toBe(1);
    expect(result.away!.seconds).toBeCloseTo(300);
    // The printer does NOT pick up another job on its own.
    expect(printer.print!.job.typeId).toBe('organiser');
    expect(result.game.stats.printsFinished).toBe(1);
  });

  it('offline time passes through the same tick (clock and wear advance)', () => {
    const a = createInitialState(3);
    startOrganiser(a);
    const b = structuredClone(a);
    catchUp(a, 120);
    tick(b, 120);
    expect(a).toEqual(b);
    expect(a.printers[0]!.wear).toBeCloseTo(3);
    expect(printSeconds(JOB_TYPES.organiser, PRINTERS.nib)).toBeCloseTo(18);
  });

  it('caps offline time at 24 hours and handles a clock set in the past', () => {
    const s = createInitialState(3);
    const away = catchUp(s, 10 * 24 * 3600);
    expect(away.seconds).toBe(24 * 3600);
    expect(catchUp(s, -50).seconds).toBe(0);
  });

  it('a 24 h gap catches up quickly', () => {
    const s = createInitialState(3);
    const t0 = performance.now();
    catchUp(s, 24 * 3600);
    expect(performance.now() - t0).toBeLessThan(1000);
  });
});
