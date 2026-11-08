/** Starting state, reputation and payout rules. All values are starting points for the sim. */
export const CONFIG = {
  currencySymbol: '$',
  /** Hidden sponsor hook (GAME_DESIGN §5). Off by default. No partner content is built. */
  partnerBrand: null as string | null,
} as const;

export const START = {
  cash: 250,
  reputation: 2,
  printers: ['nib'] as const,
  filamentKg: { pla: 1 },
} as const;

export const REPUTATION = {
  MIN: 0,
  MAX: 5,
  /** Payout multiplier at 1 star and at 5 stars; linear in between, clamped. */
  MULT_AT_1_STAR: 0.8,
  MULT_AT_5_STARS: 1.3,
  GAIN_ON_COLLECT: 0.04,
  LOSS_ON_REFUND: 0.25,
} as const;

export const PAYOUT = {
  VARIANCE_MIN: 0.85,
  VARIANCE_MAX: 1.15,
} as const;

export const JOB_BOARD = {
  MIN_JOBS: 3,
  MAX_JOBS: 5,
  INITIAL_JOBS: 4,
  /** Seconds between new jobs appearing (when the board is not full). */
  SPAWN_INTERVAL: 8,
  /** How long a job stays on the board (seconds), random in this range. */
  LIFETIME_MIN: 70,
  LIFETIME_MAX: 130,
} as const;

export const CUSTOMERS = [
  'Mia',
  'Jonas',
  'Corner Café',
  'Hillside School',
  'Tomas',
  'Priya',
  'Riverside Market',
  'Ayesha',
  'Dan the Cyclist',
  'Board Game Club',
] as const;

/** Filament pack sizes offered in the Shop (kg). */
export const FILAMENT_PACKS = [1, 5] as const;
