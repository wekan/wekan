#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const DATA = path.join(ROOT, 'imports/i18n/data');
// Transifex numbers protected HTML/angle spans and application placeholders in
// one left-to-right sequence. Match a complete tag first so a printf token in
// an href remains part of that single protected span.
const SOURCE_PLACEHOLDER_PATTERN = /`[^`]+`|<[^>]+>|__[^\s]+?__|%(?:\d+\$)?[A-Za-z]/g;
const MACHINE_PATTERN = /(?:@\s*){1,2}PH(\d+)(?:\s*@){1,2}/g;
const apply = process.argv.includes('--apply');

if (process.argv.some(argument => ![
  process.argv[0], process.argv[1], '--apply', '--check',
].includes(argument))) {
  console.error('Usage: node repair-machine-placeholders.mjs [--check|--apply]');
  process.exit(2);
}

const english = JSON.parse(fs.readFileSync(path.join(DATA, 'en.i18n.json')));
let filesChanged = 0;
let valuesChanged = 0;
let markersChanged = 0;
const errors = [];
const pendingWrites = [];

for (const filename of fs.readdirSync(DATA).filter(name =>
  name.endsWith('.i18n.json') && name !== 'en.i18n.json')) {
  const filepath = path.join(DATA, filename);
  const translated = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  let changed = false;

  for (const [key, value] of Object.entries(translated)) {
    if (!MACHINE_PATTERN.test(value)) {
      MACHINE_PATTERN.lastIndex = 0;
      continue;
    }
    MACHINE_PATTERN.lastIndex = 0;
    const sourceTokens = (english[key] || '').match(SOURCE_PLACEHOLDER_PATTERN) || [];
    let valueMarkers = 0;
    const repaired = value.replace(MACHINE_PATTERN, (marker, indexText) => {
      const index = Number(indexText);
      if (index >= sourceTokens.length) {
        errors.push(`${filename}:${key} has ${marker} but English has only ${sourceTokens.length} tokens`);
        return marker;
      }
      valueMarkers += 1;
      return sourceTokens[index];
    });
    MACHINE_PATTERN.lastIndex = 0;

    if (repaired !== value) {
      translated[key] = repaired;
      changed = true;
      valuesChanged += 1;
      markersChanged += valueMarkers;
    }
  }

  if (changed) {
    filesChanged += 1;
    pendingWrites.push([filepath, translated]);
  }
}

if (errors.length) {
  for (const error of errors) console.error(error);
  process.exit(1);
}

if (apply) {
  for (const [filepath, translated] of pendingWrites) {
    fs.writeFileSync(filepath, `${JSON.stringify(translated, null, 2)}\n`);
  }
}

console.log(`${apply ? 'Repaired' : 'Found'} ${markersChanged} machine placeholder markers in ${valuesChanged} values across ${filesChanged} files.`);
if (!apply && markersChanged) process.exitCode = 1;
