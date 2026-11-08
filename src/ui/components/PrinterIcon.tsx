/** Flat SVG printer silhouette in the brand's accent colour. Nozzle sweeps while printing. */
export function PrinterIcon({ accent, printing }: { accent: string; printing?: boolean }) {
  return (
    <svg viewBox="0 0 64 52" width="56" height="46" role="img" aria-label="Printer" className="printer-icon">
      <rect x="6" y="44" width="52" height="6" rx="2" fill={accent} />
      <rect x="9" y="8" width="5" height="36" rx="1.5" fill={accent} opacity="0.65" />
      <rect x="50" y="8" width="5" height="36" rx="1.5" fill={accent} opacity="0.65" />
      <rect x="9" y="6" width="46" height="5" rx="1.5" fill={accent} />
      <g className={printing ? 'nozzle sweeping' : 'nozzle'}>
        <rect x="26" y="11" width="12" height="9" rx="1.5" fill="#eef1f6" />
        <path d="M30 20h4l-2 5z" fill="#eef1f6" />
      </g>
      <rect x="18" y="38" width="28" height="3" rx="1" fill={accent} opacity="0.9" />
      <rect x="22" y="34.5" width="20" height="3" rx="1" fill="#eef1f6" opacity={printing ? 0.9 : 0.35} />
    </svg>
  );
}
