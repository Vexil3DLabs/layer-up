import {
  JOB_TYPES,
  MATERIALS,
  NEXT_TIER_PREVIEW,
  PRINTER_BRANDS,
  REPUTATION,
  WEAR,
  tierDef,
} from '../../data';
import {
  collectAll,
  collectJob,
  failChance,
  modelOf,
  refundJob,
  retryJob,
  serviceCost,
  servicePrinter,
  type GameState,
  type PrinterState,
} from '../../engine';
import { PrinterIcon } from '../components/PrinterIcon';
import { duration, kg, money, percent } from '../format';
import { useStore } from '../store';

/** One plain-English sentence telling the player what to do next. */
function coachHint(game: GameState): string {
  const printers = game.printers;
  if (printers.some((p) => p.status === 'done')) return 'A print is finished — tap Collect to get paid.';
  if (printers.some((p) => p.status === 'failed')) return 'A print failed. Retry it (costs more filament) or refund the customer.';
  if (printers.some((p) => p.status === 'idle' && p.serviceRemaining === 0 && p.wear < WEAR.MAX))
    return 'A printer is free. Open the Jobs tab and tap a job to start printing.';
  if (printers.every((p) => p.status === 'printing' || p.serviceRemaining > 0))
    return 'Printing… Earn cash, then buy filament or a second printer in the Shop.';
  return 'Check your printers below.';
}

function PrinterCard({ printer, index }: { printer: PrinterState; index: number }) {
  const act = useStore((s) => s.act);
  const setTab = useStore((s) => s.setTab);
  const cash = useStore((s) => s.game.cash);
  const model = modelOf(printer);
  const brand = PRINTER_BRANDS[model.brand];
  const print = printer.print;
  const type = print ? JOB_TYPES[print.job.typeId] : null;
  const servicing = printer.serviceRemaining > 0;
  const progress = print ? Math.min(1, print.elapsed / print.duration) : 0;
  const wearFrac = printer.wear / WEAR.MAX;
  const canService = printer.status !== 'printing' && !servicing && printer.wear >= 1;
  const sCost = serviceCost(printer);
  const needsRepair = printer.wear >= WEAR.MAX;

  let statusLabel = 'Idle';
  let statusClass = 'idle';
  if (servicing) {
    statusLabel = printer.serviceKind === 'repair' ? 'Repairing' : 'Maintenance';
    statusClass = 'service';
  } else if (printer.status === 'printing') {
    statusLabel = 'Printing';
    statusClass = 'printing';
  } else if (printer.status === 'done') {
    statusLabel = 'Done';
    statusClass = 'done';
  } else if (printer.status === 'failed') {
    statusLabel = 'Failed';
    statusClass = 'failed';
  }

  const failNow = failChance(model, MATERIALS[type?.material ?? model.materials[0]!], printer.wear);

  return (
    <section className="card printer" aria-label={`${model.name} ${index + 1}`}>
      <div className="printer-head">
        <PrinterIcon accent={brand.accent} printing={printer.status === 'printing'} />
        <div className="grow">
          <div className="title">
            {model.name} <span className="muted">#{index + 1}</span>
          </div>
          <span className="pill" style={{ borderColor: brand.accent, color: brand.accent }}>
            {brand.name}
          </span>
        </div>
        <span className={`status ${statusClass}`}>{statusLabel}</span>
      </div>

      {print && type && (
        <div className="job-line">
          <div>
            <strong>{type.name}</strong> <span className="muted">for {print.job.customer}</span>
          </div>
          <div className="muted small">
            Pays {money(print.job.payout)}
            {print.attempts > 1 ? ` · attempt ${print.attempts}` : ''}
          </div>
        </div>
      )}

      {printer.status === 'printing' && print && (
        <div>
          <div
            className="bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            aria-label="Print progress"
          >
            <div className="fill" style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="row between small">
            <span>{percent(progress)}</span>
            <span>{duration(print.duration - print.elapsed)} left</span>
          </div>
        </div>
      )}

      {servicing && (
        <div className="small">{printer.serviceKind === 'repair' ? 'Repairing' : 'Servicing'}… {duration(printer.serviceRemaining)} left</div>
      )}

      {printer.status === 'idle' && !servicing && (
        <div className="row">
          <span className="grow muted">
            {needsRepair ? 'Worn out — repair it before printing.' : 'Waiting for a job.'}
          </span>
          {!needsRepair && (
            <button className="btn primary" onClick={() => setTab('jobs')}>
              Choose a job
            </button>
          )}
        </div>
      )}

      {printer.status === 'done' && print && (
        <button
          className="btn primary big"
          onClick={() => act((g) => collectJob(g, printer.id), (r) => `+${money(r.ok ? (r.amount ?? 0) : 0)}`)}
        >
          Collect {money(print.job.payout)}
        </button>
      )}

      {printer.status === 'failed' && print && type && (
        <div className="stack">
          <div className="fail-note">
            {print.failReason === 'breakdown' ? 'The printer broke down' : 'The print failed'} at{' '}
            {percent(print.elapsed / print.duration)}. Filament used so far is lost.
          </div>
          <div className="row">
            <button className="btn primary" onClick={() => act((g) => retryJob(g, printer.id), () => 'Retrying…')}>
              Retry · {kg(type.kg)}
            </button>
            <button
              className="btn danger"
              onClick={() => act((g) => refundJob(g, printer.id), () => `Customer refunded (−${REPUTATION.LOSS_ON_REFUND}★)`)}
            >
              Refund · −{REPUTATION.LOSS_ON_REFUND}★
            </button>
          </div>
        </div>
      )}

      <div className="wear">
        <div className="row between small">
          <span>
            Wear {Math.round(printer.wear)}/{WEAR.MAX}
            {printer.wear >= WEAR.WARN_AT && !needsRepair ? ' — getting worn' : ''}
            {needsRepair ? ' — BROKEN' : ''}
          </span>
          <span className="muted">Fail chance {percent(failNow)}</span>
        </div>
        <div className={wearFrac >= 0.6 ? 'bar thin warn' : 'bar thin'} aria-hidden="true">
          <div className="fill" style={{ width: `${wearFrac * 100}%` }} />
        </div>
        {canService && (
          <button
            className={printer.wear >= WEAR.WARN_AT ? 'btn warn' : 'btn ghost'}
            onClick={() =>
              act(
                (g) => servicePrinter(g, printer.id),
                () => (needsRepair ? 'Repair started' : 'Maintenance started'),
              )
            }
            aria-disabled={cash < sCost}
          >
            {needsRepair ? 'Repair' : 'Maintain'} · {money(sCost)}
          </button>
        )}
      </div>
    </section>
  );
}

