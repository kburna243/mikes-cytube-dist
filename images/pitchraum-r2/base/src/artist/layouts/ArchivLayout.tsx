import { useMemo, useState } from 'react';
import type { LayoutContent } from '../types';

/**
 * Gestalt „Archiv“: dichte Katalogliste wie ein Werkverzeichnis,
 * die Filter stehen im Mittelpunkt.
 */
export function ArchivLayout({ content }: { content: LayoutContent }) {
  const [textFilter, setTextFilter] = useState('');
  const [moodFilter, setMoodFilter] = useState('ALLE');
  const [tempoFilter, setTempoFilter] = useState<'ALLE' | 'LANGSAM' | 'MITTEL' | 'SCHNELL'>('ALLE');
  const [openTrackId, setOpenTrackId] = useState<string | null>(null);

  const moods = useMemo(() => {
    const set = new Set<string>();
    content.tracks.forEach((t) => set.add(t.mood));
    return Array.from(set);
  }, [content.tracks]);

  const filtered = useMemo(() => {
    const needle = textFilter.trim().toLowerCase();
    return content.tracks.filter((t) => {
      if (moodFilter !== 'ALLE' && t.mood !== moodFilter) return false;
      if (tempoFilter === 'LANGSAM' && t.bpm > 90) return false;
      if (tempoFilter === 'MITTEL' && (t.bpm <= 90 || t.bpm > 120)) return false;
      if (tempoFilter === 'SCHNELL' && t.bpm <= 120) return false;
      if (needle && !`${t.title} ${t.genre} ${t.instrumentation}`.toLowerCase().includes(needle)) {
        return false;
      }
      return true;
    });
  }, [content.tracks, textFilter, moodFilter, tempoFilter]);

  return (
    <div
      style={{
        backgroundColor: 'var(--brand-background)',
        color: 'var(--brand-text)',
        fontFamily: 'var(--font-family-body)',
      }}
      className="min-h-screen px-4 py-8 sm:px-8"
    >
      <div className="mx-auto max-w-4xl">
        {/* Kopf des Verzeichnisses */}
        <header className="border-b-2 pb-5" style={{ borderColor: 'var(--brand-text)' }}>
          <p
            className="text-xs uppercase tracking-[0.25em]"
            style={{ fontFamily: 'var(--font-family-mono)', color: 'var(--brand-accent)' }}
          >
            Werkverzeichnis · {content.roleLine}
          </p>
          <h1
            className="mt-1 text-3xl font-bold sm:text-4xl"
            style={{ fontFamily: 'var(--font-family-display)' }}
          >
            {content.name}
          </h1>
          {content.tagline && (
            <p className="mt-1 text-sm" style={{ opacity: 0.85 }}>
              {content.tagline}
            </p>
          )}
        </header>

        {/* Filter im Mittelpunkt */}
        <section
          aria-label="Katalog filtern"
          className="mt-6 rounded-sm border-2 p-4"
          style={{ borderColor: 'var(--brand-text)', backgroundColor: 'var(--brand-secondary)' }}
        >
          <h2
            className="text-xs font-bold uppercase tracking-[0.25em]"
            style={{ fontFamily: 'var(--font-family-mono)' }}
          >
            Katalog durchsuchen
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label
                htmlFor="archiv-suche"
                className="block text-xs font-bold"
                style={{ fontFamily: 'var(--font-family-mono)' }}
              >
                Begriff
              </label>
              <input
                id="archiv-suche"
                type="text"
                value={textFilter}
                onChange={(e) => setTextFilter(e.target.value)}
                placeholder="z. B. Streicher, Puls …"
                className="mt-1 w-full min-h-[44px] rounded-sm border-2 bg-transparent px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ borderColor: 'var(--brand-text)', color: 'var(--brand-text)' }}
              />
            </div>
            <div>
              <label
                htmlFor="archiv-stimmung"
                className="block text-xs font-bold"
                style={{ fontFamily: 'var(--font-family-mono)' }}
              >
                Stimmung
              </label>
              <select
                id="archiv-stimmung"
                value={moodFilter}
                onChange={(e) => setMoodFilter(e.target.value)}
                className="mt-1 w-full min-h-[44px] rounded-sm border-2 bg-transparent px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  borderColor: 'var(--brand-text)',
                  color: 'var(--brand-text)',
                  backgroundColor: 'var(--brand-background)',
                }}
              >
                <option value="ALLE">Alle Stimmungen</option>
                {moods.map((mood) => (
                  <option key={mood} value={mood}>
                    {mood}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="archiv-tempo"
                className="block text-xs font-bold"
                style={{ fontFamily: 'var(--font-family-mono)' }}
              >
                Tempo
              </label>
              <select
                id="archiv-tempo"
                value={tempoFilter}
                onChange={(e) => setTempoFilter(e.target.value as typeof tempoFilter)}
                className="mt-1 w-full min-h-[44px] rounded-sm border-2 bg-transparent px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  borderColor: 'var(--brand-text)',
                  color: 'var(--brand-text)',
                  backgroundColor: 'var(--brand-background)',
                }}
              >
                <option value="ALLE">Jedes Tempo</option>
                <option value="LANGSAM">Bis 90 BPM</option>
                <option value="MITTEL">91–120 BPM</option>
                <option value="SCHNELL">Über 120 BPM</option>
              </select>
            </div>
          </div>
          <p className="mt-3 text-xs" style={{ fontFamily: 'var(--font-family-mono)', opacity: 0.8 }}>
            {filtered.length} von {content.tracks.length} Einträgen
          </p>
        </section>

        {/* Dichte Katalogliste */}
        <section aria-label="Werkliste" className="mt-6">
          {filtered.length === 0 ? (
            <div
              className="border-2 border-dashed p-5 text-sm"
              style={{ borderColor: 'var(--brand-text)' }}
            >
              Kein Eintrag passt zu dieser Filterung. Setzen Sie die Filter zurück.
            </div>
          ) : (
            <ul>
              {filtered.map((track) => {
                const isOpen = openTrackId === track.id;
                return (
                  <li
                    key={track.id}
                    className="border-b"
                    style={{ borderColor: 'var(--brand-text)' }}
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenTrackId(isOpen ? null : track.id)}
                      className="grid w-full grid-cols-[auto_1fr_auto] items-baseline gap-3 py-2.5 text-left min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{ outlineColor: 'var(--brand-accent)' }}
                    >
                      <span
                        className="text-xs"
                        style={{ fontFamily: 'var(--font-family-mono)', color: 'var(--brand-accent)' }}
                      >
                        {track.catalogNo}
                      </span>
                      <span>
                        <span
                          className="block text-base font-bold leading-tight"
                          style={{ fontFamily: 'var(--font-family-display)' }}
                        >
                          {track.title}
                        </span>
                        <span
                          className="block text-xs"
                          style={{ fontFamily: 'var(--font-family-mono)', opacity: 0.8 }}
                        >
                          {track.genre} · {track.instrumentation}
                        </span>
                      </span>
                      <span
                        className="text-right text-xs"
                        style={{ fontFamily: 'var(--font-family-mono)', opacity: 0.85 }}
                      >
                        {track.durationFormatted}
                        <br />
                        {track.bpm} BPM
                      </span>
                    </button>
                    {isOpen && (
                      <div
                        className="mb-3 ml-0 rounded-sm border-l-4 py-2 pl-4 pr-2 text-sm leading-relaxed"
                        style={{ borderColor: 'var(--brand-accent)' }}
                      >
                        <p>{track.description}</p>
                        <p
                          className="mt-1 text-xs"
                          style={{ fontFamily: 'var(--font-family-mono)', opacity: 0.8 }}
                        >
                          Stimmung: {track.mood}
                        </p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <footer className="mt-10 border-t pt-4 text-xs" style={{ borderColor: 'var(--brand-text)', opacity: 0.85 }}>
          <p style={{ fontFamily: 'var(--font-family-mono)' }}>
            {content.name} — Katalogauszug. Vollständige Hörproben gibt es über einen persönlichen
            Musikauswahl-Link.
          </p>
        </footer>
      </div>
    </div>
  );
}
