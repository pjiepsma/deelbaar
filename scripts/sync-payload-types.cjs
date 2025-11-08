#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BACKEND_PATH = path.resolve(ROOT, '..', 'deelbaar-api', 'src', 'payload-types.ts');
const TARGET_DIR = path.resolve(ROOT, 'lib', 'types');
const TARGET_FILE = path.join(TARGET_DIR, 'payload-generated.ts');

function copyTypes() {
  if (!fs.existsSync(BACKEND_PATH)) {
    console.error(`[sync-payload-types] Kon bronbestand niet vinden: ${BACKEND_PATH}`);
    process.exit(1);
  }

  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }

  const banner = `/**
 * 🚨 Deze file wordt automatisch gegenereerd.
 * Bron: deelbaar-api/src/payload-types.ts
 * Voer "yarn copy:payload-types" uit om te vernieuwen.
 */
`;

  const contents = fs.readFileSync(BACKEND_PATH, 'utf8');
  fs.writeFileSync(TARGET_FILE, `${banner}${contents}`, 'utf8');

  console.log(`[sync-payload-types] Types gekopieerd naar ${path.relative(ROOT, TARGET_FILE)}`);
}

copyTypes();

