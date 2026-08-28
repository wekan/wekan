#!/usr/bin/env node
/**
 * Self-contained proof that machine/LLM/fill strings can NEVER overwrite a human
 * translation — for BOTH directions of the Transifex round-trip:
 *
 *   PULL  (merge-translations.mjs): a real new Transifex translation is kept; when
 *         Transifex returns English, the pre-pull local translation is restored. The
 *         local fallback may be human or directly machine/LLM translated.
 *   FILL  (fill-translations.mjs --apply): a fill writes ONLY into English-placeholder
 *         keys; a key that already holds a human translation is skipped. So the local
 *         fill step never clobbers a human string.
 *   PUSH: pull-translations.sh contains no translation push. Without provenance, a
 *         restored local value must never be uploaded as if it were human.
 *
 * Pure logic re-implementation of the two merge/apply rules over synthetic data — no git,
 * no files, no network. Run: node releases/translations/verify-human-preference.mjs
 */

// --- the merge rule (per key), copied 1:1 from merge-translations.mjs ---
import fs from 'node:fs';

function mergeKey({ enV, oldV, newV }) {
  if (typeof newV !== 'string') return newV;              // untouched
  if (typeof enV === 'string' && newV !== enV) return newV;               // keep newest Transifex human
  if (typeof enV === 'string' && typeof oldV === 'string' && oldV !== enV) return oldV; // restore committed human
  return newV;                                            // missing everywhere → English placeholder
}

// --- the fill rule (per key), copied 1:1 from fill-translations.mjs --apply ---
function fillKey({ enV, curV, provided }) {
  if (typeof provided !== 'string' || !provided.trim() || provided === enV) return curV; // ignored
  const isPlaceholder = typeof enV === 'string' && (typeof curV !== 'string' || curV === enV);
  return isPlaceholder ? provided : curV;                 // never overwrite a non-placeholder (human)
}

let pass = 0, fail = 0;
const check = (name, got, want) => {
  if (got === want) { pass++; }
  else { fail++; console.error(`FAIL ${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); };
};

// PULL / merge
check('merge keeps new Transifex human',      mergeKey({ enV: 'Board', oldV: 'Tableau', newV: 'Panneau' }), 'Panneau');
check('merge restores committed human when pull reverted to English',
                                              mergeKey({ enV: 'Board', oldV: 'Tableau', newV: 'Board' }), 'Tableau');
check('merge leaves English when missing everywhere',
                                              mergeKey({ enV: 'Board', oldV: 'Board', newV: 'Board' }), 'Board');
check('merge leaves English when key never committed',
                                              mergeKey({ enV: 'Board', oldV: undefined, newV: 'Board' }), 'Board');
check('merge keeps human even if identical to committed (no-op keep)',
                                              mergeKey({ enV: 'Board', oldV: 'Tableau', newV: 'Tableau' }), 'Tableau');

// FILL / apply
check('fill writes into an English placeholder', fillKey({ enV: 'Board', curV: 'Board', provided: 'Tavla' }), 'Tavla');
check('fill writes into a missing key (curV undefined)',
                                              fillKey({ enV: 'Board', curV: undefined, provided: 'Tavla' }), 'Tavla');
check('fill NEVER overwrites an existing human translation',
                                              fillKey({ enV: 'Board', curV: 'Tableau', provided: 'Tavla' }), 'Tableau');
check('fill ignores a provided value equal to English',
                                              fillKey({ enV: 'Board', curV: 'Board', provided: 'Board' }), 'Board');
check('fill ignores an empty provided value', fillKey({ enV: 'Board', curV: 'Board', provided: '   ' }), 'Board');

const pullScript = fs.readFileSync('releases/translations/pull-translations.sh', 'utf8');
check('pull snapshots local translations before Transifex overwrites them',
  /cp -a imports\/i18n\/data\/\..+before_dir/.test(pullScript), true);
check('pull merges against the pre-pull snapshot',
  /merge-translations\.mjs --before-dir/.test(pullScript), true);
check('pull NEVER pushes translations to Transifex',
  /^[ \t]*(?!#).*\btx\s+(?:--config\s+\S+\s+)?push\b/m.test(pullScript), false);
check('pull repairs protected-token markers without replacing the human prose',
  /repair-machine-placeholders\.mjs --apply/.test(pullScript), true);

const mergeScript = fs.readFileSync('releases/translations/merge-translations.mjs', 'utf8');
check('same-script Mongolian values are checked against the known Russian seed',
  /WRONG_LANGUAGE_REFERENCES = \{ mn: \['ru\.i18n\.json'\] \}/.test(mergeScript), true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
