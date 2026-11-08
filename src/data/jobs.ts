import type { MaterialId } from './materials';
import type { SizeClass } from './printers';

export type JobTypeId = 'keychain' | 'organiser';

export interface JobType {
  id: JobTypeId;
  name: string;
  size: SizeClass;
  material: MaterialId;
  /** Filament needed (kg). */
  kg: number;
  /** Print hours at speed 1.0. */
  baseHours: number;
  basePayout: number;
  tier: number;
  /** Relative chance of appearing on the board. */
  weight: number;
}

export const JOB_TYPES: Record<JobTypeId, JobType> = {
  keychain: {
    id: 'keychain',
    name: 'Keychain batch',
    size: 'S',
    material: 'pla',
    kg: 0.05,
    baseHours: 1,
    basePayout: 8,
    tier: 1,
    weight: 1,
  },
  organiser: {
    id: 'organiser',
    name: 'Desk organiser',
    size: 'S',
    material: 'pla',
    kg: 0.15,
    baseHours: 3,
    basePayout: 22,
    tier: 1,
    weight: 1,
  },
};

export const JOB_TYPE_IDS = Object.keys(JOB_TYPES) as JobTypeId[];
