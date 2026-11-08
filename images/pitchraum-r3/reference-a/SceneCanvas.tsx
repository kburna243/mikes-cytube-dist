import { useEffect, useRef } from 'react';

/**
 * Selbst programmierte Filmszene in WebGL2 mit eigenem Fragment-Shader:
 * Regen auf einer nächtlichen Scheibe, Scheinwerfer und Nebel.
 * Ein AnalyserNode (Web Audio) steuert Licht, Tempo, Korn und Farbe.
 *
 * - Läuft nur, solange sichtbar (IntersectionObserver), pausiert im Hintergrund-Tab
 * - Senkt bei schwacher Leistung automatisch die Auflösung
 * - Ohne WebGL2: gestalteter CSS-Rückfall ohne Fehler
 * - Bei reduzierter Bewegung: ein ruhiges Standbild statt Bewegung
 */

export interface SceneMood {
  /** 0 = ruhig, 1 = treibend, 2 = bedrohlich */
  mood: number;
  /** Akzentfarbe des aktuellen Tracks als [r, g, b] 0..1 */
  accent: [number, number, number];
}

export interface SceneStats {
  fps: number;
  /** Bildzeit in ms (EMA) */
  frameMs: number;
  /** aktuelle Auflösungsskala */
  scale: number;
}

interface SceneCanvasProps {
  mood: SceneMood;
  /** Liefert den aktuellen Pegel 0..1 (aus dem AnalyserNode) */
  getLevel: () => number;
  /** Wird gedrosselt aufgerufen (4 Hz) — für Timecode/FPS-Anzeige */
  onStats?: (stats: SceneStats) => void;
  className?: string;
  /** Wenn gesetzt, wird der Szene ein Trackwechsel-Impuls gegeben */
  flashKey?: number;
}

const VERTEX_SRC = `#version 300 es
layout(location = 0) in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAGMENT_SRC = `#version 300 es
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_energy;
uniform vec3 u_accent;
uniform float u_mood;
uniform float u_flash;
out vec4 fragColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.55;
  for (int i = 0; i < 4; i++) {
    v += amp * noise(p);
    p = p * 2.03 + vec2(17.3, 9.1);
    amp *= 0.5;
  }
  return v;
}

// Regenstreifen: schmale, nach unten laufende Linien
float rain(vec2 uv, float t, float speed, float density) {
  vec2 p = vec2(uv.x * (30.0 + density * 40.0), uv.y * 2.0 - t * speed);
  float n = noise(vec2(floor(p.x), floor(p.y * 3.0)));
  float cell = fract(p.y * 3.0);
  float streak = smoothstep(0.0, 0.15, cell) * smoothstep(1.0, 0.55, cell);
  float line = smoothstep(0.85, 1.0, n) * streak;
  return line;
}

