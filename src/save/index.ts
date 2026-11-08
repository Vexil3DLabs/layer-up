import { catchUp, createInitialState, type AwaySummary, type GameState } from '../engine';
import { migrate, SAVE_VERSION, type SaveFile } from './migrations';

export { SAVE_VERSION } from './migrations';
export const SAVE_KEY = 'layerup.save';

/** Minimal storage interface so tests can pass a fake (localStorage satisfies it). */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function serialize(game: GameState, nowMs: number): string {
  const file: SaveFile = {
    version: SAVE_VERSION,
    savedAt: nowMs,
    game: game as unknown as Record<string, unknown>,
  };
  return JSON.stringify(file);
}

/** Parse + migrate + sanity-check a raw save string. Returns null if unusable. */
export function parseSave(raw: string | null): { game: GameState; savedAt: number } | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SaveFile;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.game !== 'object' || !parsed.game) return null;
    const migrated = migrate(parsed);
    if (!migrated) return null;
    const g = migrated.game as unknown as GameState;
    if (!Array.isArray(g.printers) || !Array.isArray(g.board) || typeof g.cash !== 'number') return null;
    const savedAt = typeof migrated.savedAt === 'number' ? migrated.savedAt : 0;
    return { game: g, savedAt };
  } catch {
    return null;
  }
}

export function saveGame(storage: StorageLike, game: GameState, nowMs: number): void {
  try {
    storage.setItem(SAVE_KEY, serialize(game, nowMs));
  } catch {
    // Storage full or blocked (private mode): the game keeps running, just without saving.
  }
}

export function clearSave(storage: StorageLike): void {
  try {
    storage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}

export interface LoadResult {
  game: GameState;
  /** Offline catch-up result, or null for a brand-new game. */
  away: AwaySummary | null;
  isNew: boolean;
}

/** Load the save (or start a new game), then run offline catch-up for the time since it was saved. */
export function loadGame(storage: StorageLike, nowMs: number, seed = nowMs): LoadResult {
  let raw: string | null = null;
  try {
    raw = storage.getItem(SAVE_KEY);
  } catch {
    raw = null;
  }
  const parsed = parseSave(raw);
  if (!parsed) return { game: createInitialState(seed), away: null, isNew: true };
  const elapsed = Math.max(0, (nowMs - parsed.savedAt) / 1000);
  const away = catchUp(parsed.game, elapsed);
  return { game: parsed.game, away, isNew: false };
}
