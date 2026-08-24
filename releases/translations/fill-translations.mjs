#!/usr/bin/env node
/**
 * Fill the UNTRANSLATED strings (English placeholders) of a language file — WITHOUT any
 * external translation service, API or password. The translations are written by a human
 * or by the assistant (an LLM) using the language's existing translations and general
 * kanban terminology as the reference; this script only lists what is missing and safely
 * applies the provided translations. It can NEVER overwrite a human translation.
 *
 * Runs conceptually AFTER `merge-translations.mjs`, so by that point every language file
 * holds real human translations (value differs from the English source) plus English
 * placeholders for strings untranslated everywhere (value === the English source, or the
 * key is missing). A string "counts" as translatable here ONLY when it is such a
 * placeholder, so a human translation (value !== English) is never selected and never
 * overwritten. Filled strings stay LOCAL — they are NOT pushed to Transifex as human
 * translations (only merge-translations.mjs pushes the restored human languages back).
 *
 * Usage (run from the repo root):
 *   node releases/translations/fill-translations.mjs --list <lang> [--limit N]
 *       Print, as JSON { key: englishSource, … }, the placeholder strings of <lang> that
 *       still need a translation. Feed this to the translator (LLM/human), then apply the
 *       result with --apply. --limit caps the count for a resumable, chunked workflow.
 *
 *   node releases/translations/fill-translations.mjs --apply <lang> <translations.json>
 *       Read { key: translation, … } from the file and write each into <lang> ONLY where
 *       the key is still a placeholder (value === English source, or missing). A key whose
 *       current value already differs from English (a human translation) is SKIPPED and
 *       reported, so a fill can never clobber a human translation. A translation equal to
 *       the English source, empty, or not a non-empty string is ignored. Preserves the
 *       en.i18n.json key ORDER and the repo's 2-space indent + trailing newline.
 *
 *   node releases/translations/fill-translations.mjs --missing
 *       Print a per-language count of placeholder strings still needing translation
 *       (English + en-* variants are skipped — they are English by design). No writes.
 *
 *   node releases/translations/fill-translations.mjs --status
 *       Where the backlog actually is. Splits the count two ways — strings that HAVE a
 *       translation to give against product names, numbers, symbols and bare
 *       `__placeholders__` that never will, and languages written in a non-Latin script
 *       (where an English string is a foreign alphabet mid-sentence) against Latin-script
 *       ones — then ranks the remaining keys by how many files share each. That ranking
 *       is the work order: one key missing in fifty files is one table, not fifty visits.
 */
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = 'imports/i18n/data';
const EN_FILE = path.join(DATA_DIR, 'en.i18n.json');
const readJson = p => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } };

const en = readJson(EN_FILE);
if (!en) { console.error(`[fill] cannot read ${EN_FILE}`); process.exit(1); }
const enKeys = Object.keys(en);

// A placeholder = key missing, or value equal to the English source.
const isPlaceholder = (j, k) =>
  typeof en[k] === 'string' && (typeof j[k] !== 'string' || j[k] === en[k]);

// English and its regional variants are English by design — never "missing".
const isEnglishVariant = code => /^en([_-].*)?$/.test(code) || code === 'en';

// Values that intentionally stay identical in every language are complete, not
// placeholders that a translator can or should change. Keep this exact: a
// sentence containing an application placeholder is still translatable.
const isInvariantSource = value => {
  if (!/\p{Letter}/u.test(value)) return true;
  if (value.replace(/[^\p{Letter}]/gu, '').length < 3) return true;
  const withoutPlaceholders = value.replace(/__[a-zA-Z0-9_-]+__/g, '');
  if (!/\p{Letter}/u.test(withoutPlaceholders)) return true;
  if (/^(?:YYYY-MM-DD|DD-MM-YYYY|MM-DD-YYYY)$/.test(value)) return true;
  return /^(Meteor|Node|MongoDB.*|OAuth2|LDAP|CAS|GridFS|Arial|Gantt|S3.*|CollectionFS|Google Cloud Storage\.?|Azure Blob.*|Meteor-Files|Microsoft Azure Blob Storage\.?|MongoDB Compact|Bytes|URL|Logo|Cron|OS|Platform|USA|Asia|OK|Planning Poker|API)$/.test(value);
};

function langFile(code) { return path.join(DATA_DIR, `${code}.i18n.json`); }

function writeOrdered(p, j) {
  const ordered = {};
  for (const k of enKeys) if (typeof j[k] === 'string') ordered[k] = j[k];
  for (const k of Object.keys(j)) if (!(k in ordered)) ordered[k] = j[k]; // keep any extras
  fs.writeFileSync(p, JSON.stringify(ordered, null, 2) + '\n');
}

const args = process.argv.slice(2);
const mode = args[0];

