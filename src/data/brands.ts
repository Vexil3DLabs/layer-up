/** Fictional brands only (GAME_DESIGN §5). Names were checked against known real brands. */
export type PrinterBrandId = 'sproutline' | 'kestrel' | 'arcwell' | 'monolith';

export interface PrinterBrand {
  id: PrinterBrandId;
  name: string;
  tagline: string;
  /** Accent colour used for the printer silhouette and brand pill. */
  accent: string;
}

export const PRINTER_BRANDS: Record<PrinterBrandId, PrinterBrand> = {
  sproutline: {
    id: 'sproutline',
    name: 'Sproutline',
    tagline: 'Budget starters. Cheap, slow, temperamental.',
    accent: '#3ecf8e',
  },
  kestrel: {
    id: 'kestrel',
    name: 'Kestrel Works',
    tagline: 'Fast prosumer machines.',
    accent: '#f5a524',
  },
  arcwell: {
    id: 'arcwell',
    name: 'Arcwell',
    tagline: 'Enclosed engineering printers.',
    accent: '#5b8def',
  },
  monolith: {
    id: 'monolith',
    name: 'Monolith Systems',
    tagline: 'Commercial large-format.',
    accent: '#b07cff',
  },
};
