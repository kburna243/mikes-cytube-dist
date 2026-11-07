// Split the sticker logo into recolourable alpha masks: wordmark letters and skyline silhouette.
// usage: node split_logo.cjs <sharp-module-dir> <logo.png> <outDir> <skylineCutRow>
const sharp = require(process.argv[2]);
const [src, outDir, cutArg] = process.argv.slice(3);

(async () => {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const N = w * h;
  const opaque = new Uint8Array(N), cream = new Uint8Array(N), dark = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3];
    opaque[i] = a > 128 ? 1 : 0;
    cream[i] = opaque[i] && r > 200 && g > 180 && b > 140 && r - b < 90 ? 1 : 0;
    dark[i] = opaque[i] && r < 70 && g < 70 && b < 70 ? 1 : 0;
  }
  // flood from outside through transparent + cream: reaches the sticker rim, not the enclosed letters
  const reached = new Uint8Array(N);
  const stack = [0];
  reached[0] = 1;
  while (stack.length) {
    const i = stack.pop();
    const x = i % w, y = (i / w) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const j = ny * w + nx;
      if (!reached[j] && !dark[j]) { reached[j] = 1; stack.push(j); }
    }
  }
  const letters = new Uint8Array(N);
  for (let i = 0; i < N; i++) letters[i] = cream[i] && !reached[i] && i >= 580 * w ? 1 : 0;

  async function save(mask, name, cutRow = h) {
    let x0 = w, y0 = h, x1 = 0, y1 = 0;
    for (let y = 0; y < cutRow; y++) for (let x = 0; x < w; x++) if (mask[y * w + x]) {
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
    const out = Buffer.alloc(cw * ch * 4);
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      const on = mask[(y + y0) * w + x + x0];
      out[(y * cw + x) * 4 + 3] = on ? 255 : 0;
    }
    await sharp(out, { raw: { width: cw, height: ch, channels: 4 } }).png().toFile(`${outDir}/${name}.png`);
    await sharp(out, { raw: { width: cw, height: ch, channels: 4 } }).webp({ lossless: true }).toFile(`${outDir}/${name}.webp`);
    console.log(name, cw, ch, { x0, y0 });
  }
  await save(letters, "logo-wordmark");

  // skyline: dark buildings + the (orange) TV-tower antenna, then an opening to drop thin rim outlines
  const sky = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const x = i % w, y = (i / w) | 0;
    sky[i] = dark[i] || (opaque[i] && !cream[i] && x >= 915 && x <= 975 && y <= 215) ? 1 : 0;
  }
  const morph = (m, keepIfAll, r) => {
    const o = new Uint8Array(N);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let all = true, any = false;
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const nx = x + dx, ny = y + dy;
        const v = nx >= 0 && ny >= 0 && nx < w && ny < h ? m[ny * w + nx] : 0;
        if (v) any = true; else all = false;
      }
      o[y * w + x] = keepIfAll ? (all ? 1 : 0) : (any ? 1 : 0);
    }
    return o;
  };
  const opened = morph(morph(sky, true, 3), false, 3);
  for (let i = 0; i < N; i++) if (i % w >= 1077) opened[i] = 0; // letter-outline remnants right of the last building
  await save(opened, "logo-skyline", Number(cutArg) || (h / 2) | 0);
})();
