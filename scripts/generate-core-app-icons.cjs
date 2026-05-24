'use strict';

const fs = require('fs');
const path = require('path');

function loadSharp() {
  const candidates = [
    path.join(__dirname, '..', 'node_modules', 'sharp'),
    path.join(__dirname, '..', 'apps', 'cms', 'node_modules', 'sharp'),
  ];
  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch {
      /* try next */
    }
  }
  throw new Error(
    'sharp not found. Run `pnpm install` from the repo root so CMS deps (including sharp) are installed.',
  );
}

const sharp = loadSharp();

const ROOT = path.join(__dirname, '..');
const CORE_ASSETS = path.join(ROOT, 'apps', 'core', 'assets');
const SVG_PATH = path.join(CORE_ASSETS, 'deelbaar-logo.svg');
const VIEWBOX_W = 600;
const VIEWBOX_H = 577;

async function compositeSquare(filename, size, scale, background) {
  const svgBuf = fs.readFileSync(SVG_PATH);
  let w = Math.round(VIEWBOX_W * scale);
  let h = Math.round(VIEWBOX_H * scale);
  if (w > size || h > size) {
    const fit = Math.min(size / w, size / h);
    w = Math.max(1, Math.round(w * fit));
    h = Math.max(1, Math.round(h * fit));
  }
  const resized = await sharp(svgBuf).resize(w, h).png().toBuffer();
  const left = Math.round((size - w) / 2);
  const top = Math.round((size - h) / 2);
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })
    .composite([{ input: resized, left, top }])
    .png()
    .toFile(path.join(CORE_ASSETS, filename));
  console.log(`wrote apps/core/assets/${filename}`);
}

(async () => {
  await compositeSquare('icon.png', 1024, 1, { r: 255, g: 255, b: 255, alpha: 1 });
  await compositeSquare('adaptive-icon.png', 1024, 0.72, { r: 0, g: 0, b: 0, alpha: 0 });
  await compositeSquare('splash-icon.png', 1024, 0.85, { r: 255, g: 255, b: 255, alpha: 1 });
  await compositeSquare('favicon.png', 48, 0.85, { r: 255, g: 255, b: 255, alpha: 1 });
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
