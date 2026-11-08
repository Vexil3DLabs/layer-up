export interface PremisesTier {
  tier: number;
  name: string;
  printerSlots: number;
  /** Unlock requirement to move INTO this tier (starting values, GAME_DESIGN §4). */
  requirement: { cash: number; jobsDone: number; reputation?: number };
  /** Rent per in-game day. */
  rentPerDay: number;
}

/** Milestone 1 only has the Garage. Later tiers are added in Milestones 2–3. */
export const TIERS: PremisesTier[] = [
  {
    tier: 1,
    name: 'Garage',
    printerSlots: 2,
    requirement: { cash: 0, jobsDone: 0 },
    rentPerDay: 0,
  },
];

/**
 * The next tier is not built yet, but the sim measures how long the player takes to meet its
 * unlock requirement (GAME_DESIGN §4: Home Workshop = $1,500 cash + 50 jobs, target ~20 min).
 */
export const NEXT_TIER_PREVIEW = {
  name: 'Home Workshop',
  requirement: { cash: 1500, jobsDone: 50 },
  targetMinutes: 20,
} as const;

export const STARTING_TIER = 1;
export const tierDef = (tier: number): PremisesTier =>
  TIERS.find((t) => t.tier === tier) ?? TIERS[0]!;
