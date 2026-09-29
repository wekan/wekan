'use strict';

// New interface strings pending Transifex (releases/translations/add-pending-keys.mjs).
// Run: node tests/pendingTransifexKeys.test.cjs
//
// Maintainer decision 2026-09-29: a feature that needs new text adds it in
// English to every locale and lists the keys in pending-transifex.json; the
// completeness gate counts them separately, and a Transifex translation still
// replaces the English text through the ordinary pull merge.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const { addPendingKeys, insertKeys } = await import('../releases/translations/add-pending-keys.mjs');
  const root = path.join(__dirname, '..');
  const work = fs.mkdtempSync(path.join(process.env.TMPDIR || path.join(root, '.tools/tmp'), 'pending-'));
  try {
    const dir = path.join(work, 'data');
    fs.mkdirSync(dir);
    const write = (name, obj) => fs.writeFileSync(path.join(dir, name), JSON.stringify(obj, null, 2) + '\n');
    write('en.i18n.json', { a: 'A', b: 'B' });
    write('fi.i18n.json', { a: 'Aa', b: 'Bb' });
    const pending = path.join(work, 'pending.json');

    // Default: English only - locale files belong to the translating agent.
    assert.equal(addPendingKeys({ n0: 'English only' }, { dir, pending, today: '2026-09-29' }), 1);
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'fi.i18n.json'), 'utf8')).n0, undefined);
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'en.i18n.json'), 'utf8')).n0, 'English only');
    assert.equal(addPendingKeys({ n1: 'New one', n2: 'New two' }, { after: 'a', allLocales: true, dir, pending, today: '2026-09-29' }), 2);
    const read = name => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
    assert.deepEqual(Object.keys(read('en.i18n.json')), ['a', 'n1', 'n2', 'b', 'n0'], 'inserted after the anchor');
    assert.deepEqual(read('fi.i18n.json'), { a: 'Aa', n1: 'New one', n2: 'New two', b: 'Bb' }, 'English in every locale, translations kept');
    assert.deepEqual(JSON.parse(fs.readFileSync(pending, 'utf8')).keys.map(k => k.key), ['n0', 'n1', 'n2']);

    // Negative: never overwrite an existing key, never add empty text, never guess an anchor.
    assert.throws(() => addPendingKeys({ a: 'x' }, { dir, pending }), /already exists/);
    assert.throws(() => addPendingKeys({ z: '  ' }, { dir, pending }), /needs English text/);
    assert.throws(() => addPendingKeys({ z: 'Z' }, { after: 'nope', dir, pending }), /not an existing key/);
    assert.equal(read('en.i18n.json').z, undefined, 'a refused call writes nothing');
    // A symlinked locale shares its target and is written once, not refused.
    fs.symlinkSync('fi.i18n.json', path.join(dir, 'fi-FI.i18n.json'));
    assert.equal(addPendingKeys({ n3: 'Three' }, { dir, pending, allLocales: true }), 2);
    assert.equal(read('fi-FI.i18n.json').n3, 'Three');
    // A clash in one locale leaves every file untouched.
    write('sv.i18n.json', { a: 'A', n1: 'x', n2: 'y', b: 'B', n3: 'z', clash: 'already' });
    const before = read('en.i18n.json');
    assert.throws(() => addPendingKeys({ clash: 'C' }, { dir, pending, allLocales: true }), /sv\.i18n\.json already has clash/);
    assert.deepEqual(read('en.i18n.json'), before);
    assert.deepEqual(Object.keys(insertKeys({ a: 1 }, { x: 2 })), ['a', 'x'], 'no anchor appends');
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }

  // The gate skips pending keys only while they are still the English source.
  const fill = fs.readFileSync(path.join(root, 'releases/translations/fill-translations.mjs'), 'utf8');
  assert.match(fill, /pending-transifex\.json/);
  assert.match(fill, /&& !pendingTransifex\.has\(k\)\)\.length/);
  assert.match(fill, /English on purpose, pending Transifex/);
  const list = JSON.parse(fs.readFileSync(path.join(root, 'releases/translations/pending-transifex.json'), 'utf8'));
  const en = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
  for (const row of list.keys) assert.ok(row.key in en, `${row.key} is listed but not an English key`);

  console.log('  ok - new strings are added in English everywhere and tracked as pending Transifex');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
