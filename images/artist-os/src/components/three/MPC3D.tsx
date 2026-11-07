"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Box, Keyboard, MousePointer2, Play, Square, RotateCw, Volume2, Sparkles } from "lucide-react";
import { getMpcEngine, PAD_NAMES, BANK_LABELS, type Bank } from "@/components/audio/mpcEngine";
import { clamp, lerp } from "@/components/audio/bus";
import MPC2D from "./MPC2D";
import { useLang } from "@/lib/useLang";

const T = {
  de: {
    view2d: "2D Ansicht",
    pads: "Pads klicken · Tasten 1-4, Q-R, A-F, Z-V",
    steps: "Steps klicken = Beat programmieren",
    space: "Leertaste = Play/Stop",
    cutoff: "Cutoff-Regler: Drag / Scroll",
  },
  en: {
    view2d: "2D view",
    pads: "Click pads · keys 1-4, Q-R, A-F, Z-V",
    steps: "Click steps to program the beat",
    space: "Space = Play/Stop",
    cutoff: "Cutoff knob: drag / scroll",
  },
} as const;

const KEY_ROWS = ["1234", "qwer", "asdf", "zxcv"];
const ORANGE_HEX = "#e85c0d";
const SUNBURST_HEX = "#f6b436";
const TS = 0.01; // 100 iso units = 1m in Three.js
const W = (x: number, y: number, z: number) => new THREE.Vector3(x * TS, z * TS, y * TS);

function roundRectShape(sh: THREE.Shape, x: number, y: number, w: number, h: number, r: number) {
  r = Math.max(0.01, Math.min(r, w / 2 - 0.01, h / 2 - 0.01));
  sh.moveTo(x + r, y);
  sh.lineTo(x + w - r, y);
  sh.quadraticCurveTo(x + w, y, x + w, y + r);
  sh.lineTo(x + w, y + h - r);
  sh.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  sh.lineTo(x + r, y + h);
  sh.quadraticCurveTo(x, y + h, x, y + h - r);
  sh.lineTo(x, y + r);
  sh.quadraticCurveTo(x, y, x + r, y);
}

/**
 * Authentic Iso-Glow Drum Machine (DR-16 / Noizy Edition):
 * Dark technical housing, 1px crisp hairlines, glowing amber LCD glass,
 * 16 pads with glowing selection ring, 16 step sequencer with running LEDs,
 * and built-in Web Audio synthesis + Noizy stems.
 */
