'use strict';

// #5681: linked custom fields - a card's custom fields linked, by name, to
// another card's, so a change on one card is copied to the other.
// models/lib/customFieldLinks.js (the planning), server/models/customFieldLinks.js
// (methods, hook, permissions). Server test:
// server/lib/tests/customFieldLinks.tests.js; browser test:
// tests/playwright/specs/custom-field-links.e2e.js.
// Run: node tests/customFieldLinks.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const lib = require('../models/lib/customFieldLinks');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

console.log('customFieldLinks:');

// The issue's two boards: test1 has Operation and Status, test2 has
// Operation, Status and Remarks.
const B1 = 'board1', B2 = 'board2';
const def = (_id, name, type, boardId, extra = {}) => ({ _id, name, type, boardIds: [boardId], settings: {}, ...extra });
const dropdown = (_id, name, boardId, items) => def(_id, name, 'dropdown', boardId,
  { settings: { dropdownItems: items.map(([id, label]) => ({ _id: id, name: label })) } });
const defs = [
  def('op1', 'Operation', 'text', B1),
  dropdown('st1', 'Status', B1, [['s1-open', 'Open'], ['s1-done', 'Done']]),
  def('op2', ' operation ', 'text', B2),
  dropdown('st2', 'STATUS', B2, [['s2-done', 'done'], ['s2-open', 'open'], ['s2-wait', 'Waiting']]),
  def('re2', 'Remarks', 'text', B2),
];
const definitions = new Map(defs.map(d => [d._id, d]));
const card1 = (values = {}) => ({ _id: 'card1', boardId: B1, customFields: [
  { _id: 'op1', value: values.op1 ?? null }, { _id: 'st1', value: values.st1 ?? null }] });
const card2 = (values = {}) => ({ _id: 'card2', boardId: B2, customFields: [
  { _id: 'op2', value: values.op2 ?? null }, { _id: 'st2', value: values.st2 ?? null },
  { _id: 're2', value: values.re2 ?? null }] });

test('fields match by trimmed, case-insensitive name and the same type', () => {
  const pairs = lib.matchLinkedFields(defs.slice(0, 2), defs.slice(2));
  assert.deepEqual(pairs.map(p => [p.source._id, p.target._id]), [['op1', 'op2'], ['st1', 'st2']]);
  // Negative: the same name with another type, or another currency, does not match.
  assert.deepEqual(lib.matchLinkedFields([def('a', 'Cost', 'number', B1)], [def('b', 'Cost', 'text', B2)]), []);
  assert.deepEqual(lib.matchLinkedFields(
    [def('a', 'Cost', 'currency', B1, { settings: { currencyCode: 'EUR' } })],
    [def('b', 'Cost', 'currency', B2, { settings: { currencyCode: 'USD' } })]), []);
  assert.equal(lib.matchLinkedFields(
    [def('a', 'Cost', 'currency', B1, { settings: { currencyCode: 'EUR' } })],
    [def('b', 'cost', 'currency', B2, { settings: { currencyCode: 'EUR' } })]).length, 1);
  // Negative: a name two fields share on one card is ambiguous and not guessed.
  assert.deepEqual(lib.matchLinkedFields([def('a', 'Note', 'text', B1)],
    [def('b', 'Note', 'text', B2), def('c', 'note', 'text', B2)]), []);
});

test('an admin-only field never takes part, on either side', () => {
  const secret = def('sec1', 'Salary', 'number', B1, { adminOnly: true });
  const open = def('sec2', 'Salary', 'number', B2);
  assert.deepEqual(lib.matchLinkedFields([secret], [open]), []);
  assert.deepEqual(lib.matchLinkedFields([open], [{ ...secret, boardIds: [B2] }]), []);
  const map = new Map([[secret._id, secret], [open._id, open]]);
  const writes = lib.planLinkedFieldWrites({
    sourceCard: { _id: 'a', boardId: B1, customFields: [{ _id: 'sec1', value: 5000 }] },
    targetCard: { _id: 'b', boardId: B2, customFields: [{ _id: 'sec2', value: null }] },
    definitions: map,
  });
  assert.deepEqual(writes, []);
});

