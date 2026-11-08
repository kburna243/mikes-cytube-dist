import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { PublicTrackRights } from '../../api/pitchApi';
import { RIGHTS_STATUS_LABEL, type PitchLinkRecord, type PitchTrack } from './types';
import { useAudio, sketchForTrack } from '../../audio/AudioProvider';
import { FilmScene } from '../../scene/FilmScene';
import { useReducedMotion } from '../../site/useReducedMotion';

interface RecipientPitchViewProps {
  tracks: PitchTrack[];
  link: PitchLinkRecord;
  composerName: string;
  studioLabel: string;
  /** Nur öffentliche Infoblatt-Felder — keine Akte */
  rights: Record<string, PublicTrackRights>;
  audioAvailability?: Record<string, boolean>;
  audioSrcFor?: (trackId: string) => string;
  onPlayTrack: (linkId: string, trackId: string) => Promise<void>;
  onSubmitInquiry: (input: {
    pitchLinkId: string;
    trackId: string;
    recipientName: string;
    productionTitle: string;
    usageScope: string;
    message: string;
  }) => Promise<void>;
  /** eingebettet in der App: kleinere Bühne, gleiche Funktion */
  embedded?: boolean;
}

/** Live-Wellenform aus dem Analyser; pausiert, wenn nichts klingt. */
function LiveWaveform({ active, accent }: { active: boolean; accent: string }) {
  const { getSignal } = useAudio();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext('2d');
    if (!context) return undefined;
    let frame = 0;
    const draw = () => {
      const ratio = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== Math.floor(width * ratio) || canvas.height !== Math.floor(height * ratio)) {
        canvas.width = Math.floor(width * ratio);
        canvas.height = Math.floor(height * ratio);
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      const signal = getSignal();
      const bars = Math.max(24, Math.floor(width / 6));
      const step = width / bars;
      for (let index = 0; index < bars; index += 1) {
        const amplitude = active
          ? 0.12 + signal.level * 0.9 * (0.5 + Math.abs(Math.sin(index * 0.7 + performance.now() / 420)))
          : 0.06;
        const barHeight = Math.max(1, amplitude * height * 0.86);
        context.fillStyle = accent;
        context.globalAlpha = index % 5 === 0 ? 0.9 : 0.45;
        context.fillRect(index * step, (height - barHeight) / 2, Math.max(1, step - 2), barHeight);
      }
      context.globalAlpha = 1;
      if (active && !reduced) frame = requestAnimationFrame(draw);
    };
    draw();
    if (active && !reduced) frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [active, accent, getSignal, reduced]);

  return (
    <canvas
      ref={canvasRef}
      className="vorfuehr__canvas"
      role="img"
      aria-label={active ? 'Live-Wellenform der laufenden Klangskizze' : 'Wellenform, kein Ton aktiv'}
    />
  );
}

