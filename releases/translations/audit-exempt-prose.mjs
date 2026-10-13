#!/usr/bin/env node
// Read-only supplement to the fill inventory. A product prefix does not make
// the surrounding English explanation an invariant technical name.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const exactTechnicalNames = new Set([
  'S3', 'S3/MinIO', 'MongoDB', 'MongoDB Compact',
  'MongoDB CollectionFS', 'MongoDB Meteor-Files',
]);
const genericLabels = new Set(['Bytes', 'Platform', 'Logo', 'USA', 'Asia']);
const keyboardLabel = /^blockly-(?:ALT_KEY|BACKSPACE_KEY|CAPS_LOCK_KEY|COMMAND_KEY|CONTROL_KEY|END_KEY|ENTER_KEY|ESCAPE|HOME_KEY|INSERT_KEY|OPTION_KEY|PAGE_DOWN_KEY|PAGE_UP_KEY|PAUSE_KEY|SHIFT_KEY|SPACE_KEY|TAB_KEY)$/;

export function exemptProseCandidates(source, locale) {
  return Object.fromEntries(Object.entries(source).filter(([key, value]) => {
    if (typeof value !== 'string' || locale[key] !== value) return false;
    if (exactTechnicalNames.has(value)) return false;
    return /^(?:S3|MongoDB)(?:[ /-]|$)/.test(value)
      || genericLabels.has(value) || keyboardLabel.test(key);
  }));
}

export function auditExemptProse(directory) {
  const source = JSON.parse(fs.readFileSync(path.join(directory, 'en.i18n.json'), 'utf8'));
  const locales = {};
  for (const file of fs.readdirSync(directory).filter(f => f.endsWith('.i18n.json')).sort()) {
    const code = file.slice(0, -'.i18n.json'.length);
    if (/^en(?:[-_]|$)/.test(code)) continue;
    const candidates = exemptProseCandidates(source, JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8')));
    if (Object.keys(candidates).length) locales[code] = candidates;
  }
  return {
    note: 'Review candidates, not automatic corrections. Shared native words and physical key legends may be intentional. Preserve existing human-verified zh translations; add only confirmed missing strings there.',
    candidateCount: Object.values(locales).reduce((sum, entries) => sum + Object.keys(entries).length, 0),
    localeCount: Object.keys(locales).length,
    protectedExistingLocales: Object.keys(locales).filter(code => /^zh(?:[-_]|$)/.test(code)),
    locales,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(JSON.stringify(auditExemptProse(path.resolve('imports/i18n/data')), null, 2) + '\n');
}