if (mode === '--missing') {
  const files = fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.i18n.json') && f !== 'en.i18n.json');
  const rows = [];
  for (const f of files) {
    const code = path.basename(f, '.i18n.json');
    if (isEnglishVariant(code)) continue;
    const j = readJson(path.join(DATA_DIR, f)) || {};
    const miss = enKeys.filter(k => isPlaceholder(j, k) && !isInvariantSource(en[k])).length;
    if (miss) rows.push([code, miss]);
  }
  rows.sort((a, b) => a[1] - b[1]);
  for (const [code, miss] of rows) console.log(`${miss}\t${code}`);
  console.error(`[fill] ${rows.length} language(s) still have untranslated strings.`);
  process.exit(0);
}

if (mode === '--list') {
  const code = args[1];
  if (!code) { console.error('[fill] --list needs a <lang>'); process.exit(1); }
  const limIdx = args.indexOf('--limit');
  const limit = limIdx !== -1 ? parseInt(args[limIdx + 1], 10) || 0 : 0;
  const j = readJson(langFile(code)) || {};
  let keys = enKeys.filter(k => isPlaceholder(j, k) && !isInvariantSource(en[k]));
  if (limit > 0) keys = keys.slice(0, limit);
  const out = {};
  for (const k of keys) out[k] = en[k];
  console.log(JSON.stringify(out, null, 2));
  console.error(`[fill] ${code}: ${keys.length} placeholder(s) to translate.`);
  process.exit(0);
}

if (mode === '--apply') {
  const code = args[1];
  const file = args[2];
  if (!code || !file) { console.error('[fill] --apply needs <lang> <translations.json>'); process.exit(1); }
  const j = readJson(langFile(code));
  if (!j) { console.error(`[fill] cannot read ${langFile(code)}`); process.exit(1); }
  const t = readJson(file);
  if (!t) { console.error(`[fill] cannot read ${file}`); process.exit(1); }
  let filled = 0, skippedHuman = 0, ignored = 0;
  for (const [k, v] of Object.entries(t)) {
    if (!(k in en)) { ignored++; continue; }              // not a real key
    if (typeof v !== 'string' || !v.trim() || v === en[k]) { ignored++; continue; }
    if (!isPlaceholder(j, k)) { skippedHuman++; continue; } // never overwrite a human translation
    j[k] = v; filled++;
  }
  writeOrdered(langFile(code), j);
  console.error(`[fill] ${code}: filled ${filled}, skipped ${skippedHuman} existing human translation(s), ignored ${ignored}.`);
  process.exit(0);
}

if (mode === '--status') {
  // A flat count of "strings still equal to the English source" is several times
  // the size of the actual backlog, and it says nothing about where the work is.
  // Two distinctions make it useful, and both are cheap to compute:
  //
  //   1. WHAT the string is. A product name, a bare number, a symbol or a bare
  //      `__placeholder__` has no translation to give; it equals the English
  //      source because that IS the translation, and it will never stop
  //      counting.
  //   2. WHICH SCRIPT the language is written in. In a Latin-script language an
  //      untranslated "Status" reads as a word; in a Greek, Arabic, Thai or
  //      Devanagari interface it is a different alphabet mid-sentence.
  const NONLATIN = /[Ͱ-᳿Ⲁ-퟿]/;
  const bucket = {
    'non-Latin, near-complete': [0, 0, 0],
    'Latin, near-complete': [0, 0, 0],
    'second tier (over 400 missing)': [0, 0, 0],
  };
  const perKey = {};
  for (const f of fs.readdirSync(DATA_DIR)) {
    if (!f.endsWith('.i18n.json')) continue;
    const code = path.basename(f, '.i18n.json');
    if (isEnglishVariant(code)) continue;
    const j = readJson(path.join(DATA_DIR, f)) || {};
    const miss = enKeys.filter(k => isPlaceholder(j, k));
    const sample = [j.board, j.card, j.list, j.save, j.settings].filter(Boolean).join('');
    const name = miss.length >= 400 ? 'second tier (over 400 missing)'
      : NONLATIN.test(sample) ? 'non-Latin, near-complete' : 'Latin, near-complete';
    const b = bucket[name];
    b[0]++;
    for (const k of miss) {
      if (isInvariantSource(en[k])) { b[2]++; continue; }
      b[1]++;
      if (name !== 'second tier (over 400 missing)') perKey[k] = (perKey[k] || 0) + 1;
    }
  }
  for (const [name, [files, real, junk]] of Object.entries(bucket)) {
    console.log(`${String(files).padStart(4)} files  ${String(real).padStart(7)} to translate  ` +
      `${String(junk).padStart(7)} nothing to translate  ${name}`);
  }
  const rows = Object.entries(perKey).sort((a, b) => b[1] - a[1]).slice(0, 20);
  if (rows.length) {
    console.log('\nnear-complete files, by key — one key is one table, not one visit per file:');
    for (const [k, n] of rows) {
      console.log(`${String(n).padStart(4)}  ${k}  ${JSON.stringify(en[k]).slice(0, 56)}`);
    }
  }
  process.exit(0);
}

console.error('Usage: fill-translations.mjs --status | --missing | --list <lang> [--limit N] | --apply <lang> <file.json>');
process.exit(1);
