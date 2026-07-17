#!/usr/bin/env node
/**
 * After `tx pull`, list the language files where a previously-translated string reverted
 * to the English source. `tx pull` fills any string that is UNtranslated on Transifex with
 * the English source, so a language that is only partially translated (or whose strings
 * were only ever edited directly in git, never on Transifex) silently loses translations
 * back to English on every pull. This flags exactly those cases so a human can decide
 * whether to (re)translate on Transifex or revert the file.
 *
 * For every changed imports/i18n/data/<lang>.i18n.json (working tree vs the committed,
 * pre-pull version) it reports each key that:
 *   - was a real translation before the pull (value differed from the English source), and
 *   - is now exactly the English source.
 *
 * Run from the repo root. Read-only: it only prints a report, never edits files.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = 'imports/i18n/data';
const EN_FILE = path.join(DATA_DIR, 'en.i18n.json');

// --files: machine-readable mode for the pull script's auto-heal loop. Print
// ONLY the reverted language-file paths (one per line) to stdout, nothing else,
// so the shell can `git checkout --` and re-push each. Exit 2 when there are
// reverts (0 otherwise), like the human report.
const filesMode = process.argv.slice(2).includes('--files');

function parse(text) { try { return JSON.parse(text); } catch { return null; } }
function readFile(p) { try { return parse(fs.readFileSync(p, 'utf8')); } catch { return null; } }
function gitShow(ref, p) {
  try { return execSync(`git show ${ref}:${p}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); }
  catch { return null; } // file did not exist at that ref (new language) → treat as empty
}

const en = readFile(EN_FILE) || {};

// Language data files changed by the pull (modified in the working tree vs HEAD).
let changed = [];
try {
  changed = execSync(`git diff --name-only -- ${DATA_DIR}`, { encoding: 'utf8' })
    .split('\n').map(s => s.trim()).filter(Boolean)
    .filter(f => f.endsWith('.i18n.json') && path.basename(f) !== 'en.i18n.json');
} catch { /* not a git repo / no git → nothing to compare */ }

if (!changed.length) {
  if (!filesMode) console.log('[i18n] No changed language files to check.');
  process.exit(0);
}

const report = [];
for (const f of changed) {
  const before = gitShow('HEAD', f);
  const oldJson = before != null ? (parse(before) || {}) : {};
  const newJson = readFile(f);
  if (!newJson) continue;

  const regressed = [];
  let otherChanges = 0;

  // Walk every key touched by the pull (union of old and new).
  for (const key of new Set([...Object.keys(oldJson), ...Object.keys(newJson)])) {
    const enV = en[key];
    const oldV = oldJson[key];
    const newV = newJson[key];
    if (oldV === newV) continue; // unchanged by the pull

    // Revert-to-English: previously a real translation (differed from English),
    // now exactly the English source.
    if (
      typeof enV === 'string' && typeof oldV === 'string' && typeof newV === 'string' &&
      oldV !== enV && newV === enV
    ) {
      regressed.push(key);
      continue;
    }

    // Any OTHER change where the pull brought a real (non-English) value: a new
    // or improved translation from Transifex that a whole-file `git checkout`
    // would throw away. Its presence means this file is NOT purely a revert.
    if (typeof newV === 'string' && newV !== enV) {
      otherChanges += 1;
    }
  }

  if (regressed.length) report.push({ file: f, keys: regressed, otherChanges });
}

if (!report.length) {
  if (!filesMode) console.log('[i18n] OK: no translations reverted to English after the pull.');
  process.exit(0);
}

report.sort((a, b) => b.keys.length - a.keys.length);

// A file is safe to auto-heal (whole-file `git checkout --` + force re-push) ONLY
// when ALL of the pull's changes to it are reverts — i.e. it carries no other
// real translation from Transifex that the checkout would discard.
const healable = report.filter((r) => r.otherChanges === 0);

if (filesMode) {
  // Machine-readable: only the safe-to-auto-heal files, one path per line.
  for (const r of healable) console.log(r.file);
  process.exit(report.length ? 2 : 0);
}

console.log('\n[i18n] WARNING — these language files had translations REVERT to English after the pull');
console.log('       (a previously-translated string is now exactly the English source, i.e. it is');
console.log('       untranslated on Transifex):\n');
let total = 0;
for (const r of report) {
  total += r.keys.length;
  const sample = r.keys.slice(0, 8).join(', ');
  const mixed = r.otherChanges > 0
    ? `  [NOT auto-healed: also has ${r.otherChanges} non-revert change(s) — handle manually]`
    : '';
  console.log(`  ${r.file}  —  ${r.keys.length} string(s): ${sample}${r.keys.length > 8 ? ', …' : ''}${mixed}`);
}
console.log(`\n[i18n] ${report.length} language file(s), ${total} string(s) reverted to English.`);
console.log(
  `[i18n] ${healable.length} file(s) are safe to auto-restore (all changes are reverts); ` +
  `${report.length - healable.length} also have other changes and are left for manual handling.`,
);
// Non-zero exit so the pull script / CI can notice, but do not treat it as a hard failure.
process.exit(2);
