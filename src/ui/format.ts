import { CONFIG } from '../data';

/** Money: whole numbers from 100 up, cents below that. */
export function money(n: number): string {
  const abs = Math.abs(n);
  const body = abs >= 100 ? Math.round(abs).toLocaleString('en-US') : abs.toFixed(2);
  return `${n < 0 ? '-' : ''}${CONFIG.currencySymbol}${body}`;
}

export function duration(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, '0')}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${String(m % 60).padStart(2, '0')}m`;
}

export const kg = (n: number): string => `${n.toFixed(n < 10 ? 2 : 1)} kg`;
export const percent = (fraction: number): string => `${Math.round(fraction * 100)}%`;
