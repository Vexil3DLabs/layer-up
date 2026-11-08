import {
  FILAMENT_PACKS,
  MATERIALS,
  MATERIAL_IDS,
  PRINTERS,
  PRINTER_BRANDS,
  PRINTER_MODEL_IDS,
  tierDef,
} from '../../data';
import { buyFilament, buyPrinter, buyPrinterBlockReason, printerSlotsFree } from '../../engine';
import { PrinterIcon } from '../components/PrinterIcon';
import { kg, money, percent } from '../format';
import { useStore } from '../store';

export function Shop() {
  const game = useStore((s) => s.game);
  const act = useStore((s) => s.act);
  const resetGame = useStore((s) => s.resetGame);
  const tier = tierDef(game.tier);

  return (
    <div className="screen">
      <h2 className="section">Filament</h2>
      {MATERIAL_IDS.map((id) => {
        const m = MATERIALS[id];
        return (
          <section key={id} className="card">
            <div className="row between">
              <div>
                <div className="title">{m.name}</div>
                <div className="muted small">
                  {money(m.costPerKg)} per kg · you have {kg(game.filamentKg[id])}
                </div>
              </div>
            </div>
            <div className="row">
              {FILAMENT_PACKS.map((amount) => (
                <button
                  key={amount}
                  className="btn primary grow"
                  onClick={() => act((g) => buyFilament(g, id, amount), () => `Bought ${amount} kg ${m.name}`)}
                  aria-disabled={game.cash < m.costPerKg * amount}
                >
                  Buy {amount} kg · {money(m.costPerKg * amount)}
                </button>
              ))}
            </div>
          </section>
        );
      })}

      <h2 className="section">
        Printers{' '}
        <span className="muted small">
          {tier.name}: {game.printers.length}/{tier.printerSlots} slots
        </span>
      </h2>
      {PRINTER_MODEL_IDS.map((id) => {
        const model = PRINTERS[id];
        const brand = PRINTER_BRANDS[model.brand];
        const reason = buyPrinterBlockReason(game, id);
        const full = printerSlotsFree(game) <= 0;
        return (
          <section key={id} className="card">
            <div className="printer-head">
              <PrinterIcon accent={brand.accent} />
              <div className="grow">
                <div className="title">{model.name}</div>
                <span className="pill" style={{ borderColor: brand.accent, color: brand.accent }}>
                  {brand.name}
                </span>
              </div>
              <div className="payout">{money(model.price)}</div>
            </div>
            <div className="row wrap small">
              <span className="pill">Speed ×{model.speed}</span>
              <span className="pill">Size {model.size}</span>
              <span className="pill">Fails {percent(model.baseFail)}</span>
              <span className="pill">{model.materials.map((m) => MATERIALS[m].name).join(', ')}</span>
            </div>
            <div className="muted small">{brand.tagline}</div>
            <button
              className="btn primary"
              aria-disabled={reason !== null}
              onClick={() => act((g) => buyPrinter(g, id), () => `Bought a ${model.name}`)}
            >
              {full ? `${tier.name} is full` : `Buy ${model.name} · ${money(model.price)}`}
            </button>
            {reason && !full && <div className="small blocked">{reason}</div>}
          </section>
        );
      })}

      <h2 className="section">Game</h2>
      <section className="card">
        <div className="small muted">Your game saves automatically on this device.</div>
        <button
          className="btn danger"
          onClick={() => {
            if (window.confirm('Delete your save and start over?')) resetGame();
          }}
        >
          Reset game
        </button>
      </section>
    </div>
  );
}
