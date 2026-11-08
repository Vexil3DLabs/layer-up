/** Seeded RNG (mulberry32). State lives in GameState.rng so runs are reproducible. */

import type { GameState } from './types';

/** Next float in [0, 1). Mutates state.rng. */
export function rand(state: { rng: number }): number {
  state.rng = (state.rng + 0x6d2b79f5) >>> 0;
  let t = state.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export const randRange = (state: GameState, min: number, max: number): number =>
  min + (max - min) * rand(state);

export function pickWeighted<T>(state: GameState, items: T[], weight: (item: T) => number): T {
  const total = items.reduce((sum, it) => sum + weight(it), 0);
  let roll = rand(state) * total;
  for (const it of items) {
    roll -= weight(it);
    if (roll < 0) return it;
  }
  return items[items.length - 1]!;
}