// Tropfen auf der Scheibe: Zellen mit hellem Rand
float droplets(vec2 uv, float t) {
  vec2 p = uv * 7.0;
  vec2 i = floor(p);
  vec2 f = fract(p);
  float h = hash(i);
  vec2 c = vec2(0.3 + 0.4 * fract(h * 7.13), 0.3 + 0.4 * fract(h * 3.71));
  float d = length(f - c);
  float r = 0.10 + 0.16 * fract(h * 5.37);
  float rim = smoothstep(r, r * 0.55, d) * smoothstep(r * 0.2, r * 0.5, d);
  float glint = smoothstep(0.06, 0.0, length(f - c - vec2(-0.03, 0.04)));
  return rim * 0.8 + glint * 1.2;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  vec2 auv = vec2(uv.x * aspect, uv.y);
  float t = u_time;

  float mood = u_mood;
  float speed = mix(0.35, 1.15, mood) * (0.7 + u_energy * 0.9);
  float density = mix(0.35, 1.0, mood);

  // Grund: tiefes Nachtblau-Schwarz mit leichtem Verlauf
  vec3 col = mix(vec3(0.015, 0.02, 0.035), vec3(0.05, 0.06, 0.09), uv.y);
  col = mix(col, vec3(0.03, 0.025, 0.02), 1.0 - uv.y);

  // Nebel: zwei driftende Schichten
  float fog1 = fbm(auv * 2.2 + vec2(t * 0.03 * speed, t * 0.012));
  float fog2 = fbm(auv * 4.5 - vec2(t * 0.05 * speed, 0.0));
  float fog = fog1 * 0.65 + fog2 * 0.35;
  col += vec3(0.10, 0.11, 0.13) * fog * 0.5;
  col += u_accent * fog * 0.10 * (0.4 + u_energy);

  // Scheinwerfer: zwei wandernde Lichtkegel, Helligkeit folgt dem Pegel
  float sweep = sin(t * (0.22 + mood * 0.18)) * 0.5 + 0.5;
  vec2 lampA = vec2(mix(0.15, 0.85, sweep), 0.72);
  vec2 lampB = vec2(mix(0.85, 0.15, 1.0 - sweep), 0.55);
  float lampI = 0.35 + u_energy * 1.5 + mood * 0.25;
  float dA = length(auv - lampA * vec2(aspect, 1.0));
  float dB = length(auv - lampB * vec2(aspect, 1.0));
  col += u_accent * (0.55 / (dA * dA + 0.06)) * lampI * 0.35;
  col += vec3(1.0, 0.95, 0.85) * (0.35 / (dB * dB + 0.09)) * lampI * 0.22;

  // Regen auf der Scheibe
  float r1 = rain(uv, t, speed * 1.6, density);
  float r2 = rain(uv + 0.37, t, speed * 1.1, density * 0.7);
  col += vec3(0.55, 0.62, 0.72) * (r1 * 0.5 + r2 * 0.35);
  float drop = droplets(uv, t * 0.05);
  col += vec3(0.7, 0.76, 0.85) * drop * 0.28;
  col += u_accent * drop * 0.10 * (0.5 + u_energy);

  // Bedrohlich: die Szene wird dunkler und der Akzent drängt in den Schatten
  col *= 1.0 - mood * 0.22;
  col += u_accent * (1.0 - uv.y) * mood * 0.05;

  // Vignette
  float vig = 1.0 - smoothstep(0.35, 1.25, length(uv - 0.5) * 1.6);
  col *= mix(0.55, 1.0, vig);

  // Filmkorn
  float grain = hash(gl_FragCoord.xy + fract(t) * 100.0) - 0.5;
  col += grain * (0.045 + u_energy * 0.05);

  // Trackwechsel-Blende
  col += u_accent * u_flash * 0.35;
  col += vec3(u_flash * 0.25);

  fragColor = vec4(col, 1.0);
}
`;

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  src: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function SceneCanvas({ mood, getLevel, onStats, className, flashKey }: SceneCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const moodRef = useRef(mood);
  moodRef.current = mood;
  const getLevelRef = useRef(getLevel);
  getLevelRef.current = getLevel;
  const onStatsRef = useRef(onStats);
  onStatsRef.current = onStats;
  const flashRef = useRef(0);
  const flashKeyRef = useRef(flashKey ?? 0);

  useEffect(() => {
    if (flashKey !== undefined && flashKey !== flashKeyRef.current) {
      flashKeyRef.current = flashKey;
      flashRef.current = 1;
    }
  }, [flashKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const gl = canvas.getContext('webgl2', {
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
    }) as WebGL2RenderingContext | null;

    if (!gl) {
      // Gestalteter Rückfall ohne WebGL2: dunkle Fläche mit Akzentverlauf
      canvas.style.display = 'none';
      const fallback = canvas.parentElement;
      if (fallback && !fallback.querySelector('[data-scene-fallback]')) {
        const div = document.createElement('div');
        div.setAttribute('data-scene-fallback', 'true');
        div.style.cssText =
          'position:absolute;inset:0;background:radial-gradient(120% 90% at 70% 20%, rgba(120,130,150,0.25), transparent 60%),linear-gradient(180deg,#05070c 0%,#0a0d14 55%,#05070c 100%);';
        fallback.appendChild(div);
      }
      return;
    }

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SRC);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC);
    if (!vs || !fs) {
      canvas.style.display = 'none';
      return;
    }
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );
    const loc = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, 'u_res');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uEnergy = gl.getUniformLocation(program, 'u_energy');
    const uAccent = gl.getUniformLocation(program, 'u_accent');
    const uMood = gl.getUniformLocation(program, 'u_mood');
    const uFlash = gl.getUniformLocation(program, 'u_flash');

    let scale = 0.75;
    let rafId: number | null = null;
    let visible = true;
    let lastFrame = performance.now();
    let frameEma = 16;
    let statsAcc = 0;
    let statsFrames = 0;
    let lastStatsTime = performance.now();
    const startTime = performance.now();

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(2, Math.floor(rect.width * dpr * scale));
      const h = Math.max(2, Math.floor(rect.height * dpr * scale));
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w;
        canvas!.height = h;
        gl!.viewport(0, 0, w, h);
      }
    }

    function render(now: number) {
      const dt = now - lastFrame;
      lastFrame = now;
      frameEma = frameEma * 0.92 + dt * 0.08;

      // Adaptive Auflösung: bei schwacher Leistung senken, bei Reserve erhöhen
      if (frameEma > 22 && scale > 0.35) {
        scale = Math.max(0.35, scale - 0.06);
        resize();
      } else if (frameEma < 12 && scale < 0.75) {
        scale = Math.min(0.75, scale + 0.02);
        resize();
      }

      const m = moodRef.current;
      const level = getLevelRef.current();
      flashRef.current = Math.max(0, flashRef.current - dt / 900);

      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.uniform1f(uTime, (now - startTime) / 1000);
      gl!.uniform1f(uEnergy, level);
      gl!.uniform3f(uAccent, m.accent[0], m.accent[1], m.accent[2]);
      gl!.uniform1f(uMood, m.mood);
      gl!.uniform1f(uFlash, flashRef.current);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);

      statsAcc += dt;
      statsFrames += 1;
      if (now - lastStatsTime > 250 && onStatsRef.current) {
        const fps = statsFrames / ((now - lastStatsTime) / 1000);
        onStatsRef.current({ fps: Math.round(fps), frameMs: Math.round(frameEma * 10) / 10, scale });
        statsAcc = 0;
        statsFrames = 0;
        lastStatsTime = now;
      }
    }

    function loop(now: number) {
      if (!visible) {
        rafId = null;
        return;
      }
      render(now);
      rafId = requestAnimationFrame(loop);
    }

    function start() {
      if (rafId !== null || !visible) return;
      lastFrame = performance.now();
      rafId = requestAnimationFrame(loop);
    }

    resize();
    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(canvas);

    const intersection = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
        if (visible) start();
      },
      { threshold: 0.02 }
    );
    intersection.observe(canvas);

    const onVisibility = () => {
      visible = !document.hidden;
      if (visible) start();
    };
    document.addEventListener('visibilitychange', onVisibility);

    if (reducedMotion) {
      // Ein ruhiges Standbild, keine Bewegung
      render(performance.now());
    } else {
      start();
    }

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      intersection.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: 'block', width: '100%', height: '100%' }}
      aria-hidden="true"
    />
  );
}
