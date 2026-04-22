#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BACKEND_PATH = path.join(ROOT, 'apps', 'cms', 'src', 'payload-types.ts');

/** Primary app is Core; mobile kept in sync until apps/mobile is removed. */
const TARGET_DIRS = [
  path.join(ROOT, 'apps', 'core', 'lib', 'types'),
  path.join(ROOT, 'apps', 'mobile', 'lib', 'types'),
];

function copyTypes() {
  if (!fs.existsSync(BACKEND_PATH)) {
    console.error(`[sync-payload-types] Kon bronbestand niet vinden: ${BACKEND_PATH}`);
    process.exit(1);
  }

  const banner = `/**
 * 🚨 Deze file wordt automatisch gegenereerd.
 * Bron: apps/cms/src/payload-types.ts
 * Voer "pnpm copy:payload-types" uit om te vernieuwen.
 */
`;

  const contents = fs.readFileSync(BACKEND_PATH, 'utf8');
  const output = `${banner}${contents}`;

  for (const dir of TARGET_DIRS) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const file = path.join(dir, 'payload-generated.ts');
    fs.writeFileSync(file, output, 'utf8');
    console.log(`[sync-payload-types] Types gekopieerd naar ${path.relative(ROOT, file)}`);
  }
}

copyTypes();
