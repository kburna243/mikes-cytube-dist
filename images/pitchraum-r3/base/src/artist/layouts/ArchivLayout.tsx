import { useEffect, useMemo, useRef, useState } from 'react';
import type { LayoutContent } from '../types';
import { PlaySketch } from '../PlaySketch';
import { CoverArt } from '../CoverArt';

/**
 * ARCHIV — dichtes Werkverzeichnis wie ein Präzisionsinstrument.
 * Eigenes Verhalten: Filter reagieren sofort, Tastaturkürzel „/“ springt in
 * die Suche, Pfeiltasten wandern durch den Katalog, Sortierung ist live.
 */
export function ArchivLayout({ content }: { content: LayoutContent }) {
  const [query, setQuery] = useState('');
  const [mood, setMood] = useState('ALLE');
  const [sort, setSort] = useState<'katalog' | 'tempo' | 'laenge'>('katalog');
  const [openId, setOpenId] = useState<string | null>(content.tracks[0]?.id ?? null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  const moods = useMemo(() => Array.from(new Set(content.tracks.map((track) => track.mood))), [content.tracks]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = content.tracks.filter((track) => {
      if (mood !== 'ALLE' && track.mood !== mood) return false;
      if (!needle) return true;
      return `${track.title} ${track.genre} ${track.instrumentation} ${track.catalogNo}`
        .toLowerCase()
        .includes(needle);
    });
    return filtered.sort((a, b) => {
      if (sort === 'tempo') return b.bpm - a.bpm;
      if (sort === 'laenge') return b.durationFormatted.localeCompare(a.durationFormatted);
      return a.catalogNo.localeCompare(b.catalogNo);
    });
  }, [content.tracks, query, mood, sort]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const inField = target && /input|textarea|select/i.test(target.tagName);
      if (event.key === '/' && !inField) {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (!inField && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
        const buttons = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('.archiv-row') || []);
        if (!buttons.length) return;
        const current = buttons.findIndex((button) => button === document.activeElement);
        const next = event.key === 'ArrowDown' ? Math.min(buttons.length - 1, current + 1) : Math.max(0, current - 1);
        event.preventDefault();
        buttons[next]?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      className="artist-surface layout-archiv"
      style={{
        background: 'var(--brand-background)',
        color: 'var(--brand-text)',
        fontFamily: 'var(--font-family-body)',
      }}
    >
      <header className="archiv-head">
        <div>
          <p className="mono" style={{ color: 'var(--brand-accent)' }}>
            Werkverzeichnis · {content.roleLine}
          </p>
          <h1
            className="display"
            style={{ fontFamily: 'var(--font-family-display)', fontSize: 'clamp(2.6rem, 7vw, 5.4rem)', textTransform: 'none' }}
          >
            {content.name}
          </h1>
        </div>
        <p className="archiv-tagline">{content.tagline}</p>
      </header>

      <div className="archiv-instrument" role="search" aria-label="Katalog filtern">
        <div className="archiv-instrument__row">
          <label className="archiv-field archiv-field--search">
            <span className="mono">Suche <kbd>/</kbd></span>
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Titel, Genre, Instrument"
              style={{ borderColor: 'var(--brand-accent)', color: 'var(--brand-text)' }}
            />
          </label>
          <label className="archiv-field">
            <span className="mono">Stimmung</span>
            <select value={mood} onChange={(event) => setMood(event.target.value)}>
              <option value="ALLE">Alle</option>
              {moods.map((entry) => (
                <option key={entry} value={entry}>{entry}</option>
              ))}
            </select>
          </label>
          <label className="archiv-field">
            <span className="mono">Sortierung</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
              <option value="katalog">Katalog</option>
              <option value="tempo">Tempo ↓</option>
              <option value="laenge">Länge ↓</option>
            </select>
          </label>
          <div className="archiv-count" aria-live="polite">
            <strong>{String(rows.length).padStart(2, '0')}</strong>
            <span className="mono">von {String(content.tracks.length).padStart(2, '0')}</span>
          </div>
        </div>
        <p className="mono archiv-shortcuts">↑ ↓ durch Einträge · / Suche · Enter öffnen</p>
      </div>

      {rows.length === 0 ? (
        <p className="archiv-empty">Kein Eintrag passt. Filter zurücksetzen: Suche leeren, Stimmung auf „Alle“.</p>
      ) : (
        <ul className="archiv-list" ref={listRef}>
          {rows.map((track) => {
            const isOpen = openId === track.id;
            return (
              <li key={track.id} data-open={isOpen}>
                <button
                  type="button"
                  className="archiv-row"
                  aria-expanded={isOpen}
                  onClick={() => setOpenId(isOpen ? null : track.id)}
                >
                  <span className="mono archiv-row__no">{track.catalogNo}</span>
                  <span className="archiv-row__title">{track.title}</span>
                  <span className="mono archiv-row__genre">{track.genre}</span>
                  <span className="mono archiv-row__tempo">{track.bpm} BPM</span>
                  <span className="mono archiv-row__time">{track.durationFormatted}</span>
                  <span className="archiv-row__sign" aria-hidden="true">{isOpen ? '−' : '+'}</span>
                </button>
                <div className="archiv-detail" hidden={!isOpen}>
                  <div className="archiv-detail__cover">
                    <CoverArt seed={track.id} title={track.title} bpm={track.bpm} mood={track.mood} />
                  </div>
                  <div>
                    <p>{track.description}</p>
                    <dl className="archiv-dl">
                      <div><dt className="mono">Instrumente</dt><dd>{track.instrumentation}</dd></div>
                      <div><dt className="mono">Stimmung</dt><dd>{track.mood}</dd></div>
                      <div><dt className="mono">Tonart</dt><dd>{track.musicalKey || '—'}</dd></div>
                    </dl>
                    <PlaySketch
                      track={track}
                      className="archiv-play"
                      label="Klangskizze abspielen"
                      style={{ borderColor: 'var(--brand-accent)', color: 'var(--brand-background)', background: 'var(--brand-accent)' }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <footer className="archiv-foot">
        <p>{content.intro}</p>
        <p className="mono">Alle Werke und Namen fiktiv · Klangskizzen im Browser erzeugt</p>
      </footer>
    </div>
  );
}
