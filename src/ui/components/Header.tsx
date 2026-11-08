import { MATERIALS, MATERIAL_IDS, tierDef } from '../../data';
import { kg, money } from '../format';
import { useStore } from '../store';

function Stars({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <span className="stars" aria-label={`Reputation ${value.toFixed(1)} out of 5 stars`}>
      <span className="stars-bg">★★★★★</span>
      <span className="stars-fg" style={{ width: `${pct}%` }}>
        ★★★★★
      </span>
    </span>
  );
}

export function Header() {
  const game = useStore((s) => s.game);
  const tier = tierDef(game.tier);
  return (
    <header className="header">
      <div className="header-top">
        <div>
          <div className="muted small">{tier.name}</div>
          <div className={game.cash < 0 ? 'cash negative' : 'cash'}>{money(game.cash)}</div>
        </div>
        <div className="header-right">
          <div className="rep">
            <Stars value={game.reputation} />
            <span className="small">{game.reputation.toFixed(1)}★</span>
          </div>
          <div className="small muted">
            {MATERIAL_IDS.map((id) => `${MATERIALS[id].name} ${kg(game.filamentKg[id])}`).join(' · ')}
          </div>
        </div>
      </div>
      {game.cash < 0 && (
        <div className="banner bad" role="alert">
          Cash is negative — no purchases until you earn it back. Collect finished prints!
        </div>
      )}
    </header>
  );
}
