// Minimal PNG read/write with node:zlib, for tests (8-bit, non-interlaced; grey, grey+alpha, RGB, RGBA).
import fs from 'node:fs'; import zlib from 'node:zlib';
export function decode(file) {
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
// RGB (3 bytes per pixel) → PNG file.
export function encodeRGB(file, w, h, rgb) {
  const table = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; table[n] = c >>> 0; }
  const crc = b => { let c = ~0; for (const v of b) c = table[(c ^ v) & 255] ^ (c >>> 8); return (~c) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4), sum = Buffer.alloc(4), body = Buffer.concat([Buffer.from(type), data]); len.writeUInt32BE(data.length); sum.writeUInt32BE(crc(body)); return Buffer.concat([len, body, sum]); };
  const head = Buffer.alloc(13); head.writeUInt32BE(w, 0); head.writeUInt32BE(h, 4); head[8] = 8; head[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h); for (let y = 0; y < h; y++) Buffer.from(rgb.buffer, rgb.byteOffset + y * w * 3, w * 3).copy(raw, y * (w * 3 + 1) + 1);
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', head), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}
