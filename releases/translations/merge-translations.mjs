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
 *       -> keep it when its code tokens are intact and it is not a known
 *          wrong-language seed. Newest valid target-language human translation wins.
 *   - Transifex left it untranslated (pull filled it with English) but the pre-pull
 *     local file had a translation
 *       -> restore the local translation. It may be human or a direct machine/LLM fill.
 *   - No translation anywhere (untranslated on Transifex AND none committed)
 *       -> leave the English source as the placeholder. This is the ONLY case where a
 *          non-human value is used; a separate fill step (fill-translations.mjs — an
 *          LLM/human translating directly, no external service) may fill these, and
 *          because they are the only English-placeholder strings left, that fill can
 *          never overwrite a human translation.
 *
 * Writes each merged file in place (2-space indent, key order preserved, trailing
 * newline — matching the repo's i18n files). Nothing is pushed to Transifex: restored
 * local values have no machine-readable provenance and must stay local.
 *
 * Run from the repo root. Needs git.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = 'imports/i18n/data';
const EN_FILE = path.join(DATA_DIR, 'en.i18n.json');
const beforeArg = process.argv.indexOf('--before-dir');
const beforeDir = beforeArg >= 0 ? process.argv[beforeArg + 1] : null;

const parse = t => { try { return JSON.parse(t); } catch { return null; } };
const readFile = p => { try { return parse(fs.readFileSync(p, 'utf8')); } catch { return null; } };
const gitShow = (ref, p) => {
  try { return execSync(`git show ${ref}:${p}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); }
  catch { return null; } // file did not exist at that ref (new language) → treat as empty
};

const en = readFile(EN_FILE) || {};
const tokenPattern = /__[A-Za-z0-9_-]+__|%(?:\d+\$)?[A-Za-z]/g;
const tokens = value => (typeof value === 'string' ? (value.match(tokenPattern) || []) : []).sort();
const hasSourceTokens = (value, source) =>
  JSON.stringify(tokens(value)) === JSON.stringify(tokens(source));

// Script checks cannot distinguish Russian from Mongolian Cyrillic. Transifex's
// Mongolian resource is historically seeded from Russian, so an exact Russian
// value is wrong-language data, not a human Mongolian translation.
const WRONG_LANGUAGE_REFERENCES = {
  mn: ['ru.i18n.json'],
  br: ['fr.i18n.json'], oc: ['fr.i18n.json'], vo: ['fr.i18n.json'],
  wa: ['fr.i18n.json'], wo: ['fr.i18n.json'], zgh: ['fr.i18n.json'],
};
const KNOWN_WRONG_VALUES = {
  'cy-GB': {
    'board-public-info': 'Y bwrdd hwn fydd <strong>public</strong>.',
    'page-maybe-private': "Gall y dudalen hon fod yn breifat. Mae’n bosibl y gallwch ei weld gan <a href='%s'>logio i mewn</a>.",
  },
  cy: {
    'board-public-info': 'Y bwrdd hwn fydd <strong>public</strong>.',
    'page-maybe-private': "Gall y dudalen hon fod yn breifat. Mae’n bosibl y gallwch ei weld gan <a href='%s'>logio i mewn</a>.",
  },
  xh: {
    'globalSearch-instructions-operator-assignee': '`__operator_assignee__:<username>` - ​​amakhadi apho *<username>* ngumsebenzi *',
  },
};

// Language data files the pull changed (working tree vs HEAD), excluding English.
let changed = [];
if (beforeDir) {
  changed = fs.readdirSync(DATA_DIR)
    .filter(name => name.endsWith('.i18n.json') && name !== 'en.i18n.json')
    .map(name => path.join(DATA_DIR, name));
} else {
  try {
    changed = execSync(`git diff --name-only -- ${DATA_DIR}`, { encoding: 'utf8' })
      .split('\n').map(s => s.trim()).filter(Boolean)
      .filter(f => f.endsWith('.i18n.json') && path.basename(f) !== 'en.i18n.json');
  } catch { /* not a git repo / no git → nothing to merge */ }
}

if (!changed.length) {
  process.stderr.write('[i18n] merge: no changed language files.\n');
  process.exit(0);
}

let restoredTotal = 0;
let filesTouched = 0;

for (const f of changed) {
  const lang = path.basename(f, '.i18n.json');
  const beforePath = beforeDir ? path.join(beforeDir, path.basename(f)) : null;
  const committed = beforePath ? null : gitShow('HEAD', f);
  const oldJson = beforePath ? (readFile(beforePath) || {})
    : (committed != null ? (parse(committed) || {}) : {});
  const newJson = readFile(f);
  if (!newJson) continue;
  const wrongLanguageDocs = (WRONG_LANGUAGE_REFERENCES[lang] || [])
    .map(name => readFile(path.join(DATA_DIR, name)) || {});

  let restored = 0;
  for (const key of Object.keys(newJson)) {
    const enV = en[key];
    const oldV = oldJson[key];
    const newV = newJson[key];

    if (typeof newV !== 'string') continue;
    // Transifex gave a real translation with intact code tokens → keep the newest one.
    // If its placeholders are malformed, prefer the valid pre-pull local translation.
    if (typeof enV === 'string' && newV !== enV) {
      const knownWrongLanguage = wrongLanguageDocs.some(doc => doc[key] === newV)
        || KNOWN_WRONG_VALUES[lang]?.[key] === newV;
      if (knownWrongLanguage && typeof oldV === 'string') {
        newJson[key] = oldV;
        if (oldV !== newV) restored += 1;
        continue;
      }
      if (hasSourceTokens(newV, enV)) continue;
      if (typeof oldV === 'string' && oldV !== enV && hasSourceTokens(oldV, enV)) {
        newJson[key] = oldV;
        if (oldV !== newV) restored += 1;
      }
      continue;
    }
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
    process.stderr.write(`[i18n] merge: ${f} — restored ${restored} local fallback translation(s) where Transifex returned English\n`);
  }
}

process.stderr.write(
  `[i18n] merge: restored ${restoredTotal} string(s) across ${filesTouched} file(s); ` +
  `Transifex translations preferred and local fallback values kept. Nothing was pushed.\n`,
);
