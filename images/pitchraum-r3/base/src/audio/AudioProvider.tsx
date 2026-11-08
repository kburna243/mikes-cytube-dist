import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CINEMA, deriveSketchMeta, HERO_SKETCHES, type SketchMeta } from './sketchData';
import { sketchEngine, type SignalFrame } from './sketchEngine';

interface AudioState {
  /** Wurde der Ton vom Nutzer eingeschaltet? */
  enabled: boolean;
  playing: boolean;
  /** Aktuell klingende Skizze (oder zuletzt gewählte) */
  meta: SketchMeta;
  /** Audio wird vom Browser nicht unterstützt */
  unavailable: boolean;
  error: string | null;
}

interface AudioApi extends AudioState {
  /** Schaltet den Ton ein und startet die angegebene Skizze. */
  play: (meta: SketchMeta) => Promise<void>;
  /** Startet/wechselt einen Track; gleicher Track pausiert. */
  toggle: (meta: SketchMeta) => Promise<void>;
  pause: () => void;
  stop: () => void;
  enable: () => Promise<void>;
  getSignal: () => SignalFrame;
  /** echter Datei-Player, teilt sich Analyser & Pegel */
  playMedia: (element: HTMLAudioElement, meta: SketchMeta) => Promise<void>;
}

const AudioContext = createContext<AudioApi | null>(null);
const DEFAULT_META = HERO_SKETCHES[0];

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AudioState>({
    enabled: false,
    playing: false,
    meta: DEFAULT_META,
    unavailable: false,
    error: null,
  });
  const enabledRef = useRef(false);
  const getSignalStable = useCallback(() => sketchEngine.getSignal(), []);

  const enable = useCallback(async () => {
    if (!sketchEngine.available) {
      setState((prev) => ({
        ...prev,
        unavailable: true,
        error: 'Dieser Browser kann keinen Ton erzeugen. Die Bildergeschichte bleibt vollständig nutzbar.',
      }));
      return;
    }
    try {
      await sketchEngine.ensureContext();
      enabledRef.current = true;
      setState((prev) => ({ ...prev, enabled: true, unavailable: false, error: null }));
    } catch {
      setState((prev) => ({
        ...prev,
        unavailable: true,
        error: 'Der Ton konnte nicht gestartet werden. Die Seite funktioniert ohne Ton weiter.',
      }));
    }
  }, []);

  const play = useCallback(
    async (meta: SketchMeta) => {
      if (!enabledRef.current) await enable();
      if (!enabledRef.current) return;
      try {
        await sketchEngine.play(meta);
        setState((prev) => ({ ...prev, playing: true, meta, enabled: true, error: null }));
      } catch {
        setState((prev) => ({
          ...prev,
          playing: false,
          error: 'Die Klangskizze ließ sich nicht starten. Bitte versuche es erneut.',
        }));
      }
    },
    [enable]
  );

  const toggle = useCallback(
    async (meta: SketchMeta) => {
      if (!enabledRef.current) {
        await play(meta);
        return;
      }
      if (state.playing && state.meta.id === meta.id) {
        sketchEngine.pause();
        setState((prev) => ({ ...prev, playing: false }));
        return;
      }
      await play(meta);
    },
    [play, state.playing, state.meta.id]
  );

  const pause = useCallback(() => {
    sketchEngine.pause();
    setState((prev) => ({ ...prev, playing: false }));
  }, []);

  const stop = pause;

  const playMedia = useCallback(async (element: HTMLAudioElement, meta: SketchMeta) => {
    if (!enabledRef.current) await enable();
    try {
      await sketchEngine.playMedia(element, meta);
      setState((prev) => ({ ...prev, playing: true, meta, enabled: true }));
    } catch {
      setState((prev) => ({
        ...prev,
        playing: false,
        error: 'Die Audiodatei ließ sich nicht abspielen.',
      }));
    }
  }, [enable]);

  // Hörbare Klick-Rückmeldung auf Knöpfen, nur bei eingeschaltetem Ton.
  useEffect(() => {
    if (!state.enabled) return undefined;
    const playTickFor = (target: EventTarget | null) => {
      const element = target as HTMLElement | null;
      if (element?.closest('button, [role="button"], a[data-sound]')) sketchEngine.tick();
    };
    const onPointerDown = (event: PointerEvent) => playTickFor(event.target);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') playTickFor(event.target);
    };
    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [state.enabled]);

  // Global anhalten, wenn die Seite verlassen wird.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') {
        /* Audio darf weiterlaufen; nur die Szene pausiert. */
      }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  const api = useMemo<AudioApi>(
    () => ({
      ...state,
      play,
      toggle,
      pause,
      stop,
      enable,
      getSignal: getSignalStable,
      playMedia,
    }),
    [state, play, toggle, pause, stop, enable, playMedia, getSignalStable]
  );

  return <AudioContext.Provider value={api}>{children}</AudioContext.Provider>;
}

export function useAudio(): AudioApi {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio muss innerhalb des AudioProvider verwendet werden.');
  }
  return context;
}

/** Meta für einen echten Track (App, Empfängerlink, Künstlerseiten). */
export function sketchForTrack(track: {
  id: string;
  title: string;
  bpm: number;
  mood: string;
  musicalKey?: string;
}): SketchMeta {
  const derived = deriveSketchMeta(track);
  return { ...derived, accent: derived.accent || CINEMA.white };
}