test('a changed value goes to the field of the same name; Remarks stays the main card\'s own', () => {
  const writes = lib.planLinkedFieldWrites({
    sourceCard: card1({ op1: 'Weld', st1: 's1-done' }), targetCard: card2({ re2: 'checked by Ann' }),
    definitions, changedFieldIds: ['op1', 'st1'],
  });
  assert.deepEqual(writes.map(w => [w.index, w.fieldId, w.value]), [[0, 'op2', 'Weld'], [1, 'st2', 's2-done']]);
  assert.ok(!writes.some(w => w.fieldId === 're2'));
});

test('only the fields that changed are carried, and nothing when the value is already equal', () => {
  const only = lib.planLinkedFieldWrites({ sourceCard: card1({ op1: 'Weld', st1: 's1-open' }),
    targetCard: card2(), definitions, changedFieldIds: ['op1'] });
  assert.deepEqual(only.map(w => w.fieldId), ['op2']);
  // Negative: already equal - no write, which is also what ends a two-way echo.
  assert.deepEqual(lib.planLinkedFieldWrites({ sourceCard: card1({ op1: 'Weld', st1: 's1-open' }),
    targetCard: card2({ op2: 'Weld', st2: 's2-open' }), definitions }), []);
  // Empty on both sides is equal however it is spelled.
  assert.ok(lib.valuesEqual(null, ''));
  assert.ok(lib.valuesEqual(undefined, []));
  assert.ok(!lib.valuesEqual(0, null));
  assert.ok(lib.valuesEqual(new Date(5), new Date(5)));
  assert.ok(!lib.valuesEqual(new Date(5), new Date(6)));
});

test('a cleared value clears the linked field', () => {
  const writes = lib.planLinkedFieldWrites({ sourceCard: card1({ op1: '' }), targetCard: card2({ op2: 'Weld' }),
    definitions, changedFieldIds: ['op1'] });
  assert.deepEqual(writes.map(w => [w.fieldId, w.value]), [['op2', null]]);
});

test('a dropdown value goes over by its item name; an item the other field lacks is not carried', () => {
  const [, st1] = defs; const st2 = definitions.get('st2');
  assert.deepEqual(lib.mapLinkedValue('s1-open', st1, st2), { ok: true, value: 's2-open' });
  const extra = dropdown('st1', 'Status', B1, [['s1-x', 'Cancelled']]);
  assert.deepEqual(lib.mapLinkedValue('s1-x', extra, st2), { ok: false });
  assert.deepEqual(lib.mapLinkedValue('no-such-item', st1, st2), { ok: false });
  const m1 = dropdown('m1', 'Tags', B1, [['a', 'Red'], ['b', 'Blue']]);
  const m2 = dropdown('m2', 'tags', B2, [['x', 'blue'], ['y', 'red']]);
  m1.type = 'dropdownMultiSelect'; m2.type = 'dropdownMultiSelect';
  assert.deepEqual(lib.mapLinkedValue(['a', 'b'], m1, m2), { ok: true, value: ['y', 'x'] });
  // Negative: a partial multi-select would, on a two-way link, come back and
  // erase the item the other field lacks - so nothing is carried.
  m2.settings.dropdownItems.pop();
  assert.deepEqual(lib.mapLinkedValue(['a', 'b'], m1, m2), { ok: false });
  // Negative: an incompatible pair carries nothing.
  assert.deepEqual(lib.mapLinkedValue('x', def('a', 'A', 'text', B1), def('b', 'A', 'number', B2)), { ok: false });
});

