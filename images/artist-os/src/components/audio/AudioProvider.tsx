"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { TRACKS, type Track } from "@/lib/data";
import { ensureAudio } from "./bus";

export type PlayerApi = {
  tracks: Track[];
  index: number;
  track: Track;
  playing: boolean;
  started: boolean;
  time: number;
  duration: number;
  volume: number;
  rate: number;
  play: (i?: number) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (t: number) => void;
  setVolume: (v: number) => void;
  setRate: (r: number) => void;
  getAnalyser: () => AnalyserNode | null;
};

const PlayerCtx = createContext<PlayerApi | null>(null);

export function usePlayer(): PlayerApi {
  const ctx = useContext(PlayerCtx);
  if (!ctx) throw new Error("usePlayer must be used inside AudioProvider");
  return ctx;
}

/**
 * Persistent audio: one HTMLAudioElement routed through
 * MediaElementSource → BiquadFilter → Gain → Analyser → destination.
 * Lives in the root layout, so playback survives client-side navigation.
 */
export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const nodesRef = useRef<{ analyser: AnalyserNode; gain: GainNode; filter: BiquadFilterNode } | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(TRACKS[0].seconds);
  const [volume, setVolumeState] = useState(0.85);
  const [rate, setRateState] = useState(1);

  // create the element once
  useEffect(() => {
    const el = new Audio();
    el.src = TRACKS[0].src;
    el.preload = "metadata";
    el.crossOrigin = "anonymous";
    audioRef.current = el;
    const onEnded = () => {
      setIndex((i) => {
        const n = (i + 1) % TRACKS.length;
        queueMicrotask(() => loadAndPlay(n, true));
        return n;
      });
    };
    const onLoaded = () => setDuration(el.duration || TRACKS[index].seconds);
    el.addEventListener("ended", onEnded);
    el.addEventListener("loadedmetadata", onLoaded);
    let raf = 0;
    const loop = () => {
      if (audioRef.current) setTime(audioRef.current.currentTime);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("loadedmetadata", onLoaded);
      el.pause();
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildGraph = useCallback(async () => {
    if (nodesRef.current || !audioRef.current) return;
    const ctx = await ensureAudio();
    const src = ctx.createMediaElementSource(audioRef.current);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 20000;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.72;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(analyser);
    analyser.connect(ctx.destination);
    nodesRef.current = { analyser, gain, filter };
  }, [volume]);

  const loadAndPlay = useCallback(
    async (i: number, autoplay: boolean) => {
      const el = audioRef.current;
      if (!el) return;
      await buildGraph();
      if (el.dataset.trackId !== TRACKS[i].id) {
        el.dataset.trackId = TRACKS[i].id;
        el.src = TRACKS[i].src;
        el.currentTime = 0;
      }
      el.playbackRate = rate;
      if (autoplay) {
        try {
          await el.play();
          setPlaying(true);
          setStarted(true);
        } catch {
          setPlaying(false);
        }
      }
    },
    [buildGraph, rate]
  );

  const play = useCallback((i?: number) => {
    const target = typeof i === "number" ? i : index;
    setIndex(target);
    void loadAndPlay(target, true);
  }, [index, loadAndPlay]);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      void loadAndPlay(index, true);
    } else {
      el.pause();
      setPlaying(false);
    }
  }, [index, loadAndPlay]);

  const next = useCallback(() => {
    const n = (index + 1) % TRACKS.length;
    setIndex(n);
    void loadAndPlay(n, playing || true);
  }, [index, loadAndPlay, playing]);

  const prev = useCallback(() => {
    const el = audioRef.current;
    if (el && el.currentTime > 3) {
      el.currentTime = 0;
      return;
    }
    const p = (index - 1 + TRACKS.length) % TRACKS.length;
    setIndex(p);
    void loadAndPlay(p, true);
  }, [index, loadAndPlay]);

  const seek = useCallback((t: number) => {
    const el = audioRef.current;
    if (el) el.currentTime = t;
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (nodesRef.current) nodesRef.current.gain.gain.value = v;
    else if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const setRate = useCallback((r: number) => {
    setRateState(r);
    if (audioRef.current) audioRef.current.playbackRate = r;
  }, []);

  const getAnalyser = useCallback(() => nodesRef.current?.analyser ?? null, []);

  const api = useMemo<PlayerApi>(
    () => ({
      tracks: TRACKS,
      index,
      track: TRACKS[index],
      playing,
      started,
      time,
      duration: duration || TRACKS[index].seconds,
      volume,
      rate,
      play,
      toggle,
      next,
      prev,
      seek,
      setVolume,
      setRate,
      getAnalyser,
    }),
    [index, playing, started, time, duration, volume, rate, play, toggle, next, prev, seek, setVolume, setRate, getAnalyser]
  );

  return <PlayerCtx.Provider value={api}>{children}</PlayerCtx.Provider>;
}
