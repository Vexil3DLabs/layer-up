/**
 * Save schema versioning. Bump SAVE_VERSION whenever the shape of GameState changes and add a
 * migration for the old version here, so old saves never break.
 *
 * migrations[n] converts a save of version n into version n + 1 (operating on the raw `game` object).
 */
export const SAVE_VERSION = 1;

export type Migration = (game: Record<string, unknown>) => Record<string, unknown>;

export const migrations: Record<number, Migration> = {
  // 1: (game) => ({ ...game, newField: 0 }),   // example: v1 → v2 (added in Milestone 2)
};

export interface SaveFile {
  version: number;
  /** Wall-clock time (ms since epoch) when the save was written. */
  savedAt: number;
  game: Record<string, unknown>;
}

/** Run migrations until the save is at SAVE_VERSION. Returns null if it cannot be migrated. */
export function migrate(
  file: SaveFile,
  registry: Record<number, Migration> = migrations,
  target: number = SAVE_VERSION,
): SaveFile | null {
  let { version, game } = file;
  if (!Number.isInteger(version) || version < 1 || version > target) return null;
  while (version < target) {
    const step = registry[version];
    if (!step) return null;
    game = step(game);
    version += 1;
  }
  return { ...file, version, game };
}
