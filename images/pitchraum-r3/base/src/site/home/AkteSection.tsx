import { useState } from 'react';

const SPLITS = [
  { name: 'Lukas Mertens (Fiktiv)', role: 'Komposition, Gitarre', share: 60 },
  { name: 'Mara Sören (Fiktiv)', role: 'Ko-Komposition, Streicher', share: 40 },
];

/**
 * Die Akte: Angaben eines Tracks als Produktionsblatt, das sich aufklappt.
 * Rechtestatus bleibt durchgehend „Eigenangabe, ungeprüft“.
 */
export function AkteSection() {
  const [open, setOpen] = useState<string[]>(['identitaet', 'anteile']);

  function toggle(id: string) {
    setOpen((previous) =>
      previous.includes(id) ? previous.filter((entry) => entry !== id) : [...previous, id]
    );
  }

  const rows = [
    {
      id: 'identitaet',
      no: '01',
      title: 'Identität',
      summary: 'Titel, Länge, Tempo, Tonart',
      content: (
        <dl className="akte-grid">
          <div>
            <dt>Titel</dt>
            <dd>Stille nach dem Regen</dd>
          </div>
          <div>
            <dt>Länge</dt>
            <dd className="mono">02:34</dd>
          </div>
          <div>
            <dt>Tempo</dt>
            <dd className="mono">72 BPM</dd>
          </div>
          <div>
            <dt>Tonart</dt>
            <dd className="mono">F-Dur</dd>
          </div>
          <div>
            <dt>Stimmung</dt>
            <dd>Warm, offen</dd>
          </div>
          <div>
            <dt>Instrumente</dt>
            <dd>Gitarre, Vibraphon, Streichquartett</dd>
          </div>
          <div className="akte-grid__wide">
            <dt>Verwendung</dt>
            <dd>Offene Klangfläche mit Raum für gesprochene Sprache.</dd>
          </div>
        </dl>
      ),
    },
    {
      id: 'anteile',
      no: '02',
      title: 'Anteile',
      summary: '60 % / 40 % · Summe 100 %',
      content: (
        <div className="akte-splits">
          {SPLITS.map((split) => (
            <div className="akte-split" key={split.name}>
              <div className="akte-split__top">
                <div>
                  <strong>{split.name}</strong>
                  <span>{split.role}</span>
                </div>
                <span className="mono">{split.share} %</span>
              </div>
              <div
                className="akte-split__bar"
                role="img"
                aria-label={`Anteil ${split.name}: ${split.share} Prozent`}
              >
                <span style={{ width: `${split.share}%` }} />
              </div>
            </div>
          ))}
          <p className="akte-note">
            Summe 100 %. Anteile sind Eigenangaben und werden nicht geprüft. Zahlen werden nicht
            automatisch erzeugt — leere Felder bleiben leer.
          </p>
        </div>
      ),
    },
    {
      id: 'unterlagen',
      no: '03',
      title: 'Unterlagen',
      summary: '1 Vereinbarung · 1 Lücke',
      content: (
        <ul className="akte-docs">
          <li>
            <span className="mono">01</span>
            <span>vereinbarung-mertens-soeren-entwurf.pdf</span>
            <span className="mono">Entwurf</span>
          </li>
          <li data-missing="true">
            <span className="mono">02</span>
            <span>Aufnahmeprotokoll der Streicher fehlt</span>
            <span className="mono">offen</span>
          </li>
          <li>
            <span className="mono">03</span>
            <span>Eigenangabe zur Einspielung</span>
            <span className="mono">Notiz</span>
          </li>
        </ul>
      ),
    },
    {
      id: 'rechte',
      no: '04',
      title: 'Rechtestatus',
      summary: 'Eigenangabe, ungeprüft',
      content: (
        <div className="akte-rights">
          <p className="akte-rights__stamp">Eigenangabe, ungeprüft</p>
          <p>
            Diese Angaben stammen ausschließlich vom Komponisten. Pitchraum prüft sie nicht und
            ersetzt keine Rechtsberatung. ISRC, GEMA- oder IPI-Nummern bleiben leer, solange sie
            nicht selbst eingetragen wurden.
          </p>
          <div className="akte-rights__fields">
            <span className="mono">ISRC —</span>
            <span className="mono">Werknummer —</span>
            <span className="mono">GEMA —</span>
            <span className="mono">IPI —</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section className="section akte-section" id="die-akte" aria-labelledby="akte-heading">
      <div className="shell">
        <div className="montage-head">
          <div>
            <p className="eyebrow">Die Akte · ein Track, alle Angaben</p>
            <h2 id="akte-heading" className="display">
              Ein Blatt.
              <br />
              <span className="accent-text">Keine Zettel</span>
              <br />
              im Nirgendwo.
            </h2>
          </div>
          <p className="montage-head__note">
            Anteile, Unterlagen, Notizen: pro Track eine Akte, die sich wie ein Produktionsblatt
            aufklappt. Was fehlt, steht da. Was ungeprüft ist, bleibt ungeprüft. Klick dich
            durch.
          </p>
        </div>

        <article className="akte" aria-label="Akte für den Track Stille nach dem Regen">
          <header className="akte__head">
            <div>
              <p className="mono">Akte · Werk 03 · Demoakte</p>
              <h3 className="akte__title">Stille nach dem Regen</h3>
              <p className="mono akte__sub">
                Lukas Mertens &amp; Mara Sören (Fiktiv) · 02:34 · F-Dur
              </p>
            </div>
            <div className="akte__seal">
              <span className="mono">Rechtestatus</span>
              <strong>Eigenangabe, ungeprüft</strong>
            </div>
          </header>

          <div className="akte__body">
            {rows.map((row) => {
              const isOpen = open.includes(row.id);
              return (
                <div className="akte-row" key={row.id} data-open={isOpen}>
                  <h4 style={{ margin: 0 }}>
                    <button
                      type="button"
                      className="akte-row__toggle"
                      aria-expanded={isOpen}
                      aria-controls={`akte-panel-${row.id}`}
                      onClick={() => toggle(row.id)}
                    >
                      <span className="akte-row__no mono">{row.no}</span>
                      <span className="akte-row__title">{row.title}</span>
                      <span className="akte-row__summary mono">{row.summary}</span>
                      <span className="akte-row__sign" aria-hidden="true">
                        {isOpen ? '−' : '+'}
                      </span>
                    </button>
                  </h4>
                  <div
                    className="akte-row__panel"
                    id={`akte-panel-${row.id}`}
                    hidden={!isOpen}
                  >
                    <div className="akte-row__inner">{row.content}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <footer className="akte__foot">
            <p className="mono">Letzte Änderung: heute · 03:42</p>
            <p className="mono">Keine Kennnummern automatisch erzeugt</p>
          </footer>
        </article>
      </div>
    </section>
  );
}
