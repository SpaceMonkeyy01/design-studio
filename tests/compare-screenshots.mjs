// Compare two folders of visual-test screenshots pixel by pixel (no dependencies: PNG decoded by png.mjs).
// Usage: node tests/compare-screenshots.mjs test-baseline test-output   (exit 1 if any image differs beyond tolerance)
import fs from 'node:fs'; import path from 'node:path'; import { decode } from './png.mjs';
const [a, b] = process.argv.slice(2); if (!a || !b) { console.error('Usage: node tests/compare-screenshots.mjs <baseline-dir> <output-dir>'); process.exit(2); }
const TOLERANCE = 16, MAX_CHANGED = 0.001; // a pixel "changed" if any channel moves more than 16/255; fail above 0.1% changed pixels


const files = fs.readdirSync(a).filter(f => f.endsWith('.png')).sort(); let failed = 0;
for (const f of files) {
  if (!fs.existsSync(path.join(b, f))) { console.log(`MISSING  ${f}`); failed++; continue; }
  const x = decode(path.join(a, f)), y = decode(path.join(b, f));
  if (x.w !== y.w || x.h !== y.h) { console.log(`SIZE     ${f}  ${x.w}x${x.h} vs ${y.w}x${y.h}`); failed++; continue; }
  let changed = 0, maxDiff = 0, sum = 0; const n = x.w * x.h, ch = Math.min(x.bpp, y.bpp, 3);
  for (let i = 0; i < n; i++) { let d = 0; for (let c = 0; c < ch; c++) d = Math.max(d, Math.abs(x.px[i * x.bpp + c] - y.px[i * y.bpp + c])); sum += d; if (d > maxDiff) maxDiff = d; if (d > TOLERANCE) changed++; }
  const ok = changed / n <= MAX_CHANGED; if (!ok) failed++;
  console.log(`${ok ? 'MATCH   ' : 'DIFFERS '} ${f}  changed ${(changed / n * 100).toFixed(3)}%  max ${maxDiff}  mean ${(sum / n).toFixed(3)}`);
}
console.log(failed ? `${failed} of ${files.length} screenshots differ` : `All ${files.length} screenshots match`); process.exitCode = failed ? 1 : 0;
