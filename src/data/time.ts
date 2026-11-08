/** Time scale and loop settings. Tune via the balance sim, not by feel. */
export const TIME = {
  /** Real seconds that one in-game print hour takes (at speed 1.0). */
  SECONDS_PER_PRINT_HOUR: 6,
  /** The engine splits long ticks into steps no bigger than this (seconds). */
  TICK_STEP_MAX: 5,
  /** Offline catch-up never simulates more than this many seconds. */
  OFFLINE_CAP_SECONDS: 24 * 3600,
  /** Only show a "welcome back" summary if away at least this long. */
  AWAY_SUMMARY_MIN_SECONDS: 20,
  /** UI refresh rate for the game loop (ms). Game logic uses measured elapsed time. */
  UI_TICK_MS: 250,
  /** How often the UI autosaves (ms). */
  AUTOSAVE_MS: 5000,
} as const;
