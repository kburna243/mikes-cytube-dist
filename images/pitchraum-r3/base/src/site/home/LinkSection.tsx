import { useState } from 'react';
import { useAudio, sketchForTrack } from '../../audio/AudioProvider';
import { FilmScene } from '../../scene/FilmScene';

const TRACK = {
  id: 'trk-101',
  title: 'Nebel über dem Kanal',
  bpm: 84,
  mood: 'Ruhig',
  musicalKey: 'D-Moll',
  length: '02:48',
};

interface EventRow {
  id: number;
  label: string;
  detail: string;
  time: string;
}

const INITIAL_EVENTS: EventRow[] = [];

function nowStamp(): string {
  const now = new Date();
  return [now.getHours(), now.getMinutes()]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
}

/**
 * Interaktives Beispiel des Empfängerlinks. Der Ablauf ist echt bedienbar;
 * die Übergabe an die Komponistenansicht wird hier auf der Website simuliert
 * und ist in der Demo über den Server verdrahtet.
 */
export function LinkSection() {
  const { meta, play, getSignal } = useAudio();
  const [opened, setOpened] = useState(false);
  const [listened, setListened] = useState(false);
  const [inquired, setInquired] = useState(false);
  const [events, setEvents] = useState<EventRow[]>(INITIAL_EVENTS);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('Clara Lindqvist (Fiktiv)');
  const [project, setProject] = useState('Hafengrau · Folge 2 (Fiktiv)');
  const [usage, setUsage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  function pushEvent(label: string, detail: string) {
    setStep((value) => value + 1);
    setEvents((previous) => [
      ...previous,
      { id: Date.now(), label, detail, time: nowStamp() },
    ]);
  }

  function handleOpen() {
    if (!opened) {
      setOpened(true);
      pushEvent('Link geöffnet', 'Die Empfängerin hat die Auswahl aufgerufen.');
    }
  }

  function handleListen() {
    if (!opened) handleOpen();
    if (!listened) {
      setListened(true);
      pushEvent('Angehört', `„${TRACK.title}“ lief im Empfängerlink.`);
    }
    const sketch = sketchForTrack(TRACK);
    void play(sketch);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !project.trim() || !usage.trim()) {
      setError('Bitte tragen Sie Namen, Projekt und geplante Nutzung ein.');
      return;
    }
    setError(null);
    setInquired(true);
    setFormOpen(false);
    pushEvent('Anfrage eingegangen', `${name.trim()} · ${project.trim()} · ${usage.trim()}`);
  }

  return (
    <section className="section link-section" id="der-link" aria-labelledby="link-heading">
      <div className="shell">
        <div className="montage-head">
          <div>
            <p className="eyebrow">Der Link · Empfängerseite</p>
            <h2 id="link-heading" className="display">
              Kein Download.
              <br />
              <span className="accent-text">Nur ein Abend</span>
              <br />
              am Fenster.
            </h2>
          </div>
          <p className="montage-head__note">
            Die Empfängerin öffnet einen Link und sieht genau diese Musik. Kein Konto, kein
            Passwort, keine Zip-Datei. Jeder Schritt kommt bei dir an — geöffnet, angehört,
            angefragt. Bedien den Ablauf rechts einmal selbst.
          </p>
        </div>

        <div className="link-stage">
          <div className="link-stage__room">
            <div className="link-stage__scene">
              <FilmScene accent={meta.accent} mode={meta.mode} decorative />
              <div className="link-stage__scene-copy">
                <p className="mono">Musikauswahl von Lukas Mertens (Fiktiv)</p>
                <p className="link-stage__film">Hafengrau</p>
                <p className="link-stage__sub mono">Nordlicht Filmproduktion · Mehrteiler · Fiktiv</p>
              </div>
            </div>

            <div className="link-stage__program">
              <div className="link-stage__program-head">
                <span className="mono">01 / 01 · Auswahl</span>
                <span className="mono">{TRACK.length}</span>
              </div>
              <p className="link-stage__note">
                „Hallo Clara, für die Rohschnitt-Sichtung von Folge 2. Der Rest ist deine
                Entscheidung.“
              </p>
              <div className="link-stage__track">
                <button
                  type="button"
                  className="link-stage__play"
                  onClick={handleListen}
                  aria-pressed={listened}
                >
                  <span aria-hidden="true">{listened ? '❙❙' : '▶'}</span>
                  {listened ? 'Pause' : 'Anhören'}
                </button>
                <div>
                  <p className="link-stage__track-title">{TRACK.title}</p>
                  <p className="mono" style={{ margin: 0 }}>
                    {TRACK.bpm} BPM · {TRACK.musicalKey} · Klangskizze, im Browser erzeugt
                  </p>
                </div>
              </div>

              <div className="link-stage__actions">
                <button type="button" className="btn" onClick={handleOpen}>
                  {opened ? 'Link geöffnet' : 'Link öffnen'}
                  {opened && <span aria-hidden="true">✓</span>}
                </button>
                <button
                  type="button"
                  className="btn btn--accent"
                  onClick={() => setFormOpen((value) => !value)}
                  aria-expanded={formOpen}
                >
                  Anfragen
                </button>
              </div>

              {formOpen && (
                <form className="link-form" onSubmit={handleSubmit} noValidate>
                  <p className="mono" style={{ margin: 0 }}>
                    Unverbindliche Anfrage · Demo
                  </p>
                  <label>
                    Ihr Name
                    <input value={name} onChange={(event) => setName(event.target.value)} />
                  </label>
                  <label>
                    Projekt
                    <input value={project} onChange={(event) => setProject(event.target.value)} />
                  </label>
                  <label>
                    Geplante Nutzung
                    <input
                      value={usage}
                      onChange={(event) => setUsage(event.target.value)}
                      placeholder="z. B. Eröffnungsszene, TV DACH, 3 Jahre"
                    />
                  </label>
                  {error && (
                    <p role="alert" className="link-form__error">
                      {error}
                    </p>
                  )}
                  <button type="submit" className="btn btn--accent">
                    Anfrage abschicken <span aria-hidden="true">→</span>
                  </button>
                </form>
              )}
              {inquired && (
                <p role="status" className="link-stage__confirm mono">
                  Anfrage angekommen. Beim Komponisten als „Neu“ markiert.
                </p>
              )}
            </div>
          </div>

          <aside className="link-stage__desk" aria-label="Komponistenansicht: Status dieses Links">
            <div className="link-stage__desk-head">
              <span className="mono">Beim Komponisten</span>
              <span className="link-stage__counter mono">{String(events.length).padStart(2, '0')} Ereignisse</span>
            </div>

            <div className="link-status">
              {[
                { label: 'Geöffnet', on: opened },
                { label: 'Angehört', on: listened },
                { label: 'Angefragt', on: inquired },
              ].map((entry) => (
                <div
                  className="link-status__row"
                  key={entry.label}
                  data-on={entry.on}
                >
                  <span className="link-status__dot" aria-hidden="true" />
                  <span>{entry.label}</span>
                  <span className="mono">{entry.on ? 'Ja' : 'Noch nicht'}</span>
                </div>
              ))}
            </div>

            <p className="link-stage__explain">
              Jeder dieser Zustände ist sichtbar, sobald er passiert. Keine Rätsel, keine
              Öffnungsstatistik ohne Bedeutung.
            </p>

            <ol className="event-log" aria-live="polite">
              {events.length === 0 && (
                <li className="event-log__empty mono">
                  Noch kein Ereignis. Öffnen Sie den Link links.
                </li>
              )}
              {events.map((event) => (
                <li key={event.id} className="event-log__item" data-step={step}>
                  <span className="event-log__time mono">{event.time}</span>
                  <span>
                    <strong>{event.label}</strong>
                    <span>{event.detail}</span>
                  </span>
                </li>
              ))}
            </ol>

            {inquired && (
              <div className="inquiry-ticket" role="status">
                <p className="mono">Neue Anfrage · Pipeline 01</p>
                <p className="inquiry-ticket__title">{TRACK.title}</p>
                <p className="inquiry-ticket__meta">
                  {name.trim()} — {project.trim()}
                  <br />
                  {usage.trim()}
                </p>
                <span className="inquiry-ticket__stage mono">Status: Neu</span>
              </div>
            )}

            <p className="link-stage__hint mono">
              Interaktiver Beispielablauf · In der Demo läuft die Übergabe über den echten
              Empfängerlink und den Server.
            </p>
          </aside>
        </div>
      </div>
      <span aria-hidden="true" className="link-section__signal">
        {getSignal().level > 0.2 ? 'SIGNAL' : 'RUHE'}
      </span>
    </section>
  );
}