export function Floor() {
  const game = useStore((s) => s.game);
  const away = useStore((s) => s.away);
  const dismissAway = useStore((s) => s.dismissAway);
  const act = useStore((s) => s.act);
  const setTab = useStore((s) => s.setTab);

  const slots = tierDef(game.tier).printerSlots;
  const empty = Math.max(0, slots - game.printers.length);
  const doneCount = game.printers.filter((p) => p.status === 'done').length;
  const goal = NEXT_TIER_PREVIEW.requirement;

  return (
    <div className="screen">
      {away && (
        <div className="banner good" role="status">
          <div>
            <strong>Welcome back!</strong> While you were away ({duration(away.seconds)}):{' '}
            {away.finished > 0 && `${away.finished} print${away.finished === 1 ? '' : 's'} finished`}
            {away.finished > 0 && away.failed > 0 && ', '}
            {away.failed > 0 && `${away.failed} failed`}.
          </div>
          <button className="btn ghost" onClick={dismissAway}>
            Got it
          </button>
        </div>
      )}

      <p className="hint">{coachHint(game)}</p>

      {doneCount >= 2 && (
        <button
          className="btn primary big"
          onClick={() => act((g) => collectAll(g), (r) => `+${money(r.ok ? (r.amount ?? 0) : 0)}`)}
        >
          Collect all ({doneCount})
        </button>
      )}

      {game.printers.map((p, i) => (
        <PrinterCard key={p.id} printer={p} index={i} />
      ))}

      {Array.from({ length: empty }, (_, i) => (
        <section key={`empty-${i}`} className="card empty-slot">
          <div className="title muted">Empty printer slot</div>
          <button className="btn ghost" onClick={() => setTab('shop')}>
            Buy a printer
          </button>
        </section>
      ))}

      <section className="card goal">
        <div className="title">Next goal: {NEXT_TIER_PREVIEW.name}</div>
        <div className="small muted">Needs {money(goal.cash)} cash and {goal.jobsDone} jobs done. (Moving in arrives in the next update.)</div>
        <div className="row between small">
          <span>Cash</span>
          <span>
            {money(Math.max(0, game.cash))} / {money(goal.cash)}
          </span>
        </div>
        <div className="bar thin" aria-hidden="true">
          <div className="fill" style={{ width: `${Math.min(100, (Math.max(0, game.cash) / goal.cash) * 100)}%` }} />
        </div>
        <div className="row between small">
          <span>Jobs done</span>
          <span>
            {game.stats.jobsDone} / {goal.jobsDone}
          </span>
        </div>
        <div className="bar thin" aria-hidden="true">
          <div className="fill" style={{ width: `${Math.min(100, (game.stats.jobsDone / goal.jobsDone) * 100)}%` }} />
        </div>
      </section>
    </div>
  );
}
