import { hexToRgb } from '../shared/contrast';
import type { SignalFrame } from '../audio/sketchEngine';

export interface SceneOptions {
  accent: string;
  /** Grundfarben der Szene; auf Künstlerseiten kommen sie aus dem Markenpaket. */
  ink?: string;
  paper?: string;
  mode: number;
  getSignal: () => SignalFrame;
  reducedMotion: boolean;
  onUnsupported?: () => void;
  onFrameStats?: (fps: number, scale: number) => void;
}

const VERTEX_SHADER = `#version 300 es
precision highp float;
const vec2 positions[3] = vec2[3](vec2(-1.0,-1.0), vec2(3.0,-1.0), vec2(-1.0,3.0));
void main(){ gl_Position = vec4(positions[gl_VertexID], 0.0, 1.0); }
`;

/**
 * Nächtliche Scheibe: Regen, Scheinwerfer, Nebel und Stadtlichter.
 * Alle Farben entstehen aus Kinoschwarz, warmem Weiß und der Track-Akzentfarbe.
 */
const FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uSignal;
uniform float uBass;
uniform float uMid;
uniform float uHigh;
uniform float uMode;
uniform float uReduced;
uniform vec3 uAccent;
uniform vec3 uInk;
uniform vec3 uPaper;
out vec4 outColor;

