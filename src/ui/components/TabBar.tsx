import { eligiblePrinters } from '../../engine';
import { useStore, type Tab } from '../store';

const ICONS: Record<Tab, string> = {
  floor: 'M4 20h16v-2H4v2zm2-4h12V9l-3-3H9L6 9v7zm3-8h6l1 1H8l1-1z',
  jobs: 'M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zm1 4v2h8V7H8zm0 4v2h8v-2H8zm0 4v2h5v-2H8z',
  shop: 'M6 7V6a6 6 0 0112 0v1h2l-1 14H5L4 7h2zm2 0h8V6a4 4 0 00-8 0v1z',
};
const LABELS: Record<Tab, string> = { floor: 'Floor', jobs: 'Jobs', shop: 'Shop' };

export function TabBar() {
  const tab = useStore((s) => s.tab);
  const setTab = useStore((s) => s.setTab);
  const game = useStore((s) => s.game);

  const attention = game.printers.filter((p) => p.status === 'done' || p.status === 'failed').length;
  const startable = game.board.some((j) => eligiblePrinters(game, j).length > 0);
  const badges: Record<Tab, number> = { floor: attention, jobs: startable ? game.board.length : 0, shop: 0 };

  return (
    <nav className="tabbar" aria-label="Main">
      {(['floor', 'jobs', 'shop'] as Tab[]).map((t) => (
        <button
          key={t}
          className={t === tab ? 'tab active' : 'tab'}
          onClick={() => setTab(t)}
          aria-current={t === tab ? 'page' : undefined}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path d={ICONS[t]} fill="currentColor" />
          </svg>
          <span>{LABELS[t]}</span>
          {badges[t] > 0 && <span className="badge">{badges[t]}</span>}
        </button>
      ))}
    </nav>
  );
}
