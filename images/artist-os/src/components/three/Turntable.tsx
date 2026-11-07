"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as THREE from "three";
import { Play, Square, Disc3, Hand, ExternalLink, Box, Sparkles, RotateCw } from "lucide-react";
import { ensureAudio, clamp, lerp } from "@/components/audio/bus";
import { TRACKS, BRAND } from "@/lib/data";
import Turntable2D from "./Turntable2D";
import { useLang } from "@/lib/useLang";
import { localize } from "@/lib/i18n";

const T = {
  de: {
    drag: "Vinyl ziehen = Scratch",
    hint: "START/STOP · Pitch & Cue direkt im 3D-Deck",
    toDisco: "Zur Discography",
    view2d: "2D Ansicht",
  },
  en: {
    drag: "Drag vinyl = scratch",
    hint: "START/STOP · pitch & cue right on the 3D deck",
    toDisco: "To the music page",
    view2d: "2D view",
  },
} as const;

const VEL33 = (33.33 * Math.PI * 2) / 60; // rad/s
const TS = 0.01; // 100 iso units = 1m
const W = (x: number, y: number, z: number) => new THREE.Vector3(x * TS, z * TS, y * TS);

const ORANGE_HEX = "#e85c0d";
const SUNBURST_HEX = "#f6b436";

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

/** Deck audio: loops Track 01 through playbackRate scratch control. */
export class DeckAudio {
  private src: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  private loading: Promise<void> | null = null;

  async ensure(): Promise<void> {
    if (this.loading) return this.loading;
    this.loading = (async () => {
      const ctx = await ensureAudio();
      const res = await fetch(TRACKS[0].src);
      const raw = await res.arrayBuffer();
      const buf = await ctx.decodeAudioData(raw.slice(0));
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.playbackRate.value = 0;
      this.gain = ctx.createGain();
      this.gain.gain.value = 0.85;
      src.connect(this.gain);
      this.gain.connect(ctx.destination);
      src.start();
      this.src = src;
    })();
    return this.loading;
  }

  setRate(r: number) {
    if (this.src) this.src.playbackRate.value = clamp(r, -4, 4);
  }

  dispose() {
    try {
      this.src?.stop();
    } catch {
      /* noop */
    }
    this.src?.disconnect();
    this.gain?.disconnect();
    this.src = null;
    this.loading = null;
  }
}

/**
 * Authentic Iso-Glow TT-33 Direct Drive Turntable:
 * Dark chassis, 1px hairlines, corner screws, strobe dots, concentric vinyl grooves,
 * working tonearm kinematics with cueing & run-out auto-return,
 * pitch slider and interactive vinyl scratch physics.
 */
