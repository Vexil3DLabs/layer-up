import { useEffect } from 'react';
import { TIME } from '../data';
import { Header } from './components/Header';
import { TabBar } from './components/TabBar';
import { Floor } from './screens/Floor';
import { JobBoard } from './screens/JobBoard';
import { Shop } from './screens/Shop';
import { useStore } from './store';

export function App() {
  const tab = useStore((s) => s.tab);
  const toast = useStore((s) => s.toast);

  useEffect(() => {
    const { advance, save } = useStore.getState();
    // Game logic uses measured elapsed time, so a throttled timer only makes the UI less smooth.
    const loop = setInterval(() => advance(Date.now()), TIME.UI_TICK_MS);
    const autosave = setInterval(save, TIME.AUTOSAVE_MS);
    const flush = () => {
      advance(Date.now());
      save();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
      else advance(Date.now()); // returning to the tab = offline catch-up
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    return () => {
      clearInterval(loop);
      clearInterval(autosave);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
    };
  }, []);

  return (
    <div className="app">
      <Header />
      <main>
        {tab === 'floor' && <Floor />}
        {tab === 'jobs' && <JobBoard />}
        {tab === 'shop' && <Shop />}
      </main>
      {toast && (
        <div key={toast.id} className={`toast ${toast.kind}`} role="status">
          {toast.text}
        </div>
      )}
      <TabBar />
    </div>
  );
}
