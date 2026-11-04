/** Verify a portable asset library using only Node built-ins. */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const full = JSON.parse(await fs.readFile(path.join(root, 'manifest.json'), 'utf8'));
const curated = JSON.parse(await fs.readFile(path.join(root, 'website-brief/website-assets.json'), 'utf8'));
const issues = [], ids = new Set(), entries = new Map();
function dimensions(data) {
 if (data.subarray(1, 4).toString() === 'PNG') return [data.readUInt32BE(16), data.readUInt32BE(20)];
 if (data.subarray(0, 4).toString() !== 'RIFF' || data.subarray(8, 12).toString() !== 'WEBP') return null;
 for (let offset = 12; offset + 8 <= data.length;) {
  const type = data.subarray(offset, offset + 4).toString(), size = data.readUInt32LE(offset + 4), start = offset + 8;
  if (type === 'VP8X') return [data.readUIntLE(start + 4, 3) + 1, data.readUIntLE(start + 7, 3) + 1];
  if (type === 'VP8L') { const bits = data.readUInt32LE(start + 1); return [(bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1]; }
  if (type === 'VP8 ') return [data.readUInt16LE(start + 6) & 0x3fff, data.readUInt16LE(start + 8) & 0x3fff];
  offset += 8 + size + (size & 1);
 }
 return null;
}
let bytes = 0;
for (const entry of full.entries) {
 if (ids.has(entry.id)) issues.push('Duplicate id: ' + entry.id);
 ids.add(entry.id); entries.set(entry.id, entry);
 const absolute = path.resolve(root, entry.localPath);
 if (!absolute.startsWith(root + path.sep)) { issues.push('Path escapes package: ' + entry.id); continue; }
 try {
  const data = await fs.readFile(absolute);
  bytes += data.length;
  if (data.length !== entry.bytes) issues.push('Size mismatch: ' + entry.id);
  if (crypto.createHash('sha256').update(data).digest('hex') !== entry.sha256) issues.push('Hash mismatch: ' + entry.id);
  const actual = dimensions(data);
  if (actual && (actual[0] !== entry.width || actual[1] !== entry.height)) issues.push('Dimensions mismatch: ' + entry.id);
 } catch (error) { issues.push('Missing asset: ' + entry.id + ' ' + error.code); }
 if (entry.url !== null && full.publication.status === 'not-published') issues.push('Unpublished asset has URL: ' + entry.id);
 if (entry.publicPath !== '/site/' + entry.localPath || entry.targetPath !== 'public/site/' + entry.localPath) issues.push('Website path mismatch: ' + entry.id);
 if (entry.grid) {
  if (entry.cells.length !== entry.grid.columns * entry.grid.rows) issues.push('Grid mismatch: ' + entry.id);
  for (const cell of entry.cells) {
   const { rect, bounds, pivot, pivotNormalized } = cell;
   if (rect.x < 0 || rect.y < 0 || rect.x + rect.width > entry.width || rect.y + rect.height > entry.height) issues.push('Cell outside image: ' + entry.id);
   if (bounds.x < 0 || bounds.y < 0 || bounds.x + bounds.width > rect.width || bounds.y + bounds.height > rect.height) issues.push('Bounds outside cell: ' + entry.id);
   if (Math.abs(pivot.x / rect.width - pivotNormalized.x) > 1e-6 || Math.abs(pivot.y / rect.height - pivotNormalized.y) > 1e-6) issues.push('Pivot mismatch: ' + entry.id);
  }
 }
}
for (const entry of curated.entries) {
 const source = entries.get(entry.id);
 if (!source || source.sha256 !== entry.sha256 || source.localPath !== entry.localPath) issues.push('Curated entry differs: ' + entry.id);
}
console.log(JSON.stringify({ assets: full.entries.length, websiteAssets: curated.entries.length, bytes, issues }, null, 2));
if (issues.length) process.exitCode = 1;
