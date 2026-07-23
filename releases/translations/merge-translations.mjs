#!/usr/bin/env node
/**
 * Per-key merge after `tx pull`, so a Transifex pull NEVER loses a human translation.
 *
 * `tx pull -f` overwrites each imports/i18n/data/<lang>.i18n.json with whatever
 * Transifex has, and fills every string that is UNtranslated on Transifex with the
 * ENGLISH source. So a partially-translated language (or one whose strings were only
 * ever edited in git, never entered on Transifex) silently loses translations back to
 * English on every pull. The old auto-heal restored only files whose changes were
 * ENTIRELY reverts; a file that also had a real new Transifex translation was skipped,
 * and its reverted strings were lost.
 *
 * This merges per KEY instead of per file, exactly matching the policy:
 *   - Transifex has a real translation (pulled value differs from the English source)
 *       -> keep it. Newest human translation from Transifex always wins.
 *   - Transifex left it untranslated (pull filled it with English) but the committed
 *     version (HEAD) had a real translation
 *       -> restore the committed translation. A pull never reverts a human translation.
 *   - No translation anywhere (untranslated on Transifex AND none committed)
 *       -> leave the English source as the placeholder. This is the ONLY case where a
 *          non-human value is used; a separate fill step (fill-translations.mjs — an
 *          LLM/human translating directly, no external service) may fill these, and
 *          because they are the only English-placeholder strings left, that fill can
 *          never overwrite a human translation.
 *
 * Writes each merged file in place (2-space indent, key order preserved, trailing
 * newline — matching the repo's i18n files) and prints each restored language code
 * (the <lang> of <lang>.i18n.json) on its own line to stdout, so the pull script can
 * push those languages back to Transifex. A per-file summary goes to stderr.
 *
 * Run from the repo root. Needs git.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = 'imports/i18n/data';
const EN_FILE = path.join(DATA_DIR, 'en.i18n.json');

const parse = t => { try { return JSON.parse(t); } catch { return null; } };
const readFile = p => { try { return parse(fs.readFileSync(p, 'utf8')); } catch { return null; } };
const gitShow = (ref, p) => {
  try { return execSync(`git show ${ref}:${p}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); }
  catch { return null; } // file did not exist at that ref (new language) → treat as empty
};

const en = readFile(EN_FILE) || {};

// Language data files the pull changed (working tree vs HEAD), excluding English.
let changed = [];
try {
  changed = execSync(`git diff --name-only -- ${DATA_DIR}`, { encoding: 'utf8' })
    .split('\n').map(s => s.trim()).filter(Boolean)
    .filter(f => f.endsWith('.i18n.json') && path.basename(f) !== 'en.i18n.json');
} catch { /* not a git repo / no git → nothing to merge */ }

if (!changed.length) {
  process.stderr.write('[i18n] merge: no changed language files.\n');
  process.exit(0);
}

let restoredTotal = 0;
let filesTouched = 0;

for (const f of changed) {
  const committed = gitShow('HEAD', f);
  const oldJson = committed != null ? (parse(committed) || {}) : {};
  const newJson = readFile(f);
  if (!newJson) continue;

  let restored = 0;
  for (const key of Object.keys(newJson)) {
    const enV = en[key];
    const oldV = oldJson[key];
    const newV = newJson[key];

    if (typeof newV !== 'string') continue;
    // Transifex gave a real translation → keep the newest one.
    if (typeof enV === 'string' && newV !== enV) continue;
    // Pull reverted this to English, but we had a real committed translation → restore.
    if (typeof enV === 'string' && typeof oldV === 'string' && oldV !== enV) {
      newJson[key] = oldV;
      restored += 1;
    }
    // else: missing everywhere → leave the English placeholder for the fill step.
  }

  if (restored) {
    fs.writeFileSync(f, JSON.stringify(newJson, null, 2) + '\n');
    restoredTotal += restored;
    filesTouched += 1;
    // stdout: the language code, for the pull script's push-back loop.
    process.stdout.write(path.basename(f, '.i18n.json') + '\n');
    process.stderr.write(`[i18n] merge: ${f} — restored ${restored} human translation(s) the pull had reverted to English\n`);
  }
}

process.stderr.write(
  `[i18n] merge: restored ${restoredTotal} string(s) across ${filesTouched} file(s); ` +
  `missing-everywhere keys left as English for machine translation.\n`,
);
