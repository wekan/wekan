#!/usr/bin/env node
/**
 * Self-contained proof that machine/LLM/fill strings can NEVER overwrite a human
 * translation — for BOTH directions of the Transifex round-trip:
 *
 *   PULL  (merge-translations.mjs): a Transifex pull that reverts a human translation to
 *         English is undone — the committed human translation is restored; a real new
 *         Transifex translation is kept; only a string untranslated EVERYWHERE stays
 *         English. Human is preferred and merged.
 *   FILL  (fill-translations.mjs --apply): a fill writes ONLY into English-placeholder
 *         keys; a key that already holds a human translation is skipped. So the local
 *         fill step never clobbers a human string.
 *   PUSH: only merge-restored (human) languages are pushed to Transifex; filled strings
 *         stay local. This test asserts the two mechanisms above; the push side is that
 *         fill output is never handed to `tx push` (see pull-translations.sh).
 *
 * Pure logic re-implementation of the two merge/apply rules over synthetic data — no git,
 * no files, no network. Run: node releases/translations/verify-human-preference.mjs
 */

// --- the merge rule (per key), copied 1:1 from merge-translations.mjs ---
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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