export default function MPC3D() {
  const __lang = useLang();
  const __t = T[__lang];
  const hostRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [mode2d, setMode2d] = useState(false);
  const [bank, setBank] = useState<Bank>("A");
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPad, setSelectedPad] = useState(0);
  const [cutoffUI, setCutoffUI] = useState(18000);
  const [lastPadName, setLastPadName] = useState("KICK");

  const bankRef = useRef<Bank>("A");
  const triggerPadRef = useRef<((idx: number) => void) | null>(null);
  const togglePlayRef = useRef<(() => void) | null>(null);
  const toggleStepRef = useRef<((step: number) => void) | null>(null);

  useEffect(() => {
    bankRef.current = bank;
  }, [bank]);

  // ---------------- 3D Scene Effect ----------------
  useEffect(() => {
    const host = hostRef.current;
    if (!host || mode2d) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      setFailed(true);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);

    // Iso view default angle: 45° yaw, ~35.264° pitch
    const ISO_DIST = 5.2;
    let yaw = Math.PI * 0.25;
    let pitch = 0.62;
    let tYaw = yaw;
    let tPitch = pitch;
    const target = new THREE.Vector3(1.5, 0.25, 1.4);

    // Lighting setup
    scene.add(new THREE.AmbientLight(0xfff3e6, 0.95));
    const dirLight = new THREE.DirectionalLight(0xffecd6, 1.8);
    dirLight.position.set(5, 9, 6);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0xe85c0d, 1.2);
    rimLight.position.set(-6, 4, -4);
    scene.add(rimLight);

    // Base materials (Iso-Glow dark palette)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x18191c,
      roughness: 0.85,
      metalness: 0.12,
    });
    const recessMat = new THREE.MeshStandardMaterial({
      color: 0x0f1012,
      roughness: 0.95,
      metalness: 0.05,
    });
    const edgeLineMat = new THREE.LineBasicMaterial({
      color: 0x3e4249,
      depthTest: true,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -2,
    });
    const accentLineMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(ORANGE_HEX),
      depthTest: true,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -4,
    });

    const root = new THREE.Group();
    scene.add(root);

    // Box helper with edge hairlines
    function rbox(x: number, y: number, z: number, w: number, d: number, h: number, r = 0, mat = bodyMat, parent = root) {
      const sh = new THREE.Shape();
      roundRectShape(sh, x, -(y + d), w, d, r);
      const g = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false, curveSegments: 12 });
      g.rotateX(-Math.PI / 2);
      g.translate(0, z, 0);
      g.scale(TS, TS, TS);
      const mesh = new THREE.Mesh(g, mat);
      parent.add(mesh);

      // 1px crisp edge line
      const eg = new THREE.EdgesGeometry(g, 26);
      const lines = new THREE.LineSegments(eg, edgeLineMat);
      mesh.add(lines);

      return mesh;
    }

    // Geometry parameters (from Iso-Glow Fig 2 DRUM MACHINE)
    const PZ = 7, BX = 20, BY = 20, BW = 260, BD = 244, DZ = 29, BF = BY + BD, HZ = 66, HF = 62;
    const PADX = 30, PADY = 74, PS = 34, PG = 6, PH = 7;
    const SX = 34, SP = 14.5, SY = 241, SW = 11, SD = 12, SH = 4, LEDY = 235;
    const PAD_VOICE_NAMES = [
      "kick", "snare", "c.hat", "o.hat",
      "clap", "rim", "tom lo", "tom mid",
      "tom hi", "cowbell", "clave", "shaker",
      "crash", "conga", "zap", "sub"
    ];
    const PAD_KEYS = ["1", "2", "3", "4", "q", "w", "e", "r", "a", "s", "d", "f", "z", "x", "c", "v"];

    // 1. Ground plate with 4 corner screw discs
    rbox(0, 0, 0, 300, 284, PZ, 14, bodyMat, root);
    [[14, 14], [286, 14], [14, 270], [286, 270]].forEach(([x, y]) => {
      const screwGeo = new THREE.CircleGeometry(3 * TS, 16);
      const screw = new THREE.Mesh(screwGeo, recessMat);
      screw.rotation.x = -Math.PI / 2;
      screw.position.copy(W(x, y, PZ + 0.05));
      root.add(screw);

      const slotGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-1.8 * TS, 0, 0),
        new THREE.Vector3(1.8 * TS, 0, 0),
      ]);
      const slot = new THREE.Line(slotGeo, edgeLineMat);
      slot.position.copy(W(x, y, PZ + 0.08));
      root.add(slot);
    });

    // 2. Main Deck Housing
    rbox(BX, BY, PZ, BW, BD, DZ - PZ, 8, bodyMat, root);

    // Front details: Model name "NOIZY DR-16" & USB slot
    const badgeCanvas = document.createElement("canvas");
    badgeCanvas.width = 256;
    badgeCanvas.height = 64;
    const bgctx = badgeCanvas.getContext("2d")!;
    bgctx.fillStyle = "#8a8f9c";
    bgctx.font = "900 24px 'Space Mono', monospace";
    bgctx.letterSpacing = "2px";
    bgctx.fillText("NOIZY DR-16", 10, 40);
    const badgeTex = new THREE.CanvasTexture(badgeCanvas);
    badgeTex.colorSpace = THREE.SRGBColorSpace;
    const badge = new THREE.Mesh(
      new THREE.PlaneGeometry(38 * TS, 9.5 * TS),
      new THREE.MeshBasicMaterial({ map: badgeTex, transparent: true })
    );
    badge.position.copy(W(BX + BW - 60, BF + 0.1, DZ - 10));
    root.add(badge);

    // 3. Slanted Back Housing (Holds the Display)
    rbox(BX, BY, DZ, BW, HF - BY, HZ - DZ, 6, bodyMat, root);

    // 4. Backlit Amber LCD Display
    const GW = 172, GH = 26;
    const scrCanvas = document.createElement("canvas");
    scrCanvas.width = 688;
    scrCanvas.height = 104;
    const scrTex = new THREE.CanvasTexture(scrCanvas);
    scrTex.colorSpace = THREE.SRGBColorSpace;

    const screenMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(GW * TS, GH * TS),
      new THREE.MeshBasicMaterial({ map: scrTex, toneMapped: false })
    );
    screenMesh.position.copy(W(BX + 14 + GW / 2, HF + 0.35, HZ - 6 - GH / 2));
    root.add(screenMesh);

    // Ambient Halo Bloom behind display
    const haloMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(ORANGE_HEX),
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(GW * TS * 1.3, GH * TS * 2.5),
      haloMat
    );
    halo.position.copy(screenMesh.position).add(new THREE.Vector3(0, 0, -0.002));
    root.add(halo);

    // RUN indicator LED
    const runLedMat = new THREE.MeshStandardMaterial({
      color: 0x22170f,
      emissive: new THREE.Color(ORANGE_HEX),
      emissiveIntensity: 0,
      roughness: 0.3,
    });
    const runLed = new THREE.Mesh(new THREE.CircleGeometry(2.2 * TS, 16), runLedMat);
    runLed.position.copy(W(BX + 204, HF + 0.25, HZ - 13));
    root.add(runLed);

    // Sequencer State
    const BPM = 112;
    const STEP_MS = (60000 / BPM) / 4;
    const state = {
      playing: false,
      step: -1,
      selectedPad: 0,
      timer: null as NodeJS.Timeout | null,
      // 16 pads x 16 steps pattern
      patterns: Array.from({ length: 16 }, () => Array(16).fill(false)),
    };

    // Pre-program authentic Boombap/Funk demo pattern on start
    // Kick (0): steps 0, 6, 8, 10
    [0, 6, 8, 10].forEach((s) => (state.patterns[0][s] = true));
    // Snare (1): steps 4, 12
    [4, 12].forEach((s) => (state.patterns[1][s] = true));
    // Closed Hat (2): 8th notes
    [0, 2, 4, 6, 8, 10, 12, 14].forEach((s) => (state.patterns[2][s] = true));
    // Shaker (11): 16th groove on off-beats
    [1, 3, 5, 7, 9, 11, 13, 15].forEach((s) => (state.patterns[11][s] = true));

    // Screen redraw logic
    const drawScreen = () => {
      const c = scrCanvas.getContext("2d")!;
      const w = scrCanvas.width;
      const h = scrCanvas.height;

      // Dark amber glass background
      c.fillStyle = "#160e04";
      c.fillRect(0, 0, w, h);

      // Scanline pattern
      c.fillStyle = "rgba(0,0,0,0.3)";
      for (let y = 0; y < h; y += 4) c.fillRect(0, y, w, 2);

      // Glowing border
      c.strokeStyle = ORANGE_HEX;
      c.lineWidth = 3;
      c.shadowColor = ORANGE_HEX;
      c.shadowBlur = 10;
      c.strokeRect(4, 4, w - 8, h - 8);

      // Text Header: BPM & Playing State
      c.fillStyle = SUNBURST_HEX;
      c.font = "bold 28px 'Space Mono', monospace";
      c.textBaseline = "alphabetic";
      const statusText = state.playing
        ? `${BPM} BPM ▶ ${String(state.step + 1).padStart(2, "0")}/16`
        : `${BPM} BPM ■`;
      c.fillText(statusText, 22, 42);

      // Current Selected Pad & Hit count
      const activePadName = PAD_VOICE_NAMES[state.selectedPad].toUpperCase();
      const hitsCount = state.patterns[state.selectedPad].filter(Boolean).length;
      c.font = "20px 'Space Mono', monospace";
      c.fillStyle = "#ffcf8f";
      c.fillText(`PAD ${activePadName} · ${hitsCount} STEPS`, 22, 78);

      // 16 Step indicators grid on the right side
      const stepStartX = 320;
      for (let i = 0; i < 16; i++) {
        const sx = stepStartX + i * 21;
        const sy = i % 4 === 0 ? 24 : 28;
        const sh = i % 4 === 0 ? 38 : 30;
        const hasHit = state.patterns[state.selectedPad][i];
        const isCurrentStep = state.playing && state.step === i;

        c.strokeStyle = isCurrentStep ? "#ffffff" : ORANGE_HEX;
        c.lineWidth = isCurrentStep ? 3 : 2;
        c.fillStyle = isCurrentStep ? "#ffffff" : hasHit ? ORANGE_HEX : "transparent";

        c.strokeRect(sx, sy, 15, sh);
        if (hasHit || isCurrentStep) {
          c.fillRect(sx, sy, 15, sh);
        }
      }

      // Step cursor dot on the active step
      if (state.playing && state.step >= 0) {
        c.fillStyle = "#ffffff";
        c.fillRect(stepStartX + state.step * 21, 74, 15, 6);
      }

      c.shadowBlur = 0;
      scrTex.needsUpdate = true;
    };
    drawScreen();

    // 5. 16 Drum Pads (4x4 Matrix)
    type PadItem = {
      group: THREE.Group;
      mat: THREE.MeshStandardMaterial;
      ring: THREE.LineSegments;
      padIdx: number;
    };
    const pads: PadItem[] = [];

    for (let r = 0; r < 4; r++) {
      for (let col = 0; col < 4; col++) {
        const i = r * 4 + col;
        const x = PADX + col * (PS + PG);
        const y = PADY + r * (PS + PG);

        const padGroup = new THREE.Group();
        padGroup.userData = { padIdx: i };
        root.add(padGroup);

        const padMat = new THREE.MeshStandardMaterial({
          color: 0x1c1e22,
          roughness: 0.65,
          metalness: 0.1,
          emissive: new THREE.Color(ORANGE_HEX),
          emissiveIntensity: 0.08,
        });

        // Rounded Pad box
        rbox(x, y, DZ, PS, PS, PH, 3, padMat, padGroup);

        // Pad printed text: Name + Hotkey
        const padCanvas = document.createElement("canvas");
        padCanvas.width = 128;
        padCanvas.height = 128;
        const pctx = padCanvas.getContext("2d")!;
        pctx.fillStyle = "#a8adb8";
        pctx.font = "bold 24px 'Space Mono', monospace";
        pctx.fillText(PAD_VOICE_NAMES[i], 12, 108);
        pctx.fillStyle = "#e85c0d";
        pctx.font = "bold 22px 'Space Mono', monospace";
        pctx.fillText(PAD_KEYS[i].toUpperCase(), 94, 32);
        const padTex = new THREE.CanvasTexture(padCanvas);
        padTex.colorSpace = THREE.SRGBColorSpace;

        const padLabel = new THREE.Mesh(
          new THREE.PlaneGeometry(PS * TS * 0.9, PS * TS * 0.9),
          new THREE.MeshBasicMaterial({ map: padTex, transparent: true })
        );
        padLabel.rotation.x = -Math.PI / 2;
        padLabel.position.copy(W(x + PS / 2, y + PS / 2, DZ + PH + 0.12));
        padGroup.add(padLabel);

        // Glowing selection ring (Iso-Glow signature active pad outline)
        const ringPts = [
          new THREE.Vector3((x + 1) * TS, (DZ + PH + 0.16) * TS, -(y + 1) * TS),
          new THREE.Vector3((x + PS - 1) * TS, (DZ + PH + 0.16) * TS, -(y + 1) * TS),
          new THREE.Vector3((x + PS - 1) * TS, (DZ + PH + 0.16) * TS, -(y + 1) * TS),
          new THREE.Vector3((x + PS - 1) * TS, (DZ + PH + 0.16) * TS, -(y + PS - 1) * TS),
          new THREE.Vector3((x + PS - 1) * TS, (DZ + PH + 0.16) * TS, -(y + PS - 1) * TS),
          new THREE.Vector3((x + 1) * TS, (DZ + PH + 0.16) * TS, -(y + PS - 1) * TS),
          new THREE.Vector3((x + 1) * TS, (DZ + PH + 0.16) * TS, -(y + PS - 1) * TS),
          new THREE.Vector3((x + 1) * TS, (DZ + PH + 0.16) * TS, -(y + 1) * TS),
        ];
        const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPts);
        const ring = new THREE.LineSegments(ringGeo, accentLineMat);
        ring.visible = i === 0;
        padGroup.add(ring);

        pads.push({ group: padGroup, mat: padMat, ring, padIdx: i });
      }
    }

    // 6. Play / Stop Transport Button
    const playGroup = new THREE.Group();
    playGroup.userData = { isPlayBtn: true };
    root.add(playGroup);

    const playMat = new THREE.MeshStandardMaterial({
      color: 0x1f2126,
      emissive: new THREE.Color(ORANGE_HEX),
      emissiveIntensity: 0.1,
      roughness: 0.6,
    });
    rbox(206, 186, DZ, 56, 40, 6, 4, playMat, playGroup);

    // Play & Stop glyphs on the button top
    const glyphCanvas = document.createElement("canvas");
    glyphCanvas.width = 224;
    glyphCanvas.height = 160;
    const gctx = glyphCanvas.getContext("2d")!;
    gctx.fillStyle = SUNBURST_HEX;
    // Play triangle
    gctx.beginPath();
    gctx.moveTo(60, 48);
    gctx.lineTo(60, 112);
    gctx.lineTo(105, 80);
    gctx.closePath();
    gctx.fill();
    // Stop square
    gctx.fillRect(130, 52, 48, 56);

    const glyphTex = new THREE.CanvasTexture(glyphCanvas);
    glyphTex.colorSpace = THREE.SRGBColorSpace;
    const glyphMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(56 * TS, 40 * TS),
      new THREE.MeshBasicMaterial({ map: glyphTex, transparent: true })
    );
    glyphMesh.rotation.x = -Math.PI / 2;
    glyphMesh.position.copy(W(206 + 28, 186 + 20, DZ + 6.15));
    playGroup.add(glyphMesh);

    // 7. 16 Step Sequencer Buttons & Step LEDs
    type StepItem = {
      group: THREE.Group;
      mat: THREE.MeshStandardMaterial;
      ledMat: THREE.MeshStandardMaterial;
      stepIdx: number;
    };
    const stepItems: StepItem[] = [];

    for (let i = 0; i < 16; i++) {
      const stepGroup = new THREE.Group();
      stepGroup.userData = { stepIdx: i };
      root.add(stepGroup);

      const sMat = new THREE.MeshStandardMaterial({
        color: 0x1c1e22,
        emissive: new THREE.Color(ORANGE_HEX),
        emissiveIntensity: 0,
        roughness: 0.7,
      });
      rbox(SX + i * SP, SY, DZ, SW, SD, SH, 1.5, sMat, stepGroup);

      // Step LED above button
      const ledMat = new THREE.MeshStandardMaterial({
        color: 0x16120e,
        emissive: new THREE.Color(ORANGE_HEX),
        emissiveIntensity: 0,
        roughness: 0.3,
      });
      const led = new THREE.Mesh(new THREE.CircleGeometry(1.8 * TS, 12), ledMat);
      led.rotation.x = -Math.PI / 2;
      led.position.copy(W(SX + i * SP + SW / 2, LEDY, DZ + 0.08));
      root.add(led);

      stepItems.push({ group: stepGroup, mat: sMat, ledMat, stepIdx: i });
    }

    // Cutoff Knob (Iso-Glow styled)
    const knobGroup = new THREE.Group();
    knobGroup.userData = { isKnob: true };
    const knobMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(8 * TS, 9 * TS, 8 * TS, 24),
      new THREE.MeshStandardMaterial({ color: 0x222428, roughness: 0.4, metalness: 0.6 })
    );
    knobMesh.position.copy(W(BX + 220, BY + 115, DZ + 6));
    knobGroup.add(knobMesh);

    const knobIndicator = new THREE.Mesh(
      new THREE.BoxGeometry(1 * TS, 1.2 * TS, 7 * TS),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(SUNBURST_HEX) })
    );
    knobIndicator.position.set(0, 4.2 * TS, 0);
    knobMesh.add(knobIndicator);
    root.add(knobGroup);

    // Audio Synthesis Voices (Web Audio from Iso-Glow)
    let audioCtx: AudioContext | null = null;
    let noiseBuf: AudioBuffer | null = null;

    const getAudio = () => {
      try {
        if (!audioCtx) {
          const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          audioCtx = new AC();
        }
        if (audioCtx.state === "suspended") void audioCtx.resume();
        return audioCtx;
      } catch {
        return null;
      }
    };

    const getNoise = (ctx: AudioContext) => {
      if (!noiseBuf) {
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const data = noiseBuf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      }
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      return src;
    };

    const playVoice = (padIdx: number) => {
      // Also trigger MpcEngine so stems & loops sync
      const eng = getMpcEngine();
      if (bankRef.current !== "A") {
        void eng.trigger(bankRef.current, padIdx);
      }

      const ctx = getAudio();
      if (!ctx) return;
      const t = ctx.currentTime + 0.005;
      const out = ctx.createGain();
      out.gain.value = 0.8;
      out.connect(ctx.destination);

      const osc = (type: OscillatorType, f0: number, f1: number, dur: number, gainPeak: number) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(f0, t);
        if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.7);
        g.gain.setValueAtTime(0.001, t);
        g.gain.exponentialRampToValueAtTime(gainPeak, t + 0.002);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g);
        g.connect(out);
        o.start(t);
        o.stop(t + dur + 0.05);
      };

      const noiseHiss = (dur: number, filterFreq: number, filterType: BiquadFilterType, gainPeak: number) => {
        const src = getNoise(ctx);
        const flt = ctx.createBiquadFilter();
        flt.type = filterType;
        flt.frequency.value = filterFreq;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.001, t);
        g.gain.exponentialRampToValueAtTime(gainPeak, t + 0.002);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        src.connect(flt);
        flt.connect(g);
        g.connect(out);
        src.start(t);
        src.stop(t + dur + 0.05);
      };

      switch (padIdx) {
        case 0: // kick
          osc("sine", 160, 42, 0.42, 1.0);
          break;
        case 1: // snare
          noiseHiss(0.2, 1400, "highpass", 0.65);
          osc("triangle", 190, 150, 0.12, 0.45);
          break;
        case 2: // c.hat
          noiseHiss(0.06, 7500, "highpass", 0.5);
          break;
        case 3: // o.hat
          noiseHiss(0.38, 7000, "highpass", 0.45);
          break;
        case 4: // clap
          [0, 0.012, 0.024].forEach((d) => {
            const g = ctx.createGain();
            g.connect(out);
            g.gain.setValueAtTime(0.6, t + d);
            g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.015);
            const n = getNoise(ctx);
            const f = ctx.createBiquadFilter();
            f.type = "bandpass";
            f.frequency.value = 1400;
            n.connect(f);
            f.connect(g);
            n.start(t + d);
            n.stop(t + d + 0.02);
          });
          break;
        case 5: // rim
          osc("triangle", 1700, 1700, 0.03, 0.5);
          break;
        case 6: // tom lo
          osc("sine", 100, 65, 0.38, 0.85);
          break;
        case 7: // tom mid
          osc("sine", 145, 95, 0.34, 0.85);
          break;
        case 8: // tom hi
          osc("sine", 200, 135, 0.28, 0.85);
          break;
        case 9: // cowbell
          osc("square", 540, 540, 0.28, 0.25);
          osc("square", 800, 800, 0.28, 0.25);
          break;
        case 10: // clave
          osc("sine", 2500, 2500, 0.06, 0.5);
          break;
        case 11: // shaker
          noiseHiss(0.12, 5000, "highpass", 0.4);
          break;
        case 12: // crash
          noiseHiss(1.2, 4500, "highpass", 0.35);
          break;
        case 13: // conga
          osc("sine", 340, 280, 0.2, 0.75);
          break;
        case 14: // zap
          osc("square", 1500, 60, 0.16, 0.25);
          break;
        case 15: // sub
          osc("sine", 75, 45, 0.65, 0.95);
          break;
      }
    };

    // Pad Hit Action: physical sink & emissive flash
    const padFlashEnergy = new Float32Array(16);
    const triggerPad = (idx: number) => {
      getAudio();
      state.selectedPad = idx;
      setSelectedPad(idx);
      setLastPadName(PAD_VOICE_NAMES[idx].toUpperCase());
      padFlashEnergy[idx] = 1.0;

      // Update active selection ring
      pads.forEach((p, i) => {
        p.ring.visible = i === idx;
      });

      // Update step button latches for newly selected pad
      stepItems.forEach((s, stepIdx) => {
        s.mat.emissiveIntensity = state.patterns[idx][stepIdx] ? 0.6 : 0;
      });

      playVoice(idx);
      drawScreen();
    };
    triggerPadRef.current = triggerPad;

    // Toggle step on current selected pad
    const toggleStep = (stepIdx: number) => {
      getAudio();
      const current = state.patterns[state.selectedPad][stepIdx];
      state.patterns[state.selectedPad][stepIdx] = !current;
      stepItems[stepIdx].mat.emissiveIntensity = !current ? 0.8 : 0;
      if (!current && !state.playing) {
        playVoice(state.selectedPad);
      }
      drawScreen();
    };
    toggleStepRef.current = toggleStep;

    // Sequencer Clock Tick
    const tick = () => {
      state.step = (state.step + 1) % 16;
      // Play all pads that have a hit on this step
      state.patterns.forEach((pat, padIdx) => {
        if (pat[state.step]) {
          padFlashEnergy[padIdx] = 0.9;
          playVoice(padIdx);
        }
      });

      // Step LEDs pulse
      stepItems.forEach((s, idx) => {
        const isCurrent = idx === state.step;
        s.ledMat.emissiveIntensity = isCurrent ? 1.6 : 0;
      });

      drawScreen();
    };

    // Play/Stop Toggle
    const togglePlay = () => {
      getAudio();
      const nextPlaying = !state.playing;
      state.playing = nextPlaying;
      setIsPlaying(nextPlaying);
      runLedMat.emissiveIntensity = nextPlaying ? 1.4 : 0;
      haloMat.opacity = nextPlaying ? 0.32 : 0.18;
      playMat.emissiveIntensity = nextPlaying ? 0.8 : 0.1;

      if (nextPlaying) {
        state.step = -1;
        tick();
        state.timer = setInterval(tick, STEP_MS);
      } else {
        if (state.timer) clearInterval(state.timer);
        state.timer = null;
        state.step = -1;
        stepItems.forEach((s) => {
          s.ledMat.emissiveIntensity = 0;
        });
      }
      drawScreen();
    };
    togglePlayRef.current = togglePlay;

    // Cutoff apply
    const applyCutoff = (hz: number) => {
      const v = clamp(hz, 40, 19000);
      setCutoffUI(Math.round(v));
      getMpcEngine().setCutoff(v);
      const t = (Math.log(v) - Math.log(40)) / (Math.log(19000) - Math.log(40));
      knobMesh.rotation.y = lerp(2.2, -2.2, t);
    };
    applyCutoff(18000);

    // ---------------- Interaction ----------------
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isDragging = false;
    let dragMode: "orbit" | "knob" | null = null;
    let lastMouseX = 0;
    let lastMouseY = 0;

    const getRaycastHits = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      return raycaster.intersectObjects(root.children, true);
    };

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      renderer.domElement.setPointerCapture(e.pointerId);

      const hits = getRaycastHits(e.clientX, e.clientY);
      if (hits.length > 0) {
        let obj: THREE.Object3D | null = hits[0].object;
        while (obj && obj !== root) {
          if (obj.userData?.padIdx !== undefined) {
            triggerPad(obj.userData.padIdx);
            return;
          }
          if (obj.userData?.stepIdx !== undefined) {
            toggleStep(obj.userData.stepIdx);
            return;
          }
          if (obj.userData?.isPlayBtn) {
            togglePlay();
            return;
          }
          if (obj.userData?.isKnob) {
            dragMode = "knob";
            return;
          }
          obj = obj.parent;
        }
      }
      dragMode = "orbit";
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;

      if (dragMode === "orbit") {
        tYaw = clamp(tYaw - dx * 0.006, -0.2, Math.PI * 0.7);
        tPitch = clamp(tPitch + dy * 0.005, 0.35, 1.25);
      } else if (dragMode === "knob") {
        applyCutoff(cutoffUI * Math.exp(-dy * 0.008));
      }
    };

    const onPointerUp = () => {
      isDragging = false;
      dragMode = null;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      applyCutoff(cutoffUI * Math.exp(-e.deltaY * 0.0015));
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    // Keyboard controls
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === " ") {
        e.preventDefault();
        togglePlay();
        return;
      }
      const k = e.key.toLowerCase();
      const rIdx = KEY_ROWS.findIndex((r) => r.includes(k));
      if (rIdx >= 0) {
        e.preventDefault();
        const pIdx = rIdx * 4 + KEY_ROWS[rIdx].indexOf(k);
        triggerPad(pIdx);
      }
    };
    window.addEventListener("keydown", onKeyDown);

    // Resize handler
    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    // Render loop
    const clock = new THREE.Clock();
    let raf = 0;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);

      // Pad flash decay and press sink physics
      for (let i = 0; i < 16; i++) {
        if (padFlashEnergy[i] > 0.01) {
          padFlashEnergy[i] *= Math.exp(-dt * 9.0);
        } else {
          padFlashEnergy[i] = 0;
        }
        const energy = padFlashEnergy[i];
        const p = pads[i];
        p.mat.emissiveIntensity = 0.08 + energy * 2.2;
        p.group.position.y = -energy * 0.03; // sink pad by ~3mm
      }

      // Smooth camera interpolation
      yaw = lerp(yaw, tYaw, 0.09);
      pitch = lerp(pitch, tPitch, 0.09);
      camera.position.set(
        target.x + Math.sin(yaw) * Math.cos(pitch) * ISO_DIST,
        target.y + Math.sin(pitch) * ISO_DIST,
        target.z + Math.cos(yaw) * Math.cos(pitch) * ISO_DIST
      );
      camera.lookAt(target);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (state.timer) clearInterval(state.timer);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);

      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) {
          o.geometry.dispose();
          const m = o.material as THREE.Material | THREE.Material[];
          (Array.isArray(m) ? m : [m]).forEach((mat) => mat.dispose());
        }
      });
      scrTex.dispose();
      badgeTex.dispose();
      glyphTex.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode2d]);

  if (failed || mode2d) {
    return (
      <div>
        <div className="mb-3 flex justify-end">
          <button
            onClick={() => setMode2d(false)}
            className="flex items-center gap-2 rounded-lg border border-vinyl/50 bg-[#16171b] px-3.5 py-1.5 font-mono text-xs font-bold text-vinyl tracking-wider uppercase transition hover:bg-vinyl hover:text-ink"
          >
            <Box className="size-3.5" /> 3D Iso-Glow Ansicht
          </button>
        </div>
        <MPC2D
          bank={bank}
          setBank={setBank}
          firePad={(p) => triggerPadRef.current?.(p)}
          looping={new Set()}
          lastPad={lastPadName}
          cutoff={cutoffUI}
        />
      </div>
    );
  }

  return (
    <div className="group relative">
      <div
        className="stage-3d relative h-[480px] w-full overflow-hidden rounded-2xl border-2 border-[#2b2e35] bg-[#111111] shadow-[0_16px_50px_rgba(0,0,0,0.85)] sm:h-[600px]"
        ref={hostRef}
      >
        {/* Top-Left Iso-Glow Badge & Readout */}
        <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-md border border-vinyl/40 bg-vinyl/15 px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest text-vinyl uppercase backdrop-blur-xs">
              <Sparkles className="size-3" /> ISO-GLOW · DR-16
            </span>
            <span className="rounded-md border border-[#343842] bg-[#1a1c22]/90 px-2.5 py-1 font-mono text-[10px] font-bold text-sunburst backdrop-blur-xs">
              {isPlaying ? "▶ PLAYING (112 BPM)" : "■ STOPPED"}
            </span>
          </div>
          <span className="w-fit rounded-md border border-[#2b2e35] bg-[#160e05]/90 px-2.5 py-1 font-mono text-[11px] text-[#ffcf8f] shadow-sm">
            PAD {lastPadName} · CUT {cutoffUI}Hz
          </span>
        </div>

        {/* Top-Right Control Buttons */}
        <div className="pointer-events-auto absolute right-4 top-4 z-10 flex items-center gap-2">
          <button
            onClick={() => togglePlayRef.current?.()}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-xs font-bold uppercase transition ${
              isPlaying
                ? "border-vinyl bg-vinyl text-ink shadow-[0_0_16px_#e85c0d]"
                : "border-[#343842] bg-[#1a1c22]/90 text-fg hover:border-vinyl/60 hover:text-white"
            }`}
          >
            {isPlaying ? <Square className="size-3.5 fill-current" /> : <Play className="size-3.5 fill-current" />}
            <span>{isPlaying ? "Stop" : "Play"}</span>
          </button>

          <button
            onClick={() => setMode2d(true)}
            aria-label={__t.view2d}
            title={__t.view2d}
            className="grid size-8 place-items-center rounded-lg border border-[#343842] bg-[#1a1c22]/90 text-fg hover:border-vinyl/60 hover:text-sunburst"
          >
            <RotateCw className="size-3.5" />
          </button>
        </div>

        {/* Bottom Legend */}
        <div className="pointer-events-none absolute bottom-4 left-4 z-10 hidden flex-wrap items-center gap-4 font-mono text-[10px] tracking-widest text-[#8a8f9c] sm:flex">
          <span className="flex items-center gap-1.5">
            <MousePointer2 className="size-3 text-vinyl" /> {__t.pads}
          </span>
          <span className="flex items-center gap-1.5">
            <Keyboard className="size-3 text-sunburst" /> {__t.space}
          </span>
          <span>{__t.steps}</span>
          <span>{__t.cutoff}</span>
        </div>
      </div>

      {/* Bank & Sound Kit Switcher */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {(["A", "B", "C"] as Bank[]).map((b) => (
            <button
              key={b}
              onClick={() => setBank(b)}
              className={`rounded-lg border px-4 py-2 font-mono text-xs font-bold tracking-wider uppercase transition ${
                bank === b
                  ? "border-vinyl bg-vinyl text-ink shadow-[0_0_15px_rgba(232,92,13,0.4)]"
                  : "border-[#343842] bg-[#17191d] text-[#a0a5b2] hover:border-vinyl/50 hover:text-white"
              }`}
            >
              Bank {b}
            </button>
          ))}
          <span className="ml-2 font-mono text-[11px] font-bold tracking-wider text-sunburst uppercase">
            {BANK_LABELS[bank]}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-[#8a8f9c]">
          <Volume2 className="size-3.5 text-vinyl" />
          <span>16 Synth Voices + Analog Lowpass</span>
        </div>
      </div>
    </div>
  );
}