test('a field on only one card, or on another board than the card, is left alone', () => {
  const writes = lib.planLinkedFieldWrites({
    sourceCard: card1({ op1: 'Weld' }),
    targetCard: { _id: 'card2', boardId: B2, customFields: [{ _id: 're2', value: null }] },
    definitions, changedFieldIds: ['op1'] });
  assert.deepEqual(writes, []);
  const stale = new Map(definitions);
  stale.set('op2', { ...definitions.get('op2'), boardIds: ['elsewhere'] });
  assert.deepEqual(lib.planLinkedFieldWrites({ sourceCard: card1({ op1: 'Weld' }), targetCard: card2(),
    definitions: stale, changedFieldIds: ['op1'] }), []);
});

test('a read-only target field is written only when the link may write it', () => {
  const ro = new Map(definitions);
  ro.set('op2', { ...definitions.get('op2'), readOnly: true });
  const args = { sourceCard: card1({ op1: 'Weld' }), targetCard: card2(), definitions: ro, changedFieldIds: ['op1'] };
  assert.deepEqual(lib.planLinkedFieldWrites({ ...args, mayWriteTarget: d => !d.readOnly }), []);
  assert.equal(lib.planLinkedFieldWrites({ ...args, mayWriteTarget: () => true }).length, 1);
});

test('linking fills only the fields the other card has no value in', () => {
  const writes = lib.planLinkedFieldWrites({ sourceCard: card1({ op1: 'Weld', st1: 's1-done' }),
    targetCard: card2({ op2: 'Grind' }), definitions, onlyIntoEmpty: true });
  assert.deepEqual(writes.map(w => w.fieldId), ['st2']);
});

test('changed fields are the ones whose value differs; a removed field is not a change', () => {
  assert.deepEqual(lib.changedCustomFieldIds(
    [{ _id: 'a', value: 1 }, { _id: 'b', value: 'x' }, { _id: 'gone', value: 'y' }],
    [{ _id: 'a', value: 1 }, { _id: 'b', value: 'z' }, { _id: 'new', value: null }, { _id: 'set', value: true }]),
  ['b', 'set']);
  assert.deepEqual(lib.changedCustomFieldIds(undefined, undefined), []);
});

test('the two sides of a link mirror each other, and the direction decides what flows', () => {
  assert.equal(lib.mirrorMode('both'), 'both');
  assert.equal(lib.mirrorMode('send'), 'receive');
  assert.equal(lib.mirrorMode('receive'), 'send');
  assert.ok(lib.sendsAlong({ mode: 'both' }) && lib.sendsAlong({ mode: 'send' }));
  assert.ok(!lib.sendsAlong({ mode: 'receive' }), 'the main card of a one-way link sends nothing back');
  assert.ok(lib.receivesAlong({ mode: 'receive' }) && !lib.receivesAlong({ mode: 'send' }));
  assert.deepEqual(lib.CHOOSABLE_MODES, ['both', 'send']);
});

test('a link is live only when the other card holds its mirror, by the same person', () => {
  const link = { cardId: 'b', mode: 'send', userId: 'u1' };
  assert.ok(lib.isMirrored(link, { _id: 'b', customFieldLinks: [{ cardId: 'a', mode: 'receive', userId: 'u1' }] }, 'a'));
  // Negative: one-sided (a forged or copied entry), wrong direction, another author.
  assert.ok(!lib.isMirrored(link, { _id: 'b', customFieldLinks: [] }, 'a'));
  assert.ok(!lib.isMirrored(link, { _id: 'b', customFieldLinks: [{ cardId: 'a', mode: 'send', userId: 'u1' }] }, 'a'));
  assert.ok(!lib.isMirrored(link, { _id: 'b', customFieldLinks: [{ cardId: 'a', mode: 'receive', userId: 'u2' }] }, 'a'));
  assert.ok(!lib.isMirrored(link, null, 'a'));
});

