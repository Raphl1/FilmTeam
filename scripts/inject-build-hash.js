#!/usr/bin/env node
/**
 * Build-time SW versioning.
 *
 * Replaces __BUILD_HASH__ in sw.js with the current git short-hash, falling
 * back to a YYYY-MM-DD-HHmm timestamp if git isn't available.
 *
 * Usage (in package.json scripts):
 *   "prebuild:css": "node scripts/inject-build-hash.js"
 *
 * Idempotent: writes to sw.js only when the hash actually changes.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SW_PATH = resolve(__dirname, '..', 'sw.js');

function gitHash() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  }
}

const hash = gitHash();
const sw = readFileSync(SW_PATH, 'utf8');

// Replace either the placeholder OR a previously injected hash line
const updated = sw.replace(/const BUILD_HASH = '[^']*';/, `const BUILD_HASH = '${hash}';`);

if (updated !== sw) {
  writeFileSync(SW_PATH, updated);
  console.log(`[sw] BUILD_HASH set to ${hash}`);
} else {
  console.log(`[sw] BUILD_HASH already ${hash}, no change`);
}