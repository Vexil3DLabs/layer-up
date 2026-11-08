export type MaterialId = 'pla';

export interface MaterialDef {
  id: MaterialId;
  name: string;
  /** Cost per kg. */
  costPerKg: number;
  /** Added to the failure chance (fraction, 0.01 = +1%). */
  failMod: number;
  /** Multiplier on print speed (TPU is slower). */
  speedMult: number;
  tier: number;
}

export const MATERIALS: Record<MaterialId, MaterialDef> = {
  pla: { id: 'pla', name: 'PLA', costPerKg: 18, failMod: 0, speedMult: 1, tier: 1 },
};

export const MATERIAL_IDS = Object.keys(MATERIALS) as MaterialId[];