test('stored links are well-formed, one per card, never the card itself, and capped', () => {
  const links = lib.normalizeFieldLinks([
    { cardId: 'b', mode: 'both', userId: 'u' }, { cardId: 'b', mode: 'send', userId: 'u' },
    { cardId: 'self', mode: 'both', userId: 'u' }, { cardId: 'c', mode: 'sideways', userId: 'u' },
    { cardId: '$where', mode: 'both', userId: 'u' }, { cardId: 'd', mode: 'both' }, null, 'x',
  ], 'self');
  assert.deepEqual(links.map(l => l.cardId), ['b']);
  const many = Array.from({ length: lib.MAX_FIELD_LINKS + 5 }, (_, i) => ({ cardId: `c${i}`, mode: 'both', userId: 'u' }));
  assert.equal(lib.normalizeFieldLinks(many, 'x').length, lib.MAX_FIELD_LINKS);
});

test('a pasted card link or a card id names the other card; anything else does not', () => {
  assert.equal(lib.fieldLinkTargetId('https://wekan.example/b/BOARD1/test2/CARD123'), 'CARD123');
  assert.equal(lib.fieldLinkTargetId('  CARD123 '), 'CARD123');
  assert.equal(lib.fieldLinkTargetId('not a card'), null);
  assert.equal(lib.fieldLinkTargetId(''), null);
  assert.equal(lib.fieldLinkTargetId({ $ne: 1 }), null);
});

test('the chain stops a two-way echo, a ring of links, a too-long chain and a runaway fan-out', () => {
  const first = lib.chainStep(null, 'A', 'B');
  assert.ok(first.ok);
  assert.deepEqual(first.chain.visited, ['A', 'B']);
  // A -> B, then B's own two-way link back to A: A is on the chain.
  assert.deepEqual(lib.chainStep(first.chain, 'B', 'A'), { ok: false, reason: 'loop' });
  // A -> B -> C, then C -> A closes a ring.
  const second = lib.chainStep(first.chain, 'B', 'C');
  assert.ok(second.ok);
  assert.deepEqual(lib.chainStep(second.chain, 'C', 'A'), { ok: false, reason: 'loop' });
  // A straight chain stops at MAX_CHAIN_DEPTH.
  let chain = null, from = 'n0', stopped = null;
  for (let i = 1; i < 50 && !stopped; i += 1) {
    const step = lib.chainStep(chain, from, `n${i}`);
    if (!step.ok) stopped = { at: i, reason: step.reason };
    else { chain = step.chain; from = `n${i}`; }
  }
  assert.deepEqual(stopped, { at: lib.MAX_CHAIN_DEPTH + 1, reason: 'depth' });
  // The whole change shares one write budget.
  const wide = lib.chainStep(null, 'hub', 'x');
  wide.chain.budget.writes = lib.MAX_PROPAGATION_WRITES;
  assert.deepEqual(lib.chainStep(wide.chain, 'x', 'y'), { ok: false, reason: 'budget' });
});

// The server half, read from its source: the rules that make the planning safe.
const server = read('server/models/customFieldLinks.js');

test('linking needs edit and read rights on BOTH cards, and an unreadable card is "not found"', () => {
  const method = server.slice(server.indexOf('async linkCardCustomFields'), server.indexOf('async unlinkCardCustomFields'));
  assert.match(method, /editableCard\(this\.userId, cardId\)/);
  assert.match(method, /canReadCard\(this\.userId, other, otherBoard\)\)\) throw notFound\(\)/);
  assert.match(method, /canEditCardOrLinkedCard\(this\.userId, other, otherBoard\)\)\) throw notAuthorized\(\)/);
  assert.match(method, /MAX_FIELD_LINKS/);
  const unlink = server.slice(server.indexOf('async unlinkCardCustomFields'), server.indexOf('async cardCustomFieldLinksInfo'));
  assert.match(unlink, /editableCard\(this\.userId, cardId\)/);
  assert.match(unlink, /isMirrored\(link, other, card\._id\) && !otherEditable\) throw notAuthorized\(\)/);
});