export function RecipientPitchView({
  tracks,
  link,
  composerName,
  studioLabel,
  rights,
  audioAvailability,
  audioSrcFor,
  onPlayTrack,
  onSubmitInquiry,
  embedded = false,
}: RecipientPitchViewProps) {
  const { enabled, playing, meta, toggle, pause, playMedia, unavailable } = useAudio();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [infoId, setInfoId] = useState<string | null>(null);
  const [inquiryTrack, setInquiryTrack] = useState<PitchTrack | null>(null);
  const [recipientName, setRecipientName] = useState(link.recipientName);
  const [productionTitle, setProductionTitle] = useState(link.productionTitle);
  const [usageScope, setUsageScope] = useState('');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [moodFilter, setMoodFilter] = useState('ALLE');
  const [maxBpm, setMaxBpm] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const linkTracks = useMemo(
    () => tracks.filter((track) => link.trackIds.includes(track.id)),
    [tracks, link.trackIds]
  );
  const moods = useMemo(() => Array.from(new Set(linkTracks.map((track) => track.mood))), [linkTracks]);
  const filtered = useMemo(() => {
    const limit = maxBpm.trim() ? Number(maxBpm) : null;
    return linkTracks.filter((track) => {
      if (moodFilter !== 'ALLE' && track.mood !== moodFilter) return false;
      if (limit !== null && !Number.isNaN(limit) && track.bpm > limit) return false;
      return true;
    });
  }, [linkTracks, moodFilter, maxBpm]);

  const current = linkTracks.find((track) => track.id === playingId) || linkTracks[0];
  const sketch = current
    ? sketchForTrack({
        id: current.id,
        title: current.title,
        bpm: current.bpm,
        mood: current.mood,
        musicalKey: current.musicalKey,
      })
    : null;
  const accent = sketch?.accent || '#C3D3B6';
  const isActive = !!current && enabled && playing && meta.id === current.id;
  const hasFile = !!(current && audioAvailability?.[current.id] && audioSrcFor);

  async function handlePlay(track: PitchTrack) {
    setPlayingId(track.id);
    setPlayerError(null);
    const trackSketch = sketchForTrack({
      id: track.id,
      title: track.title,
      bpm: track.bpm,
      mood: track.mood,
      musicalKey: track.musicalKey,
    });
    const alreadyActive = enabled && playing && meta.id === track.id;
    if (alreadyActive) {
      pause();
      audioRef.current?.pause();
    } else if (audioAvailability?.[track.id] && audioSrcFor) {
      setPlayingId(track.id);
      window.setTimeout(() => {
        if (audioRef.current) void playMedia(audioRef.current, trackSketch);
      }, 0);
    } else {
      await toggle(trackSketch);
    }
    try {
      await onPlayTrack(link.id, track.id);
    } catch (error) {
      setPlayerError(
        error instanceof Error ? error.message : 'Die Wiedergabe konnte nicht vermerkt werden.'
      );
    }
  }

  async function handleSendInquiry(event: React.FormEvent) {
    event.preventDefault();
    if (!inquiryTrack) return;
    if (!recipientName.trim() || !productionTitle.trim() || !usageScope.trim()) {
      setFormError('Bitte geben Sie Ihren Namen, das Projekt und die geplante Nutzung an.');
      return;
    }
    setFormBusy(true);
    setFormError(null);
    try {
      await onSubmitInquiry({
        pitchLinkId: link.id,
        trackId: inquiryTrack.id,
        recipientName: recipientName.trim(),
        productionTitle: productionTitle.trim(),
        usageScope: usageScope.trim(),
        message: message.trim(),
      });
      setConfirmed(inquiryTrack.title);
      setInquiryTrack(null);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Ihre Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut.'
      );
    } finally {
      setFormBusy(false);
    }
  }

  return (
    <div className={`vorfuehr ${embedded ? 'vorfuehr--embedded' : ''}`} style={{ ['--accent' as string]: accent }}>
      {/* Vorführraum: Szene, Titel, Nachricht */}
      <header className="vorfuehr__hero">
        <FilmScene accent={accent} mode={sketch?.mode ?? 0} decorative />
        <div className="vorfuehr__scrim" aria-hidden="true" />
        <div className="vorfuehr__hero-inner">
          <div className="vorfuehr__studio">
            <p className="mono">Musikauswahl von {composerName}</p>
            <p className="mono">{studioLabel}</p>
          </div>
          <h1 className="vorfuehr__title">{link.productionTitle}</h1>
          {link.personalNote.trim() && (
            <p className="vorfuehr__note">„{link.personalNote}“</p>
          )}
          <div className="vorfuehr__status">
            <span className="mono" data-on={link.statusOpened}>Geöffnet</span>
            <span className="mono" data-on={link.statusListened}>Angehört</span>
            <span className="mono">Demo mit Fantasiedaten</span>
          </div>
        </div>
      </header>

      <div className="vorfuehr__body">
        {confirmed ? (
          <section className="vorfuehr__thanks" aria-labelledby="vorfuehr-thanks">
            <p className="mono">Anfrage angekommen</p>
            <h2 id="vorfuehr-thanks">Danke. {composerName.split(' ')[0]} hat Ihre Anfrage.</h2>
            <p className="vorfuehr__thanks-note">
              Es geht um „{confirmed}“. In dieser Demo wird keine E-Mail verschickt; die Anfrage
              erscheint direkt in der Komponistenansicht.
            </p>
            <button type="button" className="btn btn--accent" onClick={() => setConfirmed(null)}>
              Zurück zur Auswahl
            </button>
          </section>
        ) : inquiryTrack ? (
          <section className="vorfuehr__inquiry" aria-labelledby="vorfuehr-inquiry-heading">
            <button type="button" className="text-link" onClick={() => setInquiryTrack(null)}>
              ← Zurück zur Auswahl
            </button>
            <p className="mono">Anfrage · {inquiryTrack.title}</p>
            <h2 id="vorfuehr-inquiry-heading">Wofür brauchen Sie den Track?</h2>
            <p className="vorfuehr__inquiry-lead">
              Eine kurze, unverbindliche Nachricht an {composerName}. Keine Verpflichtung, kein
              Vertrag.
            </p>
            {formError && <p role="alert" className="vorfuehr__error">{formError}</p>}
            <form onSubmit={(event) => void handleSendInquiry(event)} noValidate className="vorfuehr__form">
              <label>
                Ihr Name
                <input value={recipientName} onChange={(event) => setRecipientName(event.target.value)} />
              </label>
              <label>
                Projekt
                <input value={productionTitle} onChange={(event) => setProductionTitle(event.target.value)} />
              </label>
              <label>
                Geplante Nutzung
                <input
                  value={usageScope}
                  onChange={(event) => setUsageScope(event.target.value)}
                  placeholder="z. B. Eröffnung Folge 2, TV & Mediathek, DACH, 3 Jahre"
                />
              </label>
              <label>
                Ihre Nachricht (freiwillig)
                <textarea rows={3} value={message} onChange={(event) => setMessage(event.target.value)} />
              </label>
              <button type="submit" className="btn btn--accent" disabled={formBusy}>
                {formBusy ? 'Wird gesendet …' : 'Anfrage senden'}
              </button>
            </form>
          </section>
        ) : (
          <>
            <div className="vorfuehr__program-head">
              <div>
                <p className="mono">Die Auswahl · {String(linkTracks.length).padStart(2, '0')} Tracks</p>
                <h2>Hören. Dann entscheiden.</h2>
              </div>
              <p className="mono vorfuehr__rights">
                Angaben zu Rechten: {RIGHTS_STATUS_LABEL}
              </p>
            </div>

            <div className="vorfuehr__player" data-active={isActive}>
              <div className="vorfuehr__player-top">
                <div>
                  <p className="mono">{current ? `Jetzt · ${current.title}` : 'Kein Track'}</p>
                  <p className="vorfuehr__player-sound">
                    {hasFile ? 'Originalaufnahme dieser Demo' : 'Klangskizze, im Browser erzeugt'}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn--accent"
                  onClick={() => current && void handlePlay(current)}
                  aria-pressed={isActive}
                >
                  {isActive ? 'Anhalten' : 'Abspielen'}
                </button>
              </div>
              <LiveWaveform active={isActive} accent={accent} />
              {current && (
                <div className="vorfuehr__player-foot">
                  <span className="mono">{current.bpm} BPM</span>
                  <span className="mono">{current.musicalKey}</span>
                  <span className="mono">{current.durationFormatted}</span>
                  <span className="mono">{isActive ? 'läuft' : 'bereit'}</span>
                </div>
              )}
              {hasFile && current && (
                <audio
                  ref={audioRef}
                  controls
                  preload="metadata"
                  src={audioSrcFor?.(current.id)}
                  className="vorfuehr__audio"
                  onPause={() => undefined}
                >
                  Ihr Browser kann diese Audiodatei nicht abspielen.
                </audio>
              )}
              {unavailable && (
                <p className="vorfuehr__fallback" role="status">
                  Ton ist in diesem Browser nicht verfügbar. Die Auswahl, das Infoblatt und die
                  Anfrage bleiben vollständig nutzbar.
                </p>
              )}
              {playerError && <p role="alert" className="vorfuehr__error">{playerError}</p>}
              <p className="mono vorfuehr__player-hint">
                Ton startet nur nach Ihrem Klick. Der Pegel steuert Szene und Schrift.
              </p>
            </div>

            {linkTracks.length > 2 && (
              <div className="vorfuehr__filter" role="group" aria-label="Auswahl filtern">
                <label>
                  <span className="mono">Stimmung</span>
                  <select value={moodFilter} onChange={(event) => setMoodFilter(event.target.value)}>
                    <option value="ALLE">Alle</option>
                    {moods.map((mood) => <option key={mood} value={mood}>{mood}</option>)}
                  </select>
                </label>
                <label>
                  <span className="mono">Tempo bis (BPM)</span>
                  <input type="number" inputMode="numeric" value={maxBpm} onChange={(event) => setMaxBpm(event.target.value)} placeholder="z. B. 120" />
                </label>
              </div>
            )}

            <ol className="vorfuehr__tracks" aria-label="Musikauswahl">
              {filtered.length === 0 && (
                <li className="vorfuehr__empty">
                  Kein Track passt zu dieser Filterung. Bitte setzen Sie die Filter zurück.
                </li>
              )}
              {filtered.map((track, index) => {
                const open = infoId === track.id;
                const trackActive = enabled && playing && meta.id === track.id;
                const activeRights = rights[track.id];
                return (
                  <li key={track.id} className="vorfuehr__track" data-active={trackActive}>
                    <div className="vorfuehr__track-row">
                      <span className="mono vorfuehr__track-no">{String(index + 1).padStart(2, '0')}</span>
                      <button
                        type="button"
                        className="vorfuehr__track-play"
                        onClick={() => void handlePlay(track)}
                        aria-label={`${track.title} ${trackActive ? 'anhalten' : 'abspielen'}`}
                      >
                        <span aria-hidden="true">{trackActive ? '❙❙' : '▶'}</span>
                      </button>
                      <div className="vorfuehr__track-text">
                        <h3>{track.title}</h3>
                        <p className="mono">
                          {track.mood} · {track.bpm} BPM · {track.musicalKey} · {track.durationFormatted}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="vorfuehr__info-toggle mono"
                        aria-expanded={open}
                        onClick={() => setInfoId(open ? null : track.id)}
                      >
                        {open ? 'Infoblatt zu' : 'Infoblatt'}
                      </button>
                      <button
                        type="button"
                        className="vorfuehr__inquiry-btn mono"
                        onClick={() => {
                          setInquiryTrack(track);
                          setUsageScope('');
                          setMessage('');
                          setFormError(null);
                        }}
                      >
                        Anfragen
                      </button>
                    </div>
                    {open && (
                      <div className="vorfuehr__info">
                        <div>
                          <p className="mono">Komposition</p>
                          <p>{track.composer}</p>
                        </div>
                        <div>
                          <p className="mono">Instrumente &amp; Stil</p>
                          <p>{track.instrumentation} · {track.genre}</p>
                        </div>
                        <div>
                          <p className="mono">Beschreibung</p>
                          <p>{track.description}</p>
                        </div>
                        <div>
                          <p className="mono">Beteiligte</p>
                          <p>
                            {activeRights
                              ? activeRights.splits
                                  .map((split) => `${split.personName} (${split.sharePercent} %)`)
                                  .join(', ')
                              : 'Keine Angabe'}
                          </p>
                        </div>
                        <div>
                          <p className="mono">Rechtestatus</p>
                          <p>{RIGHTS_STATUS_LABEL}</p>
                        </div>
                        <div>
                          <p className="mono">Hinweis</p>
                          <p>{hasFileNotice(audioAvailability, track.id)}</p>
                        </div>
                      </div>
                    )}
                    {trackActive && (
                      <div className="vorfuehr__track-wave">
                        <LiveWaveform active accent={accent} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>

            <footer className="vorfuehr__foot">
              <p className="mono">
                Demo mit Fantasiedaten · Angaben sind Eigenangaben, ungeprüft · Ton ist eine
                Browser-Klangskizze, keine Aufnahme
              </p>
              <p className="mono">Diese Seite zeigt nur diese Auswahl.</p>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

function hasFileNotice(availability: Record<string, boolean> | undefined, trackId: string): string {
  return availability?.[trackId]
    ? 'Für diesen Track liegt in der Demo eine Audiodatei vor.'
    : 'Für diesen Track liegt keine Audiodatei vor. Sie hören eine im Browser erzeugte Klangskizze.';
}
