import { JOB_TYPES, MATERIALS, PRINTERS, WEAR } from '../../data';
import {
  assignBlockReason,
  assignJob,
  printSeconds,
  type BoardJob,
  type GameState,
} from '../../engine';
import { duration, kg, money } from '../format';
import { useStore } from '../store';

function JobCard({ job, game }: { job: BoardJob; game: GameState }) {
  const act = useStore((s) => s.act);
  const setTab = useStore((s) => s.setTab);
  const type = JOB_TYPES[job.typeId];
  const material = MATERIALS[type.material];
  const filamentCost = type.kg * material.costPerKg;
  const timeLeft = Math.max(0, job.expiresAt - game.clock);

  const options = game.printers.map((p, i) => ({
    printer: p,
    index: i,
    reason: assignBlockReason(game, job, p),
    seconds: printSeconds(type, PRINTERS[p.modelId]),
  }));
  const startable = options.filter((o) => o.reason === null);
  // Most useful explanation when nothing can start: anything other than "busy" wins.
  const blocker = options.find((o) => o.reason && o.reason !== 'Printer is busy')?.reason;
  const needFilament = options.some((o) => o.reason?.startsWith('Need'));

  return (
    <section className="card job">
      <div className="row between">
        <div>
          <div className="title">{type.name}</div>
          <div className="muted small">for {job.customer}</div>
        </div>
        <div className="payout">{money(job.payout)}</div>
      </div>
      <div className="row wrap small">
        <span className="pill">{material.name}</span>
        <span className="pill">Size {type.size}</span>
        <span className="pill">{kg(type.kg)} filament</span>
        <span className="pill">Profit ≈ {money(job.payout - filamentCost)}</span>
      </div>
      <div className="small muted">Leaves the board in {duration(timeLeft)}</div>

      {startable.length > 0 ? (
        <div className="row wrap">
          {startable.map((o) => (
            <button
              key={o.printer.id}
              className="btn primary grow"
              onClick={() => {
                const res = act((g) => assignJob(g, job.id, o.printer.id), () => 'Printing started');
                if (res.ok) {
                  // Stay on the board if another printer is still free; otherwise show the progress bar.
                  const g = useStore.getState().game;
                  const anotherFree = g.printers.some(
                    (p) => p.status === 'idle' && p.serviceRemaining === 0 && p.wear < WEAR.MAX,
                  );
                  if (!anotherFree) useStore.getState().setTab('floor');
                }
              }}
            >
              Print on {PRINTERS[o.printer.modelId].name} #{o.index + 1} · {duration(o.seconds)}
            </button>
          ))}
        </div>
      ) : (
        <div className="row">
          <span className="grow small blocked">{blocker ?? 'All printers are busy right now.'}</span>
          {needFilament && (
            <button className="btn ghost" onClick={() => setTab('shop')}>
              Shop
            </button>
          )}
        </div>
      )}
    </section>
  );
}

export function JobBoard() {
  const game = useStore((s) => s.game);
  return (
    <div className="screen">
      <p className="hint">Tap “Print on…” to start a job. New jobs keep arriving; old ones leave the board.</p>
      {game.board.map((job) => (
        <JobCard key={job.id} job={job} game={game} />
      ))}
    </div>
  );
}
