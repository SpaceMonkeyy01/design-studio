// Does the built outline match the logo? Repeats processArt's mask steps (alpha / white-background cut, crop, 960 px mask,
// cleanArtworkMask), traces and smooths as the studio does, fills the result at the logo's full resolution and compares it
// with the logo's own pixels. Deviation = how far a wrong pixel lies from the logo's true edge, in logo pixels.
// The mask downscale is bilinear like canvas drawImage; it is a model of the browser, so expect ±0.5 px from that alone.
// Diff images (grey = match, red = in the logo but not built, blue = built but not in the logo) go to test-output/trace/.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { decode, encodeRGB } from './png.mjs';
import { traceMask, smoothLoops } from '../app/core/geometry.mjs';
import { cleanArtworkMask } from '../app/core/artwork.mjs';
const MAX_DEVIATION = 3; // logo pixels (~3.5 mm on a 48″ sign from a ~1000 px logo); tracing at 960 px plus the 1.25 px simplification alone reach ~2.5
const root = fileURLToPath(new URL('../', import.meta.url)), out = path.join(root, 'test-output', 'trace'); fs.mkdirSync(out, { recursive: true });
const logos = ['app/sample.png', ...fs.readdirSync(path.join(root, 'tests/fixtures')).filter(f => f.endsWith('.png')).map(f => 'tests/fixtures/' + f)];

// Even-odd scanline fill of traced loops (mask coordinates × k) at W × H.
function fill(loops, k, W, H) { const out = new Uint8Array(W * H), edges = [];
  for (const { points } of loops) for (let i = 0; i < points.length; i++) { const a = points[i], b = points[(i + 1) % points.length]; edges.push([a[0] * k, a[1] * k, b[0] * k, b[1] * k]); }
  for (let y = 0; y < H; y++) { const yc = y + .5, xs = []; for (const [x0, y0, x1, y1] of edges) if ((y0 > yc) !== (y1 > yc)) xs.push(x0 + (yc - y0) / (y1 - y0) * (x1 - x0)); xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.max(0, Math.ceil(xs[i] - .5)); x < Math.min(W, Math.ceil(xs[i + 1] - .5)); x++) out[y * W + x] = 1; }
  return out; }
// Distance from every pixel to the mask's edge (chamfer, two passes). The image border is an edge too: the crop is tight.
function edgeDistance(mask, W, H) { const d = new Float32Array(W * H).fill(1e9), s = Math.SQRT2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x, m = mask[i]; if ((m && (!x || !y || x === W - 1 || y === H - 1)) || (x && mask[i - 1] !== m) || (y && mask[i - W] !== m) || (x < W - 1 && mask[i + 1] !== m) || (y < H - 1 && mask[i + W] !== m)) d[i] = .5; }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (x) d[i] = Math.min(d[i], d[i - 1] + 1); if (y) { d[i] = Math.min(d[i], d[i - W] + 1); if (x) d[i] = Math.min(d[i], d[i - W - 1] + s); if (x < W - 1) d[i] = Math.min(d[i], d[i - W + 1] + s); } }
  for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) { const i = y * W + x; if (x < W - 1) d[i] = Math.min(d[i], d[i + 1] + 1); if (y < H - 1) { d[i] = Math.min(d[i], d[i + W] + 1); if (x < W - 1) d[i] = Math.min(d[i], d[i + W + 1] + s); if (x) d[i] = Math.min(d[i], d[i + W - 1] + s); } }
  return d; }

let failed = 0; const report = {};
for (const file of logos) { const { w, h, bpp, px } = decode(path.join(root, file)), A = i => bpp === 4 ? px[i * 4 + 3] : 255, C = (i, c) => px[i * bpp + c];
  // Background removal as processArt's 'auto': real transparency → cut by alpha, else remove near-white.
  let clear = 0, n = 0; for (let i = 0; i < w * h; i += 4) { n++; if (A(i) < 40) clear++; } const alpha = clear > n * .02, visible = i => A(i) > 40 && (alpha || Math.min(C(i, 0), C(i, 1), C(i, 2)) < 225);
  let x0 = w, y0 = h, x1 = -1, y1 = -1; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (visible(y * w + x)) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const W = x1 - x0 + 1, H = y1 - y0 + 1, logo = new Uint8Array(W * H), a = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y + y0) * w + x + x0, v = visible(i) ? A(i) : 0; a[y * W + x] = v; logo[y * W + x] = v > 100 ? 1 : 0; }
  const sc = Math.min(1, 960 / Math.max(W, H)), mw = Math.max(2, Math.round(W * sc)), mh = Math.max(2, Math.round(H * sc)), mask = new Uint8Array(mw * mh);
  // Bilinear sample at each mask pixel centre, as canvas drawImage does with the default smoothing quality.
  const at = (x, y) => a[Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))];
  for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) { const sx = (x + .5) * W / mw - .5, sy = (y + .5) * H / mh - .5, ix = Math.floor(sx), iy = Math.floor(sy), fx = sx - ix, fy = sy - iy;
    mask[y * mw + x] = (at(ix, iy) * (1 - fx) + at(ix + 1, iy) * fx) * (1 - fy) + (at(ix, iy + 1) * (1 - fx) + at(ix + 1, iy + 1) * fx) * fy > 100 ? 1 : 0; }
  const clean = cleanArtworkMask(mask, mw, mh), d = edgeDistance(logo, W, H), name = path.basename(file, '.png');
  const measure = loops => { const built = fill(loops, W / mw, W, H); let worst = 0, at = 0; for (let i = 0; i < W * H; i++) if (built[i] !== logo[i] && d[i] > worst) { worst = d[i]; at = i; } return { built, worst, at: [at % W, Math.floor(at / W)] }; };
  const raw = measure(traceMask(clean, mw, mh)), smooth = measure(smoothLoops(traceMask(clean, mw, mh), 1.25));
  const rgb = new Uint8Array(W * H * 3); for (let i = 0; i < W * H; i++) rgb.set(logo[i] && smooth.built[i] ? [150, 150, 150] : logo[i] ? [230, 30, 30] : smooth.built[i] ? [30, 60, 230] : [255, 255, 255], i * 3);
  encodeRGB(path.join(out, name + '.png'), W, H, rgb);
  const ok = smooth.worst <= MAX_DEVIATION; if (!ok) failed++;
  report[name] = { size: W + '×' + H, trace: +raw.worst.toFixed(1), built: +smooth.worst.toFixed(1), worstAt: smooth.at, ok };
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name} (${W}×${H}): trace ${raw.worst.toFixed(1)} px, built ${smooth.worst.toFixed(1)} px from the logo's edge at (${smooth.at}) (limit ${MAX_DEVIATION})`); }
if (failed) { console.error(failed + ' logo(s) drift from their artwork; diffs in test-output/trace/'); process.exit(1); }
console.log('TRACE_FIDELITY_OK', JSON.stringify(report));
