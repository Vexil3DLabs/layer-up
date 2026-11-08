import { create } from 'zustand';
import { TIME } from '../data';
import { catchUp, tick, type ActionResult, type AwaySummary, type GameState } from '../engine';
import { clearSave, loadGame, saveGame, type StorageLike } from '../save';
import { createInitialState } from '../engine';

export type Tab = 'floor' | 'jobs' | 'shop';
export interface Toast {
  id: number;
  text: string;
  kind: 'ok' | 'bad';
}

/** localStorage, with an in-memory fallback if the browser blocks it (private mode etc.). */
function getStorage(): StorageLike {
  try {
    const s = window.localStorage;
    s.getItem('layerup.probe');
    return s;
  } catch {
    const mem = new Map<string, string>();
    return {
      getItem: (k) => mem.get(k) ?? null,
      setItem: (k, v) => void mem.set(k, v),
      removeItem: (k) => void mem.delete(k),
    };
  }
}
const storage = getStorage();

interface UiState {
  game: GameState;
  tab: Tab;
  away: AwaySummary | null;
  toast: Toast | null;
  lastMs: number;
  setTab: (tab: Tab) => void;
  dismissAway: () => void;
  /** Advance game time to `nowMs` (real clock). Long gaps run as offline catch-up. */
  advance: (nowMs: number) => void;
  /** Run an engine action on a copy of the state; commits and saves if it succeeds. */
  act: (fn: (g: GameState) => ActionResult, okText?: (r: ActionResult) => string | null) => ActionResult;
  save: () => void;
  resetGame: () => void;
  showToast: (text: string, kind: Toast['kind']) => void;
}

const awayWorthShowing = (a: AwaySummary | null): AwaySummary | null =>
  a && a.seconds >= TIME.AWAY_SUMMARY_MIN_SECONDS && (a.finished > 0 || a.failed > 0) ? a : null;

const initial = loadGame(storage, Date.now());
let toastId = 0;
let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const useStore = create<UiState>()((set, get) => ({
  game: initial.game,
  tab: 'floor',
  away: awayWorthShowing(initial.away),
  toast: null,
  lastMs: Date.now(),

  setTab: (tab) => set({ tab }),
  dismissAway: () => set({ away: null }),

  advance: (nowMs) => {
    const { lastMs, game } = get();
    const dt = (nowMs - lastMs) / 1000;
    if (dt <= 0) {
      set({ lastMs: nowMs });
      return;
    }
    const next = structuredClone(game);
    if (dt >= TIME.AWAY_SUMMARY_MIN_SECONDS) {
      // The tab was asleep: same offline logic as closing and reopening the app.
      const away = awayWorthShowing(catchUp(next, dt));
      set(away ? { game: next, lastMs: nowMs, away } : { game: next, lastMs: nowMs });
    } else {
      tick(next, dt);
      set({ game: next, lastMs: nowMs });
    }
  },

  act: (fn, okText) => {
    const next = structuredClone(get().game);
    const res = fn(next);
    if (res.ok) {
      set({ game: next });
      saveGame(storage, next, Date.now());
      const text = okText?.(res);
      if (text) get().showToast(text, 'ok');
    } else {
      get().showToast(res.reason, 'bad');
    }
    return res;
  },

  save: () => saveGame(storage, get().game, Date.now()),

  resetGame: () => {
    clearSave(storage);
    set({ game: createInitialState(Date.now()), away: null, tab: 'floor', lastMs: Date.now() });
    get().save();
  },

  showToast: (text, kind) => {
    toastId += 1;
    set({ toast: { id: toastId, text, kind } });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => set({ toast: null }), 2600);
  },
}));
