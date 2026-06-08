/**
 * Génère icon.png (512x512) pour "Raccourcis Clavier"
 * Design : fond indigo arrondi + touches de clavier blanches
 * Aucune dépendance externe — PNG encodé manuellement (zlib natif)
 */
const { deflateSync } = require('zlib')
const fs = require('fs')
const path = require('path')

const SIZE = 512

// ─── Helpers ──────────────────────────────────────────────────────

function u32be(n) {
  const b = Buffer.alloc(4)
  b.writeUInt32BE(n, 0)
  return b
}

function crc32(buf) {
  let c = 0xFFFFFFFF
  for (const byte of buf) {
    c ^= byte
    for (let i = 0; i < 8; i++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
  }
  return (c ^ 0xFFFFFFFF) >>> 0
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii')
  const len = u32be(data.length)
  const crc = u32be(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crc])
}

// ─── Draw ─────────────────────────────────────────────────────────

// RGBA pixel buffer
const pixels = Buffer.alloc(SIZE * SIZE * 4, 0)

function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return
  const idx = (y * SIZE + x) * 4
  pixels[idx] = r; pixels[idx+1] = g; pixels[idx+2] = b; pixels[idx+3] = a
}

function fillRect(x, y, w, h, r, g, b, a = 255) {
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++)
      setPixel(x + dx, y + dy, r, g, b, a)
}

function roundedRect(x, y, w, h, radius, r, g, b, a = 255) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const px = x + dx, py = y + dy
      // corner check
      let inCorner = false
      const corners = [
        [x + radius, y + radius],
        [x + w - 1 - radius, y + radius],
        [x + radius, y + h - 1 - radius],
        [x + w - 1 - radius, y + h - 1 - radius],
      ]
      for (const [cx, cy] of corners) {
        const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2)
        if (Math.abs(px - cx) <= radius && Math.abs(py - cy) <= radius && dist > radius) {
          inCorner = true; break
        }
      }
      if (!inCorner) setPixel(px, py, r, g, b, a)
    }
  }
}

// Background — indigo #4f46e5 with rounded corners (radius 100)
roundedRect(0, 0, SIZE, SIZE, 100, 79, 70, 229)

// Draw keyboard rows: 3 rows of keycaps
// Keycap color: white with slight transparency effect (top highlight)
const KEY_W = 68, KEY_H = 64, KEY_R = 12
const KEY_FG = [255, 255, 255]
const KEY_SHADOW = [40, 35, 180]

function drawKey(x, y, w = KEY_W) {
  // Shadow (bottom edge)
  roundedRect(x, y + 6, w, KEY_H, KEY_R, ...KEY_SHADOW)
  // Key face
  roundedRect(x, y, w, KEY_H - 4, KEY_R, ...KEY_FG)
}

// Row 1 — 5 keys
const row1Y = 148
const row1Keys = [80, 160, 240, 320, 400]
row1Keys.forEach(kx => drawKey(kx, row1Y))

// Row 2 — 4 keys slightly wider
const row2Y = 236
const row2Keys = [100, 190, 280, 360]
row2Keys.forEach(kx => drawKey(kx, row2Y, 72))

// Row 3 — spacebar (wide) + 2 keys
const row3Y = 324
drawKey(80, row3Y, 68)   // left key
drawKey(164, row3Y, 184) // spacebar
drawKey(364, row3Y, 68)  // right key

// Small dot on middle key row1 (accent)
fillRect(240 + KEY_W/2 - 6, row1Y + KEY_H/2 - 4 - 4, 12, 12, 79, 70, 229)

// ─── Encode PNG ───────────────────────────────────────────────────

// Raw image data with filter byte (0 = None) per scanline
const scanlines = []
for (let y = 0; y < SIZE; y++) {
  const row = Buffer.alloc(1 + SIZE * 4)
  row[0] = 0 // filter None
  pixels.copy(row, 1, y * SIZE * 4, (y + 1) * SIZE * 4)
  scanlines.push(row)
}
const raw = deflateSync(Buffer.concat(scanlines), { level: 6 })

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(SIZE, 0)
ihdr.writeUInt32BE(SIZE, 4)
ihdr[8] = 8  // bit depth
ihdr[9] = 6  // RGBA
ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0

const png = Buffer.concat([
  sig,
  chunk('IHDR', ihdr),
  chunk('IDAT', raw),
  chunk('IEND', Buffer.alloc(0)),
])

const outPath = path.join(__dirname, 'public', 'icon.png')
fs.writeFileSync(outPath, png)
console.log(`✅ icon.png généré (${SIZE}x${SIZE}) → ${outPath}`)
