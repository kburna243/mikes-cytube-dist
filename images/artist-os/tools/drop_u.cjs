// NEIGHBOUR -> NEIGHBOR in the wordmark mask: drop the "U" component, move "R" into its slot.
// usage: node drop_u.cjs <sharp> <in.png> <outBase> <dx> <dy>
const sharp = require(process.argv[2]);
const [src, outBase] = [process.argv[3], process.argv[4]];
const dx = Number(process.argv[5]), dy = Number(process.argv[6]);
(async () => {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const on = (i) => data[i * 4 + 3] >= 128;
  const lab = new Int32Array(w * h).fill(-1);
  const boxes = [];
  for (let i = 0; i < w * h; i++) {
    if (!on(i) || lab[i] >= 0) continue;
    const id = boxes.length, st = [i]; let x0 = w, y0 = h, n = 0;
    lab[i] = id;
    while (st.length) {
      const j = st.pop(), x = j % w, y = (j / w) | 0; n++;
      if (x < x0) x0 = x; if (y < y0) y0 = y;
      for (const [ax, ay] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = x + ax, ny = y + ay;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const k = ny * w + nx;
        if (lab[k] < 0 && on(k)) { lab[k] = id; st.push(k); }
      }
    }
    boxes.push({ id, x0, y0, n });
  }
  // identify by position (second line): U starts x≈824,y≈154; R starts x≈920,y≈149
  const pick = (x, y) => boxes.find((b) => b.n > 200 && Math.abs(b.x0 - x) < 6 && Math.abs(b.y0 - y) < 6).id;
  const U = pick(824, 154), R = pick(920, 149);
  const outW = w + Math.min(0, 0);
  const out = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) if (lab[i] >= 0 && lab[i] !== U && lab[i] !== R) out[i] = data[i * 4 + 3];
  for (let i = 0; i < w * h; i++) if (lab[i] === R) {
    const x = (i % w) + dx, y = ((i / w) | 0) + dy;
    if (x >= 0 && y >= 0 && x < w && y < h) out[y * w + x] = Math.max(out[y * w + x], data[i * 4 + 3]);
  }
  // crop to content
  let x1 = 0; for (let i = 0; i < w * h; i++) if (out[i] && i % w > x1) x1 = i % w;
  const cw = x1 + 1, rgba = Buffer.alloc(cw * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < cw; x++) rgba[(y * cw + x) * 4 + 3] = out[y * w + x];
  const img = () => sharp(rgba, { raw: { width: cw, height: h, channels: 4 } });
  await img().png().toFile(outBase + ".png");
  await img().webp({ lossless: true }).toFile(outBase + ".webp");
  console.log("size", cw, h);
})();
