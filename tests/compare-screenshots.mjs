// Compare two folders of visual-test screenshots pixel by pixel (no dependencies: PNG decoded with node:zlib).
// Usage: node tests/compare-screenshots.mjs test-baseline test-output   (exit 1 if any image differs beyond tolerance)
import fs from 'node:fs'; import path from 'node:path'; import zlib from 'node:zlib';
const [a, b] = process.argv.slice(2); if (!a || !b) { console.error('Usage: node tests/compare-screenshots.mjs <baseline-dir> <output-dir>'); process.exit(2); }
const TOLERANCE = 16, MAX_CHANGED = 0.001; // a pixel "changed" if any channel moves more than 16/255; fail above 0.1% changed pixels

function decode(file) {
  const buf = fs.readFileSync(file); let pos = 8, w, h, depth, type, idat = [];
  while (pos < buf.length) { const len = buf.readUInt32BE(pos), kind = buf.toString('ascii', pos + 4, pos + 8), data = buf.subarray(pos + 8, pos + 8 + len); pos += 12 + len;
    if (kind === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; type = data[9]; if (depth !== 8 || data[12]) throw new Error(file + ': only 8-bit non-interlaced PNG supported'); }
    else if (kind === 'IDAT') idat.push(data); else if (kind === 'IEND') break; }
  const bpp = { 2: 3, 6: 4, 0: 1, 4: 2 }[type]; if (!bpp) throw new Error(file + ': unsupported PNG colour type ' + type);
  const raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * bpp, px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) { const f = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), row = y * stride;
    for (let x = 0; x < stride; x++) { const left = x >= bpp ? px[row + x - bpp] : 0, up = y ? px[row - stride + x] : 0, ul = y && x >= bpp ? px[row - stride + x - bpp] : 0;
      let p = src[x]; if (f === 1) p += left; else if (f === 2) p += up; else if (f === 3) p += (left + up) >> 1;
      else if (f === 4) { const e = left + up - ul, da = Math.abs(e - left), db = Math.abs(e - up), dc = Math.abs(e - ul); p += da <= db && da <= dc ? left : db <= dc ? up : ul; }
      px[row + x] = p & 255; } }
  return { w, h, bpp, px };
}

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
