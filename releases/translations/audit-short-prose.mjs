#!/usr/bin/env node
// Read-only review queue: identical short words may be untranslated OR shared
// vocabulary. Never use this report to overwrite a translation automatically.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function shortProseCandidates(source, locale) {
  return Object.fromEntries(Object.entries(source).filter(([key, value]) => {
    if (typeof value !== 'string' || locale[key] !== value) return false;
    // Match words, not units, OS/product names, search abbreviations or notation.
    // Strip indexed arguments only for classification, never from the report.
    const prose = value.replace(/%\d+/g, '').replace(/#/g, '').trim();
    return /^(?:if|do|or|as|to|on|of|by|is|At|To|No|Me|OK)$/.test(prose);
  }));
}

export function auditShortProse(directory) {
  const source = JSON.parse(fs.readFileSync(path.join(directory, 'en.i18n.json'), 'utf8'));
  const locales = {};
  for (const file of fs.readdirSync(directory).filter(file => file.endsWith('.i18n.json')).sort()) {
    const code = file.slice(0, -'.i18n.json'.length);
    if (/^en(?:[-_]|$)/.test(code)) continue;
    const candidates = shortProseCandidates(source, JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8')));
    if (Object.keys(candidates).length) locales[code] = candidates;
  }
  return {
    note: 'Review candidates, not confirmed untranslated strings. Shared words require locale-specific review.',
    candidateCount: Object.values(locales).reduce((sum, entries) => sum + Object.keys(entries).length, 0),
    localeCount: Object.keys(locales).length,
    locales,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(JSON.stringify(auditShortProse(path.resolve('imports/i18n/data')), null, 2) + '\n');
}
