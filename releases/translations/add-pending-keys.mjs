#!/usr/bin/env node
// Add new interface strings in English, pending Transifex.
//
//   node releases/translations/add-pending-keys.mjs <new-keys.json> [--after <existing-key>]
//
// <new-keys.json> is { "key": "English text", ... }. Each key is added to
// en.i18n.json (after --after, or at the end) and recorded in
// pending-transifex.json. Locale files are NOT touched by default: another
// agent translates them, and writing them here would race its edits. The
// interface falls back to the English text for a key a locale lacks.
// --all-locales also writes the English text into every locale file. The completeness gate counts those keys separately
// instead of as missing (fill-translations.mjs --missing), and the pull merge
// takes a real Transifex translation over the English text as it does for any
// other key. This is the maintainer's 2026-09-29 decision for features that
// need new text while translation work goes through Transifex.
//
// An existing key is refused rather than overwritten.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const dataDir = path.join(root, 'imports/i18n/data');
const pendingFile = path.join(root, 'releases/translations/pending-transifex.json');

export function insertKeys(object, additions, after) {
  const out = {};
  let inserted = false;
  const addAll = () => {
    for (const [k, v] of Object.entries(additions)) out[k] = v;
    inserted = true;
  };
  for (const [k, v] of Object.entries(object)) {
    out[k] = v;
    if (after && k === after) addAll();
  }
  if (!inserted) addAll();
  return out;
}

export function addPendingKeys(additions, { after, allLocales = false, today = new Date().toISOString().slice(0, 10), dir = dataDir, pending = pendingFile } = {}) {
  const enPath = path.join(dir, 'en.i18n.json');
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  for (const [key, value] of Object.entries(additions)) {
    if (key in en) throw new Error(`${key} already exists in en.i18n.json`);
    if (typeof value !== 'string' || !value.trim()) throw new Error(`${key} needs English text`);
  }
  if (after && !(after in en)) throw new Error(`--after ${after} is not an existing key`);
  // Symlinked locales (km-KH -> km_KH) share their target's file: write each
  // real file once. Check every file before writing any, so a refusal leaves
  // the tree untouched.
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.i18n.json') && !fs.lstatSync(path.join(dir, f)).isSymbolicLink())
    .filter(f => allLocales || f === 'en.i18n.json');
  const updated = files.map(file => {
    const locale = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    for (const key of Object.keys(additions)) {
      if (key in locale) throw new Error(`${file} already has ${key}`);
    }
    return [file, insertKeys(locale, additions, after)];
  });
  for (const [file, locale] of updated) {
    fs.writeFileSync(path.join(dir, file), JSON.stringify(locale, null, 2) + '\n');
  }
  const list = fs.existsSync(pending) ? JSON.parse(fs.readFileSync(pending, 'utf8')) : { keys: [] };
  for (const key of Object.keys(additions)) list.keys.push({ key, since: today });
  fs.writeFileSync(pending, JSON.stringify(list, null, 2) + '\n');
  return files.length;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const args = process.argv.slice(2);
  const file = args[0];
  const afterAt = args.indexOf('--after');
  const after = afterAt > -1 ? args[afterAt + 1] : undefined;
  if (!file || (afterAt > -1 && !after)) {
    console.error('Usage: add-pending-keys.mjs <new-keys.json> [--after <existing-key>] [--all-locales]');
    process.exit(1);
  }
  const count = addPendingKeys(JSON.parse(fs.readFileSync(file, 'utf8')), { after, allLocales: args.includes('--all-locales') });
  console.error(`[pending] added to ${count} locale files and pending-transifex.json`);
}
