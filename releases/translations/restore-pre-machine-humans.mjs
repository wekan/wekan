#!/usr/bin/env node

// Restore correct-language translations that existed immediately before the
// repository-wide direct-fill phase and were later displaced. The boundary is
// the final placeholder-repair commit; mass fills begin in its child 1e6b0e73f.
//
// The allowlist is deliberately reviewed per key. A blind historical restore
// would also discard newer valid Transifex work (for example zh-TW, es and rw).
// Usage: node releases/translations/restore-pre-machine-humans.mjs [--check|--apply]

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASELINE = '70bac688e46ac1e8605f038b819d47c7dce06f32';
const DATA = 'imports/i18n/data';
const RESTORE = {
  br: ['globalSearch-instructions-operator-has'],
  'cy-GB': ['board-public-info', 'page-maybe-private'],
  cy: ['board-public-info', 'page-maybe-private'],
  'fr-CH': ['globalSearch-instructions-operator-has'],
  'fr-FR': ['globalSearch-instructions-operator-has'],
  fr: ['globalSearch-instructions-operator-has'],
  oc: ['globalSearch-instructions-operator-has'],
  vo: ['globalSearch-instructions-operator-has'],
  wa: ['globalSearch-instructions-operator-has'],
  wo: ['globalSearch-instructions-operator-has'],
  xh: ['globalSearch-instructions-operator-assignee'],
  zgh: ['globalSearch-instructions-operator-has'],
};

const apply = process.argv.includes('--apply');
if (process.argv.some(arg => ![process.argv[0], process.argv[1], '--check', '--apply'].includes(arg))) {
  console.error('Usage: node releases/translations/restore-pre-machine-humans.mjs [--check|--apply]');
  process.exit(2);
}

let differences = 0;
for (const [lang, keys] of Object.entries(RESTORE)) {
  const filename = `${lang}.i18n.json`;
  const filepath = path.join(DATA, filename);
  const historical = JSON.parse(execFileSync(
    'git', ['show', `${BASELINE}:${filepath}`], { encoding: 'utf8' },
  ));
  const current = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  let changed = false;

  for (const key of keys) {
    if (current[key] === historical[key]) continue;
    differences += 1;
    changed = true;
    if (apply) current[key] = historical[key];
    else console.log(`${lang}\t${key}`);
  }

  if (apply && changed) {
    fs.writeFileSync(filepath, `${JSON.stringify(current, null, 2)}\n`);
  }
}

console.log(`${apply ? 'Restored' : 'Found'} ${differences} displaced pre-fill human translation(s).`);
if (!apply && differences) process.exitCode = 1;
