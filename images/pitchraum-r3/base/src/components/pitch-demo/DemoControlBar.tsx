import type { PitchLinkRecord } from './types';
import { useAudio } from '../../audio/AudioProvider';

interface DemoControlBarProps {
  mode: 'composer' | 'recipient';
  onSwitchMode: (mode: 'composer' | 'recipient') => void;
  pitchLinks: PitchLinkRecord[];
  activePitchLinkId: string;
  onSelectPitchLink: (linkId: string) => void;
  onResetDemo: () => void;
}

/**
 * Dauerhaft sichtbare Demo-Leiste. Sie gehört nicht zum Produkt,
 * sondern zum Vorführbetrieb — deshalb schmal, dunkel und technisch.
 */
export function DemoControlBar({
  mode,
  onSwitchMode,
  pitchLinks,
  activePitchLinkId,
  onSelectPitchLink,
  onResetDemo,
}: DemoControlBarProps) {
  const { enabled, playing, meta, toggle, pause, unavailable } = useAudio();

  return (
    <div
      role="region"
      aria-label="Demo-Steuerung"
      className="sticky top-0 z-50 border-b border-dashed border-stone-500 bg-[#101214] px-3 py-1.5 text-[#f2ece1]"
      style={{ fontFamily: "'Martian Mono Variable', 'Courier New', monospace" }}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-1.5 text-[10px]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="border border-amber-300 px-1.5 py-0.5 font-semibold uppercase tracking-wider text-amber-200">
            Demo mit Fantasiedaten
          </span>
          <span className="text-stone-400">
            Noch in Entwicklung · Deine Eingaben werden nach 24 Stunden gelöscht
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Rollenwechsel für die Vorschau"
            className="flex items-center gap-1"
          >
            <button
              type="button"
              onClick={() => onSwitchMode('composer')}
              aria-pressed={mode === 'composer'}
              className={`min-h-[44px] border px-2.5 text-[10px] uppercase tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 ${
                mode === 'composer'
                  ? 'border-[#f2ece1] bg-[#f2ece1] text-[#101214]'
                  : 'border-stone-600 text-stone-300 hover:bg-stone-800'
              }`}
            >
              Sicht: Komponist
            </button>
            <button
              type="button"
              onClick={() => onSwitchMode('recipient')}
              aria-pressed={mode === 'recipient'}
              className={`min-h-[44px] border px-2.5 text-[10px] uppercase tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 ${
                mode === 'recipient'
                  ? 'border-[#f2ece1] bg-[#f2ece1] text-[#101214]'
                  : 'border-stone-600 text-stone-300 hover:bg-stone-800'
              }`}
            >
              Sicht: Empfänger
            </button>
          </div>

          <button
            type="button"
            disabled={unavailable}
            onClick={() => (enabled && playing ? pause() : void toggle(meta))}
            className="min-h-[44px] border border-stone-600 px-2.5 text-[10px] uppercase tracking-wider text-stone-300 hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 disabled:opacity-50"
          >
            Ton {enabled && playing ? 'an' : 'aus'}
          </button>

          {mode === 'recipient' && pitchLinks.length > 1 && (
            <div>
              <label htmlFor="demo-recipient-select" className="sr-only">
                Empfänger-Link auswählen
              </label>
              <select
                id="demo-recipient-select"
                value={activePitchLinkId}
                onChange={(event) => onSelectPitchLink(event.target.value)}
                className="min-h-[44px] max-w-[220px] truncate border border-stone-600 bg-stone-900 px-2 text-[10px] text-stone-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
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
            className="min-h-[44px] border border-stone-600 px-2.5 text-[10px] uppercase tracking-wider text-stone-300 hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          >
            Zurücksetzen
          </button>
        </div>
      </div>
    </div>
  );
}