export default function Turntable({ compact = false }: { compact?: boolean }) {
  const __lang = useLang();
  const __t = T[__lang];
  const hostRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [mode2d, setMode2d] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [pitchUI, setPitchUI] = useState(0);
  const [rpmUI, setRpmUI] = useState<33 | 45>(33);

  const deckRef = useRef<DeckAudio | null>(null);
  if (!deckRef.current && typeof window !== "undefined") deckRef.current = new DeckAudio();

  const toggleSpinRef = useRef<(() => void) | null>(null);
  const setPitchRef = useRef<((p: number) => void) | null>(null);
  const setRpmRef = useRef<((r: 33 | 45) => void) | null>(null);

  // ---------------- Three.js 3D Scene ----------------
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

    // Iso camera view setup
    const ISO_DIST = compact ? 5.8 : 5.2;
    let yaw = Math.PI * 0.28;
    let pitch = 0.65;
    let tYaw = yaw;
    let tPitch = pitch;
    const target = new THREE.Vector3(1.65, 0.22, 1.35);

    // Ambient & directional lighting
    scene.add(new THREE.AmbientLight(0xfff5eb, 0.95));
    const dirLight = new THREE.DirectionalLight(0xffecd6, 1.8);
    dirLight.position.set(-4, 9, 6);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0xe85c0d, 1.2);
    rimLight.position.set(6, 4, -4);
    scene.add(rimLight);

    // Materials (Iso-Glow dark palette)
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
    const majorLineMat = new THREE.LineBasicMaterial({
      color: 0x5a606b,
      depthTest: true,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -4,
    });
    const accentLineMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(ORANGE_HEX),
      depthTest: true,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -6,
    });

    const root = new THREE.Group();
    scene.add(root);

    // Helper: Rounded Box with edge lines
    function rbox(x: number, y: number, z: number, w: number, d: number, h: number, r = 0, mat = bodyMat, parent = root) {
      const sh = new THREE.Shape();
      roundRectShape(sh, x, -(y + d), w, d, r);
      const g = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false, curveSegments: 12 });
      g.rotateX(-Math.PI / 2);
      g.translate(0, z, 0);
      g.scale(TS, TS, TS);
      const mesh = new THREE.Mesh(g, mat);
      parent.add(mesh);

      const eg = new THREE.EdgesGeometry(g, 26);
      const lines = new THREE.LineSegments(eg, edgeLineMat);
      mesh.add(lines);

      return mesh;
    }

    // Helper: Circle points
    const circPts = (cx: number, cy: number, r: number, z: number, n = 64) =>
      Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        return W(cx + r * Math.cos(a), cy + r * Math.sin(a), z);
      });

    // Dimensions from Iso-Glow TT-33
    const PLZ = 7;
    const BX = 22, BY = 22, BW = 286, BD = 220, BZ = PLZ + 4, BH = 30, BT = BZ + BH, BF = BY + BD;
    const C = [124, 124]; // Platter center
    const PR = 92, PZ = BT + 2, PH = 9, RR = 78, RZ = PZ + PH, RT = RZ + 1.6;

    // 1. Ground plate with 4 corner screw discs
    rbox(0, 0, 0, 330, 270, PLZ, 14, bodyMat, root);
    [[18, 18], [312, 18], [18, 252], [312, 252]].forEach(([x, y]) => {
      const screwGeo = new THREE.CircleGeometry(3 * TS, 16);
      const screw = new THREE.Mesh(screwGeo, recessMat);
      screw.rotation.x = -Math.PI / 2;
      screw.position.copy(W(x, y, PLZ + 0.05));
      root.add(screw);

      const slotGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-1.8 * TS, 0, 0),
        new THREE.Vector3(1.8 * TS, 0, 0),
      ]);
      const slot = new THREE.Line(slotGeo, edgeLineMat);
      slot.position.copy(W(x, y, PLZ + 0.08));
      root.add(slot);
    });

    // 2. Chassis on 4 Feet
    [[BX + 24, BY + 24], [BX + BW - 24, BY + 24], [BX + 24, BF - 24], [BX + BW - 24, BF - 24]].forEach(([x, y]) => {
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(10 * TS, 10 * TS, 4 * TS, 24), bodyMat);
      foot.position.copy(W(x, y, PLZ + 2));
      root.add(foot);
    });
    rbox(BX, BY, BZ, BW, BD, BH, 10, bodyMat, root);

    // Front badge: "TT-33 DIRECT DRIVE"
    const badgeCanvas = document.createElement("canvas");
    badgeCanvas.width = 384;
    badgeCanvas.height = 64;
    const bgctx = badgeCanvas.getContext("2d")!;
    bgctx.fillStyle = "#8a8f9c";
    bgctx.font = "900 24px 'Space Mono', monospace";
    bgctx.letterSpacing = "2px";
    bgctx.fillText("NOIZY TT-33 DIRECT DRIVE", 10, 40);
    const badgeTex = new THREE.CanvasTexture(badgeCanvas);
    badgeTex.colorSpace = THREE.SRGBColorSpace;
    const badge = new THREE.Mesh(
      new THREE.PlaneGeometry(54 * TS, 9 * TS),
      new THREE.MeshBasicMaterial({ map: badgeTex, transparent: true })
    );
    badge.position.copy(W(BX + 14 + 30, BF + 0.1, BT - 11));
    root.add(badge);

    // Front cooling slits
    const slitPoints: THREE.Vector3[] = [];
    for (let x = BX + BW - 64; x <= BX + BW - 16; x += 3.2) {
      slitPoints.push(W(x, BF + 0.08, BT - 6), W(x, BF + 0.08, BT - BH + 6));
    }
    const slitGeo = new THREE.BufferGeometry().setFromPoints(slitPoints);
    root.add(new THREE.LineSegments(slitGeo, edgeLineMat));

    // 3. Platter Well in the deck
    const wellMesh = new THREE.Mesh(new THREE.CircleGeometry(97 * TS, 48), recessMat);
    wellMesh.rotation.x = -Math.PI / 2;
    wellMesh.position.copy(W(C[0], C[1], BT + 0.05));
    root.add(wellMesh);

    // Well perimeter hairline
    const wellLineGeo = new THREE.BufferGeometry().setFromPoints(circPts(C[0], C[1], 97, BT + 0.07, 64));
    root.add(new THREE.LineLoop(wellLineGeo, edgeLineMat));

    // 4. Rotating Platter Group
    const platterGroup = new THREE.Group();
    platterGroup.position.copy(W(C[0], C[1], 0));
    platterGroup.userData = { isPlatter: true };
    root.add(platterGroup);

    // Cast platter body
    const pMesh = new THREE.Mesh(new THREE.CylinderGeometry(PR * TS, PR * TS, PH * TS, 64), bodyMat);
    pMesh.position.copy(W(0, 0, PZ + PH / 2));
    platterGroup.add(pMesh);

    // Strobe tick marks along rim
    const strobePts: THREE.Vector3[] = [];
    for (let k = 0; k < 72; k++) {
      const a = (k / 72) * Math.PI * 2;
      const c = Math.cos(a);
      const sn = Math.sin(a);
      const r = PR + 0.1;
      strobePts.push(
        W(r * c, r * sn, PZ + 2),
        W(r * c, r * sn, PZ + (k % 2 ? 4.5 : 6.5))
      );
    }
    const strobeGeo = new THREE.BufferGeometry().setFromPoints(strobePts);
    platterGroup.add(new THREE.LineSegments(strobeGeo, edgeLineMat));

    // Vinyl Record disc
    const vinylMesh = new THREE.Mesh(new THREE.CylinderGeometry(RR * TS, RR * TS, 1.6 * TS, 64), recessMat);
    vinylMesh.position.copy(W(0, 0, RZ + 0.8));
    platterGroup.add(vinylMesh);

    // Concentric record groove lines
    const ringLoops: THREE.LineLoop[] = [];
    const addGrooveRing = (radius: number, mat = edgeLineMat) => {
      const rg = new THREE.BufferGeometry().setFromPoints(circPts(0, 0, radius, RT + 0.06, 64));
      const loop = new THREE.LineLoop(rg, mat);
      platterGroup.add(loop);
      ringLoops.push(loop);
    };
    addGrooveRing(RR - 1.5, majorLineMat);
    for (let r = 72; r >= 32; r -= 3.6) {
      addGrooveRing(r, r % 2 === 0 ? majorLineMat : edgeLineMat);
    }

    // Center Record Label (Custom 512x512 Canvas)
    const labelCanvas = document.createElement("canvas");
    labelCanvas.width = 512;
    labelCanvas.height = 512;
    const labctx = labelCanvas.getContext("2d")!;
    labctx.fillStyle = "#140e06";
    labctx.beginPath();
    labctx.arc(256, 256, 256, 0, Math.PI * 2);
    labctx.fill();

    // Concentric gold lines
    labctx.strokeStyle = SUNBURST_HEX;
    labctx.lineWidth = 4;
    labctx.beginPath();
    labctx.arc(256, 256, 230, 0, Math.PI * 2);
    labctx.stroke();
    labctx.lineWidth = 2;
    labctx.beginPath();
    labctx.arc(256, 256, 175, 0, Math.PI * 2);
    labctx.stroke();

    // Center orange crescent / badge
    labctx.fillStyle = ORANGE_HEX;
    labctx.beginPath();
    labctx.arc(256, 256, 40, 0, Math.PI * 2);
    labctx.fill();

    // Typography
    labctx.fillStyle = "#ffffff";
    labctx.textAlign = "center";
    labctx.font = "bold 34px 'Space Mono', monospace";
    labctx.fillText("NOIZY RECORDS", 256, 160);
    labctx.fillStyle = SUNBURST_HEX;
    labctx.font = "24px 'Space Mono', monospace";
    labctx.fillText("SIDE A · 33⅓ RPM", 256, 360);
    labctx.fillStyle = "#ffcf8f";
    labctx.font = "20px 'Space Mono', monospace";
    labctx.fillText("BACK ON 16 PADS", 256, 400);

    const labelTex = new THREE.CanvasTexture(labelCanvas);
    labelTex.colorSpace = THREE.SRGBColorSpace;
    const labelMesh = new THREE.Mesh(
      new THREE.CircleGeometry(24 * TS, 48),
      new THREE.MeshBasicMaterial({ map: labelTex, toneMapped: false })
    );
    labelMesh.rotation.x = -Math.PI / 2;
    labelMesh.position.copy(W(0, 0, RT + 0.1));
    platterGroup.add(labelMesh);

    // Spindle cylinder
    const spindle = new THREE.Mesh(new THREE.CylinderGeometry(2 * TS, 2 * TS, 8 * TS, 16), bodyMat);
    spindle.position.copy(W(0, 0, RT + 4));
    platterGroup.add(spindle);

    // 5. Controls: Start/Stop, 33/45, Pilot Lamp & Pitch Slider
    const bStartMat = new THREE.MeshStandardMaterial({
      color: 0x1f2126,
      emissive: new THREE.Color(ORANGE_HEX),
      emissiveIntensity: 0.1,
      roughness: 0.6,
    });
    const bStartGroup = new THREE.Group();
    bStartGroup.userData = { isStartBtn: true };
    root.add(bStartGroup);
    rbox(38, 196, BT, 34, 30, 4, 3, bStartMat, bStartGroup);

    // Start/Stop button label
    const startCanvas = document.createElement("canvas");
    startCanvas.width = 136;
    startCanvas.height = 120;
    const sctx = startCanvas.getContext("2d")!;
    sctx.fillStyle = SUNBURST_HEX;
    sctx.font = "bold 18px 'Space Mono', monospace";
    sctx.textAlign = "center";
    sctx.fillText("START", 68, 48);
    sctx.fillText("STOP", 68, 76);
    const startTex = new THREE.CanvasTexture(startCanvas);
    const startLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(30 * TS, 26 * TS),
      new THREE.MeshBasicMaterial({ map: startTex, transparent: true })
    );
    startLabel.rotation.x = -Math.PI / 2;
    startLabel.position.copy(W(38 + 17, 196 + 15, BT + 4.12));
    bStartGroup.add(startLabel);

    // 33 & 45 Buttons
    const b33Mat = new THREE.MeshStandardMaterial({ color: 0x1f2126, emissive: new THREE.Color(ORANGE_HEX), emissiveIntensity: 0.7 });
    const b45Mat = new THREE.MeshStandardMaterial({ color: 0x1f2126, emissive: new THREE.Color(ORANGE_HEX), emissiveIntensity: 0 });
    const b33Group = new THREE.Group();
    b33Group.userData = { isRpmBtn: 33 };
    rbox(84, 206, BT, 22, 18, 4, 3, b33Mat, b33Group);
    root.add(b33Group);

    const b45Group = new THREE.Group();
    b45Group.userData = { isRpmBtn: 45 };
    rbox(110, 206, BT, 22, 18, 4, 3, b45Mat, b45Group);
    root.add(b45Group);

    // Strobe pilot lamp housing
    rbox(34, 168, BT, 12, 12, 7, 3, bodyMat, root);
    const pilotMat = new THREE.MeshStandardMaterial({
      color: 0x22170f,
      emissive: new THREE.Color(ORANGE_HEX),
      emissiveIntensity: 0.1,
      roughness: 0.3,
    });
    const pilotSphere = new THREE.Mesh(new THREE.SphereGeometry(3 * TS, 16, 12), pilotMat);
    pilotSphere.position.copy(W(40, 174, BT + 8));
    root.add(pilotSphere);

    // Pitch Fader
    const SLX = 284, SLY0 = 136, SLY1 = 222;
    // Inset groove
    const faderGroove = new THREE.Mesh(
      new THREE.PlaneGeometry(6 * TS, (SLY1 - SLY0) * TS),
      recessMat
    );
    faderGroove.rotation.x = -Math.PI / 2;
    faderGroove.position.copy(W(SLX, (SLY0 + SLY1) / 2, BT + 0.05));
    root.add(faderGroove);

    // Pitch graduation ticks
    const pitchTicks: THREE.Vector3[] = [];
    for (let k = 0; k <= 16; k++) {
      const y = SLY0 + 6 + (k * (SLY1 - SLY0 - 12)) / 16;
      pitchTicks.push(W(SLX - 8, y, BT + 0.08), W(SLX - (k % 4 ? 5 : 3), y, BT + 0.08));
    }
    const tickGeo = new THREE.BufferGeometry().setFromPoints(pitchTicks);
    root.add(new THREE.LineSegments(tickGeo, edgeLineMat));

    // Pitch Knob
    const sliderGroup = new THREE.Group();
    sliderGroup.userData = { isPitchSlider: true };
    const sKnobMat = new THREE.MeshStandardMaterial({
      color: 0x252830,
      emissive: new THREE.Color(ORANGE_HEX),
      emissiveIntensity: 0.1,
      roughness: 0.5,
    });
    rbox(SLX - 7, (SLY0 + SLY1) / 2 - 5, BT, 14, 10, 7, 2, sKnobMat, sliderGroup);

    // Center hairline on the slider knob
    const knobLineGeo = new THREE.BufferGeometry().setFromPoints([
      W(SLX - 7, (SLY0 + SLY1) / 2, BT + 7.1),
      W(SLX + 7, (SLY0 + SLY1) / 2, BT + 7.1),
    ]);
    sliderGroup.add(new THREE.Line(knobLineGeo, accentLineMat));
    root.add(sliderGroup);

    // 6. Tonearm Assembly (Pivot, Counterweight, Arm Tube, Headshell, Stylus)
    const P = [262, 60], AZ = BT + 21, LS = 152;
    const A_REST = (96 * Math.PI) / 180; // Parked angle
    const A_LEAD_IN = (118 * Math.PI) / 180; // Over the outer groove
    const A_RUN_OUT = (146 * Math.PI) / 180; // Run-out groove

    // Tonearm base & gimbal tower
    const armBase = new THREE.Mesh(new THREE.CylinderGeometry(18 * TS, 18 * TS, 4 * TS, 32), bodyMat);
    armBase.position.copy(W(P[0], P[1], BT + 2));
    root.add(armBase);
    const armTower = new THREE.Mesh(new THREE.CylinderGeometry(7 * TS, 7 * TS, 17 * TS, 24), bodyMat);
    armTower.position.copy(W(P[0], P[1], BT + 12.5));
    root.add(armTower);

    // Arm Rest Post
    const restCoords = [P[0] + 128 * Math.cos(A_REST), P[1] + 128 * Math.sin(A_REST)];
    rbox(restCoords[0] - 4, restCoords[1] - 4, BT, 8, 8, 17, 3, bodyMat, root);
    rbox(restCoords[0] - 6, restCoords[1] - 2, BT + 17, 12, 4, 2, 1, bodyMat, root);

    // Animated Tonearm Root
    const armRoot = new THREE.Group();
    armRoot.position.copy(W(P[0], P[1], AZ));
    armRoot.userData = { isArm: true };
    root.add(armRoot);

    const liftGroup = new THREE.Group();
    armRoot.add(liftGroup);

    // Gimbal cylinder
    const gimbal = new THREE.Mesh(new THREE.CylinderGeometry(5 * TS, 5 * TS, 8 * TS, 16), bodyMat);
    liftGroup.add(gimbal);

    // Arm Tube (150mm long)
    const armTube = new THREE.Mesh(new THREE.CylinderGeometry(1.8 * TS, 1.8 * TS, 150 * TS, 16), bodyMat);
    armTube.rotation.z = Math.PI / 2;
    armTube.position.copy(W(61, 0, 0));
    liftGroup.add(armTube);

    // Counterweight cylinder (behind pivot)
    const weight = new THREE.Mesh(new THREE.CylinderGeometry(6.5 * TS, 6.5 * TS, 12 * TS, 24), bodyMat);
    weight.rotation.z = Math.PI / 2;
    weight.position.copy(W(-26, 0, 0));
    liftGroup.add(weight);

    // Headshell & Cartridge
    rbox(LS - 18, -5, -3.5, 22, 10, 3, 1.5, bodyMat, liftGroup);
    rbox(LS - 9, -3, -7.6, 10, 6, 4.1, 1, bodyMat, liftGroup);

    // Stylus needle tip glowing micro-LED
    const stylusGlowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(ORANGE_HEX),
      transparent: true,
      opacity: 0,
    });
    const stylusGlow = new THREE.Mesh(new THREE.SphereGeometry(1.2 * TS, 8, 8), stylusGlowMat);
    stylusGlow.position.copy(W(LS - 4, 0, -7.6));
    liftGroup.add(stylusGlow);

    // ---------------- State & Physics ----------------
    type DeckMode = "rest" | "cueing" | "play" | "returning";
    const st = {
      spinning: false,
      rpmTarget: 33.333,
      currentRpm: 0,
      pitchPercent: 0,
      mode: "rest" as DeckMode,
      armAngle: A_REST,
      armLift: 0, // 0 = lowered on record, 6 = lifted
      scratchVelocity: 0,
      isDraggingPlatter: false,
    };

    // Toggle Spin Action
    const toggleSpin = async () => {
      const next = !st.spinning;
      st.spinning = next;
      setSpinning(next);

      if (next) {
        st.mode = "cueing";
        void deckRef.current?.ensure();
      } else {
        st.mode = "returning";
      }

      bStartMat.emissiveIntensity = next ? 0.9 : 0.1;
      pilotMat.emissiveIntensity = next ? 1.4 : 0.1;
    };
    toggleSpinRef.current = toggleSpin;

    // RPM Switch
    const setRpm = (r: 33 | 45) => {
      st.rpmTarget = r === 33 ? 33.333 : 45;
      setRpmUI(r);
      b33Mat.emissiveIntensity = r === 33 ? 0.8 : 0;
      b45Mat.emissiveIntensity = r === 45 ? 0.8 : 0;
    };
    setRpmRef.current = setRpm;

    // Pitch Apply
    const setPitch = (p: number) => {
      const cl = clamp(p, -8, 8);
      st.pitchPercent = cl;
      setPitchUI(cl);
      // Slider translation along Y
      sliderGroup.position.z = (cl / 8) * (((SLY1 - SLY0) / 2 - 6) * TS);
    };
    setPitchRef.current = setPitch;

    // ---------------- Interaction (Orbit, Platter Scratch, Fader Drag) ----------------
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isMouseDown = false;
    let dragTarget: "orbit" | "platter" | "pitch" | null = null;
    let lastX = 0;
    let lastY = 0;
    let lastPlatterAngle = 0;

    const onPointerDown = (e: PointerEvent) => {
      isMouseDown = true;
      lastX = e.clientX;
      lastY = e.clientY;
      renderer.domElement.setPointerCapture(e.pointerId);

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const hits = raycaster.intersectObjects(root.children, true);
      if (hits.length > 0) {
        let obj: THREE.Object3D | null = hits[0].object;
        while (obj && obj !== root) {
          if (obj.userData?.isPlatter) {
            dragTarget = "platter";
            st.isDraggingPlatter = true;
            // Calculate starting radial angle
            const hitPoint = hits[0].point;
            lastPlatterAngle = Math.atan2(hitPoint.z - C[1] * TS, hitPoint.x - C[0] * TS);
            return;
          }
          if (obj.userData?.isStartBtn) {
            void toggleSpin();
            return;
          }
          if (obj.userData?.isRpmBtn) {
            setRpm(obj.userData.isRpmBtn as 33 | 45);
            return;
          }
          if (obj.userData?.isPitchSlider) {
            dragTarget = "pitch";
            return;
          }
          if (obj.userData?.isArm) {
            // Cue arm up/down on click
            st.mode = st.mode === "play" ? "returning" : "cueing";
            return;
          }
          obj = obj.parent;
        }
      }
      dragTarget = "orbit";
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isMouseDown) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      if (dragTarget === "orbit") {
        tYaw = clamp(tYaw - dx * 0.005, -0.2, Math.PI * 0.7);
        tPitch = clamp(tPitch + dy * 0.004, 0.4, 1.25);
      } else if (dragTarget === "pitch") {
        setPitch(st.pitchPercent + dy * 0.08);
      } else if (dragTarget === "platter") {
        // Scratch vinyl rotation
        const delta = dx * 0.02 + dy * 0.008;
        st.scratchVelocity = delta * 50;
      }
    };

    const onPointerUp = () => {
      isMouseDown = false;
      st.isDraggingPlatter = false;
      dragTarget = null;
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    // Keyboard Shortcuts
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === " ") {
        e.preventDefault();
        void toggleSpin();
      } else if (e.key === "3") {
        setRpm(33);
      } else if (e.key === "4") {
        setRpm(45);
      } else if (e.key === "c" || e.key === "C") {
        st.mode = st.mode === "play" ? "returning" : "cueing";
      } else if (e.key === "ArrowUp") {
        setPitch(st.pitchPercent + 1);
      } else if (e.key === "ArrowDown") {
        setPitch(st.pitchPercent - 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);

    // Resize
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

    // Render & Animation Loop
    const clock = new THREE.Clock();
    let platterRotationAngle = 0;
    let raf = 0;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);

      // Platter spin physics
      const targetSpeed = st.spinning ? st.rpmTarget * (1 + st.pitchPercent / 100) : 0;
      if (st.isDraggingPlatter) {
        platterRotationAngle += st.scratchVelocity * dt;
        st.scratchVelocity *= Math.exp(-dt * 6);
        deckRef.current?.setRate(clamp(st.scratchVelocity / 5, -3, 3));
      } else {
        st.currentRpm = lerp(st.currentRpm, targetSpeed, 1 - Math.exp(-dt * 2.5));
        const radPerSec = (st.currentRpm * Math.PI * 2) / 60;
        platterRotationAngle -= radPerSec * dt;
        const rateRatio = (st.currentRpm / 33.333) * (st.mode === "play" ? 1 : 0);
        deckRef.current?.setRate(clamp(rateRatio, 0, 2.5));
      }
      platterGroup.rotation.y = platterRotationAngle;

      // Tonearm kinematics
      if (st.mode === "cueing") {
        // Lift arm first, then swing to lead-in groove
        st.armLift = lerp(st.armLift, 6, 1 - Math.exp(-dt * 8));
        if (st.armLift > 5.2) {
          st.armAngle = lerp(st.armAngle, A_LEAD_IN, 1 - Math.exp(-dt * 4));
          if (Math.abs(st.armAngle - A_LEAD_IN) < 0.01) {
            st.mode = "play";
          }
        }
      } else if (st.mode === "play") {
        // Lower arm onto record
        st.armLift = lerp(st.armLift, 0, 1 - Math.exp(-dt * 6));
        // Slowly track groove inward while spinning
        if (st.currentRpm > 10) {
          st.armAngle += dt * 0.0035 * (st.currentRpm / 33.333);
          if (st.armAngle >= A_RUN_OUT) {
            st.mode = "returning";
            st.spinning = false;
            setSpinning(false);
          }
        }
      } else if (st.mode === "returning") {
        // Lift arm and swing back to rest post
        st.armLift = lerp(st.armLift, 6, 1 - Math.exp(-dt * 8));
        if (st.armLift > 5.0) {
          st.armAngle = lerp(st.armAngle, A_REST, 1 - Math.exp(-dt * 4));
          if (Math.abs(st.armAngle - A_REST) < 0.01) {
            st.armLift = lerp(st.armLift, 0, 1 - Math.exp(-dt * 6));
            if (st.armLift < 0.1) st.mode = "rest";
          }
        }
      }

      armRoot.rotation.y = -st.armAngle;
      liftGroup.position.y = st.armLift * TS;

      // Stylus tip glow when on vinyl
      const isNeedleOnDisc = st.mode === "play" && st.armLift < 1.0;
      stylusGlowMat.opacity = isNeedleOnDisc ? 0.9 : 0;

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
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("keydown", onKeyDown);

      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments || o instanceof THREE.LineLoop) {
          o.geometry.dispose();
          const m = o.material as THREE.Material | THREE.Material[];
          (Array.isArray(m) ? m : [m]).forEach((mat) => mat.dispose());
        }
      });
      labelTex.dispose();
      badgeTex.dispose();
      startTex.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      deckRef.current?.setRate(0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode2d, compact]);

  if (failed || mode2d) {
    return (
      <Turntable2D
        deck={deckRef.current}
        spinning={spinning}
        toggleSpin={() => toggleSpinRef.current?.()}
        pitch={pitchUI}
        setPitch={(p) => setPitchRef.current?.(p)}
        rpm={rpmUI}
        setRpm={(r) => setRpmRef.current?.(r)}
        onBack={() => setMode2d(false)}
      />
    );
  }

  return (
    <div className="group relative">
      <div
        className="stage-3d relative h-[420px] w-full overflow-hidden rounded-2xl border-2 border-[#2b2e35] bg-[#111111] shadow-[0_16px_50px_rgba(0,0,0,0.85)] sm:h-[540px]"
        ref={hostRef}
      >
        {/* Top-Left Iso-Glow Badge & Readout */}
        <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-md border border-vinyl/40 bg-vinyl/15 px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest text-vinyl uppercase backdrop-blur-xs">
              <Sparkles className="size-3" /> ISO-GLOW · TT-33
            </span>
            <span className="rounded-md border border-[#343842] bg-[#1a1c22]/90 px-2.5 py-1 font-mono text-[10px] font-bold text-sunburst backdrop-blur-xs">
              {spinning ? `${rpmUI === 33 ? "33⅓" : "45"} RPM · LIVE` : "PARKED"}
            </span>
          </div>
          <span className="w-fit rounded-md border border-[#2b2e35] bg-[#160e05]/90 px-2.5 py-1 font-mono text-[11px] text-[#ffcf8f] shadow-sm">
            TRACK: „{TRACKS[0].title}“ · PITCH {pitchUI >= 0 ? "+" : ""}{pitchUI.toFixed(1)}%
          </span>
        </div>

        {/* Top-Right Control Buttons */}
        <div className="pointer-events-auto absolute right-4 top-4 z-10 flex items-center gap-2">
          <button
            onClick={() => toggleSpinRef.current?.()}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-xs font-bold uppercase transition ${
              spinning
                ? "border-vinyl bg-vinyl text-ink shadow-[0_0_16px_#e85c0d]"
                : "border-[#343842] bg-[#1a1c22]/90 text-fg hover:border-vinyl/60 hover:text-white"
            }`}
          >
            {spinning ? <Square className="size-3.5 fill-current" /> : <Play className="size-3.5 fill-current" />}
            <span>{spinning ? "Stop" : "Start"}</span>
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
            <Hand className="size-3 text-vinyl" /> {__t.drag}
          </span>
          <span className="flex items-center gap-1.5">
            <Disc3 className="size-3 text-sunburst" /> {__t.hint}
          </span>
        </div>
      </div>

      {/* Control Strip under the 3D Stage */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleSpinRef.current?.()}
            className={`flex items-center gap-2 rounded-lg border px-5 py-2 font-mono text-xs font-bold uppercase transition ${
              spinning
                ? "border-vinyl bg-vinyl text-ink shadow-[0_0_14px_rgba(232,92,13,0.5)]"
                : "border-[#343842] bg-[#17191d] text-[#a0a5b2] hover:border-vinyl/60 hover:text-white"
            }`}
          >
            {spinning ? <Square className="size-3.5 fill-current" /> : <Play className="size-3.5 fill-current" />}
            <span>{spinning ? "Stop" : "Start / Cue"}</span>
          </button>

          {/* 33 / 45 Switcher */}
          <div className="flex items-center rounded-lg border border-[#343842] bg-[#14161a] p-1">
            {([33, 45] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRpmRef.current?.(r)}
                className={`rounded px-3 py-1 font-mono text-xs font-bold transition ${
                  rpmUI === r
                    ? "bg-vinyl text-ink shadow-[0_0_8px_rgba(232,92,13,0.5)]"
                    : "text-[#8a8f9c] hover:text-white"
                }`}
              >
                {r === 33 ? "33⅓" : "45"}
              </button>
            ))}
          </div>
        </div>

        {/* Pitch Slider */}
        <label className="flex min-w-44 flex-1 items-center gap-3 rounded-lg border border-[#343842] bg-[#17191d] px-4 py-2 sm:max-w-72">
          <span className="font-mono text-[10px] font-bold tracking-wider text-vinyl uppercase">PITCH</span>
          <input
            type="range"
            min={-8}
            max={8}
            step={0.1}
            value={pitchUI}
            onChange={(e) => setPitchRef.current?.(Number(e.target.value))}
            className="fader w-full"
            aria-label="Pitch"
          />
          <span className="w-14 text-right font-mono text-xs font-bold text-sunburst">
            {pitchUI >= 0 ? "+" : ""}{pitchUI.toFixed(1)}%
          </span>
        </label>
      </div>
    </div>
  );
}
