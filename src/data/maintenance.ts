/** Wear, failure and maintenance tunables (GAME_DESIGN §6.4). */
export const WEAR = {
  /** Wear points gained per print hour (a print hour = SECONDS_PER_PRINT_HOUR real seconds). */
  PER_PRINT_HOUR: 1,
  MAX: 100,
  /** failChance multiplier is (1 + wear / FAIL_DIVISOR). */
  FAIL_DIVISOR: 50,
  /** Wear level where the UI starts nagging the player. */
  WARN_AT: 60,
} as const;

export const FAILURE = {
  /** A random failure happens between these fractions of the print. */
  POINT_MIN: 0.1,
  POINT_MAX: 0.9,
} as const;

export const MAINTENANCE = {
  /** Routine maintenance: fraction of printer price, resets wear to 0. */
  COST_FRACTION: 0.02,
  SECONDS: 10,
  /** Repair (required at 100 wear): fraction of printer price. */
  REPAIR_COST_FRACTION: 0.1,
  REPAIR_SECONDS: 20,
} as const;