test('a propagation writes only while its creator can edit both cards, as that creator', () => {
  const fn = server.slice(server.indexOf('export async function propagateLinkedCustomFields'), server.indexOf('Cards.after.update(async'));
  assert.match(fn, /card\.archived/);
  assert.match(fn, /target\.archived/);
  assert.match(fn, /isMirrored\(link, target, card\._id\)/);
  assert.match(fn, /canReadAndEdit\(link\.userId, card\)\)\s*\|\|\s*!\(await canReadAndEdit\(link\.userId, target\)\)/);
  assert.match(fn, /mayWriteField\(def, target\.boardId, adminBoards\)/);
  assert.match(fn, /chainStore\.getStore\(\) \|\| newPropagationChain\(card\._id\)/);
  assert.match(fn, /chainStep\(chain, card\._id, link\.cardId\)/);
  assert.match(fn, /writePlanned\(target, writes, link\.userId, step\.chain\)/);
  // A failing link must never fail the edit that caused it.
  assert.match(fn, /catch \(error\)/);
});

test('the link field is the server\'s: client writes are refused and watched, copies start unlinked, deletes clean up', () => {
  assert.match(server, /fieldNames\.includes\('customFieldLinks'\)\) return tripCanaryDeny\('card\.field-link-direct'/);
  assert.match(server, /Cards\.before\.insert\([^)]*\) => \{\s*if \(doc && Object\.hasOwn\(doc, 'customFieldLinks'\)\) delete doc\.customFieldLinks;/);
  assert.match(server, /Cards\.before\.remove[\s\S]*\$pull: \{ customFieldLinks: \{ cardId: doc\._id \} \}/);
  assert.match(read('server/imports.js'), /import '\/server\/models\/customFieldLinks';/);
});

test('every hook-skipping REST write of custom fields carries the change itself', () => {
  const cards = read('server/models/cards.js');
  const directWrites = cards.match(/Cards\.direct\.updateAsync\([^;]*?\$set: \{ customFields: [^;]*?\);/g) || [];
  assert.ok(directWrites.length >= 2, 'the REST custom-field writes were found');
  for (const write of directWrites) {
    const after = cards.slice(cards.indexOf(write) + write.length, cards.indexOf(write) + write.length + 400);
    assert.match(after, /propagateLinkedCustomFields\(/, `no propagation after: ${write.slice(0, 80)}`);
  }
});

test('the card schema keeps the links, and only the methods write them', () => {
  const schema = read('models/cards.js');
  assert.match(schema, /customFieldLinks: \{[\s\S]*?type: Array,[\s\S]*?'customFieldLinks\.\$'/);
  assert.match(schema, /allowedValues: \['both', 'send', 'receive'\]/);
  const client = read('client/components/cards/cardCustomFields.js');
  assert.ok(!/['"]?customFieldLinks['"]?\s*:/.test(client),
    'the client never writes customFieldLinks itself');
  assert.match(client, /Meteor\.call\('linkCardCustomFields'/);
  assert.match(client, /Meteor\.call\('unlinkCardCustomFields'/);
});

test('every interface string is in English', () => {
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  const used = new Set();
  for (const file of ['client/components/cards/cardCustomFields.jade', 'client/components/cards/cardCustomFields.js']) {
    for (const m of read(file).matchAll(/'((?:custom-field-link|custom-field-unlink|field-link)[a-z-]*)'/g)) used.add(m[1]);
  }
  for (const key of ['custom-field-links', 'custom-field-links-hint', 'custom-field-link-both', 'custom-field-link-send',
    'custom-field-link-sends', 'custom-field-link-receives', 'field-link-not-found']) used.add(key);
  for (const key of used) assert.ok(en[key], `en.i18n.json lacks ${key}`);
});

console.log(`\n${passed} tests passed`);