float hash21(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0; float a = 0.5;
  for(int i=0;i<4;i++){ v += a * noise(p); p = p * 2.02 + 17.3; a *= 0.5; }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes.xy;
  vec2 p = (gl_FragCoord.xy * 2.0 - uRes.xy) / uRes.y;
  float t = uTime;
  float drive = smoothstep(0.5, 1.5, uMode);
  float dread = smoothstep(1.5, 2.5, uMode);
  float energy = clamp(uSignal + uBass * 0.5, 0.0, 1.2);
  // Farbe reagiert auf das Signal: Akzent kippt bei Höhen ins warme Weiß.
  vec3 accentLive = mix(uAccent, uPaper, clamp(uHigh * 0.35 + energy * 0.08, 0.0, 0.45));

  // Kamera: ruhig, bei Energie näher und unruhiger
  vec2 cam = vec2(
    sin(t * (0.10 + energy * 0.32)) * (0.035 + energy * 0.09),
    cos(t * (0.075 + energy * 0.22)) * (0.02 + energy * 0.05)
  );
  vec2 gp = p + cam;

  vec3 col = mix(uInk, uPaper * 0.10, smoothstep(-1.1, 1.1, gp.y) * 0.55);
  col = mix(col, uAccent * 0.10, dread * smoothstep(-0.2, 1.2, gp.y) * 0.6);

  // Stadtlichter als weiche Bokeh-Flächen
  for(int i=0;i<3;i++){
    float fi = float(i);
    vec2 q = gp * (1.35 + fi * 0.55) + vec2(fi * 13.0, -0.5 - fi * 0.3);
    vec2 cell = floor(q * vec2(4.0, 2.6));
    vec2 f = fract(q * vec2(4.0, 2.6)) - 0.5;
    float h = hash21(cell + floor(t * (0.25 + fi * 0.2)));
    float size = 0.05 + h * 0.16;
    float d = length(f * vec2(1.0, 1.25));
    float glow = (1.0 - smoothstep(size * 0.1, size, d)) + (1.0 - smoothstep(size, size * 3.5, d)) * 0.25;
    float on = step(0.52, h);
    vec3 lightColor = mix(accentLive, uPaper, h * 0.6);
    col += lightColor * glow * on * (0.10 + uMid * 0.5 + energy * 0.12);
  }

  // Nebel
  float fog = fbm(gp * 1.3 + vec2(t * 0.09, t * 0.025));
  col = mix(col, uPaper * 0.085, smoothstep(0.30, 0.92, fog) * (0.34 + uMid * 0.25));

  // Scheinwerferkegel ziehen über die Scheibe
  float headlight = 0.0;
  for(int i=0;i<2;i++){
    float fi = float(i);
    float center = (fi * 0.9 - 0.45) + sin(t * (0.16 + fi * 0.09) + fi * 2.1) * (0.6 + drive * 0.25);
    float beam = exp(-pow((p.x - center) * (2.2 - drive * 0.7), 2.0) * 3.0);
    beam *= exp(-pow((p.y + 0.25 + sin(t * 0.21 + fi) * 0.15) * 1.25, 2.0));
    headlight += beam;
  }
  col += mix(accentLive, uPaper, 0.42) * headlight * (0.07 + uHigh * 0.3 + uBass * 0.18 + drive * 0.08);

  // Regen: zwei Glasschichten mit Tropfen und Spuren
  for(int layer=0; layer<2; layer++){
    float fl = float(layer);
    vec2 g = uv * vec2(23.0 + fl * 17.0, 8.0 + fl * 6.0);
    g.y += t * (0.55 + fl * 0.45) * (0.6 + uBass * 0.9 + drive * 0.4 + dread * 0.2);
    g.x += sin(t * 0.3 + g.y * 2.0) * 0.04;
    vec2 id = floor(g);
    vec2 f = fract(g) - 0.5;
    float h = hash21(id + fl * 37.0);
    float body = 1.0 - smoothstep(0.015, 0.14, length(f * vec2(1.35, 1.7)));
    body *= step(0.58, h);
    float trail = (1.0 - smoothstep(0.0, 0.03, abs(f.x))) * (1.0 - smoothstep(-0.1, 0.5, f.y)) * step(0.72, h);
    float alpha = (body + trail * 0.45) * (0.14 + fl * 0.05 + uHigh * 0.16);
    vec3 dropColor = mix(uPaper * 0.88, accentLive, 0.22 + fl * 0.12);
    col = mix(col, dropColor, clamp(alpha, 0.0, 0.5));
    col += uPaper * 0.10 * body * (0.4 + uHigh);
  }

  // Refraktion an der Scheibe
  float shimmer = fbm(uv * vec2(12.0, 20.0) + vec2(0.0, t * 0.4));
  col += uPaper * (shimmer - 0.5) * (0.025 + energy * 0.04);

  // Bedrohung: roter Puls unter der Fläche
  float pulse = 0.5 + 0.5 * sin(t * (1.2 + uBass * 3.0) * 3.14159);
  col += accentLive * dread * pulse * smoothstep(0.3, 1.2, p.y) * (0.03 + uBass * 0.16);

  // Filmkorn und Vignette
  float grain = hash21(gl_FragCoord.xy + floor(t * 22.0));
  col += (grain - 0.5) * (0.035 + energy * 0.045) * (1.0 - uReduced * 0.5);
  float vignette = 1.0 - smoothstep(0.30, 1.45, length(p * vec2(0.82, 1.0)));
  col *= mix(0.52, 1.0, vignette);
  col *= 1.0 - 0.05 * step(0.985, fract(gl_FragCoord.y * 0.5));

  outColor = vec4(max(col, vec3(0.0)), 1.0);
}
`;

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function toRgb01(hex: string): [number, number, number] {
  const rgb = hexToRgb(hex) || { r: 242, g: 236, b: 225 };
  return [rgb.r / 255, rgb.g / 255, rgb.b / 255];
}

function resolveCssColor(value: string, element: Element): string {
  if (!value.startsWith('var(')) return value;
  const property = value.slice(4, -1).trim();
  const resolved = getComputedStyle(element).getPropertyValue(property).trim();
  return resolved || '#F2ECE1';
}

export class FilmSceneRenderer {
  private canvas: HTMLCanvasElement;
  private resolvedAccent: string;
  private resolvedInk: string;
  private resolvedPaper: string;
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};
  private raf = 0;
  private options: SceneOptions;
  private running = false;
  private visible = true;
  private startTime = performance.now();
  private pausedAt = 0;
  private scale = 1;
  private slowFrames = 0;
  private frameCount = 0;
  private fpsWindowStart = performance.now();
  private resizeObserver: ResizeObserver | null = null;
  private intersection: IntersectionObserver | null = null;
  private supported = false;

  updateOptions(partial: Partial<SceneOptions>): void {
    this.options = { ...this.options, ...partial };
    if (partial.accent) this.resolvedAccent = resolveCssColor(partial.accent, this.canvas);
    if (partial.ink) this.resolvedInk = resolveCssColor(partial.ink, this.canvas);
    if (partial.paper) this.resolvedPaper = resolveCssColor(partial.paper, this.canvas);
  }

  constructor(canvas: HTMLCanvasElement, options: SceneOptions) {
    this.canvas = canvas;
    this.options = options;
    this.resolvedAccent = resolveCssColor(options.accent, canvas);
    this.resolvedInk = resolveCssColor(options.ink || '#08090A', canvas);
    this.resolvedPaper = resolveCssColor(options.paper || '#F2ECE1', canvas);
  }

  init(): boolean {
    const gl = this.canvas.getContext('webgl2', {
      antialias: false,
      alpha: false,
      powerPreference: 'low-power',
      preserveDrawingBuffer: false,
    });
    if (!gl) {
      this.options.onUnsupported?.();
      return false;
    }
    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) {
      this.options.onUnsupported?.();
      return false;
    }
    const program = gl.createProgram();
    if (!program) {
      this.options.onUnsupported?.();
      return false;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      this.options.onUnsupported?.();
      return false;
    }
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    gl.useProgram(program);
    this.program = program;
    this.gl = gl;
    for (const name of ['uRes', 'uTime', 'uSignal', 'uBass', 'uMid', 'uHigh', 'uMode', 'uReduced', 'uAccent', 'uInk', 'uPaper']) {
      this.uniforms[name] = gl.getUniformLocation(program, name);
    }
    this.resize();
    this.intersection = new IntersectionObserver((entries) => {
      this.visible = entries.some((entry) => entry.isIntersecting);
      if (this.visible && this.running) this.kick();
    });
    this.intersection.observe(this.canvas);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.canvas);
    this.supported = true;
    return true;
  }

  private resize(): void {
    const gl = this.gl;
    if (!gl) return;
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(2, Math.floor(rect.width * this.scale));
    const height = Math.max(2, Math.floor(rect.height * this.scale));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    gl.viewport(0, 0, width, height);
  }

  private draw = (now: number) => {
    this.raf = requestAnimationFrame(this.draw);
    const gl = this.gl;
    if (!gl || !this.visible || document.visibilityState === 'hidden') return;
    if (this.options.reducedMotion) {
      if (this.frameCount > 0) return;
    }
    const elapsed = this.options.reducedMotion ? 8 : (now - this.startTime) / 1000;
    const signal = this.options.getSignal();
    gl.uniform2f(this.uniforms.uRes!, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.uniforms.uTime!, elapsed + this.pausedAt);
    gl.uniform1f(this.uniforms.uSignal!, signal.level);
    gl.uniform1f(this.uniforms.uBass!, signal.bass);
    gl.uniform1f(this.uniforms.uMid!, signal.mid);
    gl.uniform1f(this.uniforms.uHigh!, signal.high);
    gl.uniform1f(this.uniforms.uMode!, this.options.mode);
    gl.uniform1f(this.uniforms.uReduced!, this.options.reducedMotion ? 1 : 0);
    gl.uniform3fv(this.uniforms.uAccent!, toRgb01(this.resolvedAccent));
    gl.uniform3fv(this.uniforms.uInk!, toRgb01(this.resolvedInk));
    gl.uniform3fv(this.uniforms.uPaper!, toRgb01(this.resolvedPaper));
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    this.frameCount += 1;
    if (now - this.fpsWindowStart > 1000) {
      const fps = Math.round((this.frameCount * 1000) / (now - this.fpsWindowStart));
      this.options.onFrameStats?.(fps, this.scale);
      if (fps < 42 && this.scale > 0.56) {
        this.slowFrames += 1;
        if (this.slowFrames >= 2) {
          this.scale = Math.max(0.56, this.scale - 0.18);
          this.slowFrames = 0;
          this.resize();
        }
      } else if (fps > 55) {
        this.slowFrames = 0;
      }
      this.frameCount = 0;
      this.fpsWindowStart = now;
    }
  };

  start(): void {
    if (!this.supported && !this.init()) return;
    if (this.running) return;
    this.running = true;
    this.startTime = performance.now() - this.pausedAt * 1000;
    this.raf = requestAnimationFrame(this.draw);
  }

  private kick(): void {
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(this.draw);
  }

  destroy(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.pausedAt = 0;
    this.intersection?.disconnect();
    this.resizeObserver?.disconnect();
    const gl = this.gl;
    if (gl) {
      if (this.program) gl.deleteProgram(this.program);
    }
    this.gl = null;
    this.program = null;
    this.supported = false;
  }

  /** Setzt das Timing nach einer Pause fort (Resize/Signalwechsel). */
  pause(): void {
    this.pausedAt = (performance.now() - this.startTime) / 1000;
    cancelAnimationFrame(this.raf);
    this.running = false;
  }
}
