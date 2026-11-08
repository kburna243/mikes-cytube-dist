import type { PitchLinkRecord } from './types';

interface DemoControlBarProps {
  mode: 'composer' | 'recipient';
  onSwitchMode: (mode: 'composer' | 'recipient') => void;
  pitchLinks: PitchLinkRecord[];
  activePitchLinkId: string;
  onSelectPitchLink: (linkId: string) => void;
  onResetDemo: () => void;
}

/**
 * Schmale, dauerhaft sichtbare Demo-Leiste am oberen Bildschirmrand.
 * Optisch klar vom eigentlichen Produkt abgesetzt.
 */
export function DemoControlBar({
  mode,
  onSwitchMode,
  pitchLinks,
  activePitchLinkId,
  onSelectPitchLink,
  onResetDemo,
}: DemoControlBarProps) {
  return (
    <div
      role="region"
      aria-label="Demo-Steuerung"
      className="sticky top-0 z-50 border-b border-dashed border-slate-600 bg-slate-900 px-3 py-1.5 text-slate-100"
    >
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="inline-block rounded bg-amber-300 px-2 py-0.5 font-semibold text-slate-950">
            Demo mit Fantasiedaten
          </span>
          <span className="text-slate-300">
            Deine Eingaben werden nach 24 Stunden gelöscht
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Rollenwechsel für die Vorschau"
            className="flex items-center gap-1 rounded border border-slate-600 bg-slate-800 p-0.5"
          >
            <button
              type="button"
              onClick={() => onSwitchMode('composer')}
              aria-pressed={mode === 'composer'}
              className={`min-h-[36px] rounded px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 ${
                mode === 'composer'
                  ? 'bg-white text-slate-950 font-semibold'
                  : 'text-slate-200 hover:bg-slate-700'
              }`}
            >
              Sicht: Komponist
            </button>
            <button
              type="button"
              onClick={() => onSwitchMode('recipient')}
              aria-pressed={mode === 'recipient'}
              className={`min-h-[36px] rounded px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 ${
                mode === 'recipient'
                  ? 'bg-white text-slate-950 font-semibold'
                  : 'text-slate-200 hover:bg-slate-700'
              }`}
            >
              Sicht: Empfänger
            </button>
          </div>

          {mode === 'recipient' && pitchLinks.length > 1 && (
            <div className="flex items-center gap-1">
              <label htmlFor="demo-recipient-select" className="sr-only">
                Empfänger-Link auswählen
              </label>
              <select
                id="demo-recipient-select"
                value={activePitchLinkId}
                onChange={(e) => onSelectPitchLink(e.target.value)}
                className="min-h-[36px] max-w-[200px] truncate rounded border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
              >
                {pitchLinks.map((link) => (
                  <option key={link.id} value={link.id}>
                    Link für {link.recipientName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={onResetDemo}
            className="min-h-[36px] rounded border border-slate-600 bg-slate-800 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          >
            Zurücksetzen
          </button>
        </div>
      </div>
    </div>
  );
}
