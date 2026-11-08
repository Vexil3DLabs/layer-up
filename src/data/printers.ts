import type { MaterialId } from './materials';
import type { PrinterBrandId } from './brands';

export type SizeClass = 'S' | 'M' | 'L' | 'XL' | 'XXL';
export const SIZE_RANK: Record<SizeClass, number> = { S: 1, M: 2, L: 3, XL: 4, XXL: 5 };

export type PrinterModelId = 'nib' | 'nibPlus';

export interface PrinterModel {
  id: PrinterModelId;
  name: string;
  brand: PrinterBrandId;
  price: number;
  /** Print speed multiplier. Duration = job hours / speed. */
  speed: number;
  size: SizeClass;
  /** Base failure chance (fraction). */
  baseFail: number;
  materials: MaterialId[];
  /** Electricity cost per print hour. */
  powerPerHour: number;
  tier: number;
}

export const PRINTERS: Record<PrinterModelId, PrinterModel> = {
  nib: {
    id: 'nib',
    name: 'Nib',
    brand: 'sproutline',
    price: 200,
    speed: 1.0,
    size: 'S',
    baseFail: 0.12,
    materials: ['pla'],
    powerPerHour: 0.02,
    tier: 1,
  },
  nibPlus: {
    id: 'nibPlus',
    name: 'Nib Plus',
    brand: 'sproutline',
    price: 350,
    speed: 1.3,
    size: 'M',
    baseFail: 0.09,
    materials: ['pla'],
    powerPerHour: 0.03,
    tier: 1,
  },
};

export const PRINTER_MODEL_IDS = Object.keys(PRINTERS) as PrinterModelId[];
