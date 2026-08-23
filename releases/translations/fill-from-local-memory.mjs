#!/usr/bin/env node

/**
 * Fill repeated English placeholders from translation memory in the SAME file.
 *
 * WeKan has many keys with identical English source text (for example
 * `location` and `office-location`). If a language already has exactly one
 * non-English value for that source text, reuse it for placeholder copies.
 * Ambiguous source text is left untouched, and existing translations are
 * never overwritten.
 *
 * Usage:
 *   node releases/translations/fill-from-local-memory.mjs --dry-run
 *   node releases/translations/fill-from-local-memory.mjs --write
 */

import fs from 'node:fs';
import path from 'node:path';

const mode = process.argv[2] || '--dry-run';
if (!['--dry-run', '--write'].includes(mode)) {
  console.error('Usage: fill-from-local-memory.mjs --dry-run | --write');
  process.exit(1);
}

const DATA_DIR = 'imports/i18n/data';
const EN_FILE = path.join(DATA_DIR, 'en.i18n.json');
const en = JSON.parse(fs.readFileSync(EN_FILE, 'utf8'));
const keys = Object.keys(en);
const isEnglish = code => /^en(?:[-_].*)?$/.test(code);

function orderedJson(data) {
  const ordered = {};
  for (const key of keys) {
    if (typeof data[key] === 'string') ordered[key] = data[key];
  }
  for (const [key, value] of Object.entries(data)) {
    if (!(key in ordered)) ordered[key] = value;
  }
  return `${JSON.stringify(ordered, null, 2)}\n`;
}

let filesChanged = 0;
let valuesFilled = 0;
let ambiguousSources = 0;

for (const name of fs.readdirSync(DATA_DIR).sort()) {
  if (!name.endsWith('.i18n.json')) continue;
  const code = name.slice(0, -'.i18n.json'.length);
  if (isEnglish(code)) continue;

  const file = path.join(DATA_DIR, name);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const memory = new Map();

  for (const key of keys) {
    const source = en[key];
    const value = data[key];
    if (typeof source !== 'string' || typeof value !== 'string' || value === source) continue;
    if (!memory.has(source)) memory.set(source, new Set());
    memory.get(source).add(value);
  }

  const ambiguous = new Set(
    [...memory].filter(([, values]) => values.size !== 1).map(([source]) => source),
  );
  ambiguousSources += ambiguous.size;

  // Protocol versions are not vocabulary: preserve this language own
  // translation and word order for "IP address", changing only the standard
  // literal token. Refuse the derivation unless the base is unique and really
  // contains that token.
  const derivedMemory = new Map();
  const ipAddressValues = memory.get("IP address");
  if (ipAddressValues?.size === 1) {
    const ipAddress = ipAddressValues.values().next().value;
    if (/\bIP\b/.test(ipAddress)) {
      derivedMemory.set("IPv4 address", ipAddress.replace(/\bIP\b/g, "IPv4"));
      derivedMemory.set("IPv6 address", ipAddress.replace(/\bIP\b/g, "IPv6"));
    }
  }

  let filled = 0;
  for (const key of keys) {
    const source = en[key];
    const current = data[key];
    if (typeof source !== 'string' || (typeof current === 'string' && current !== source)) continue;
    const derived = derivedMemory.get(source);
    const values = memory.get(source);
    const exact = values?.size === 1 ? values.values().next().value : undefined;
    if (derived === undefined && exact === undefined) continue;
    data[key] = derived ?? exact;
    filled += 1;
  }

  if (!filled) continue;
  filesChanged += 1;
  valuesFilled += filled;
  console.log(`${mode === '--write' ? 'filled' : 'would fill'} ${filled}\t${code}`);
  if (mode === '--write') fs.writeFileSync(file, orderedJson(data));
}

console.log(
  `${mode}: ${valuesFilled} placeholder(s) in ${filesChanged} language file(s); `
    + `${ambiguousSources} ambiguous source occurrence(s) left untouched.`,
);
