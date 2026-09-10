'use strict';
(async () => {

// Plain-Node unit + source tests (no Meteor) for #3141: an "Admin only" flag
// on a custom-field DEFINITION that hides its VALUE from a non board-admin
// board member entirely - on the card-detail view and the minicard alike -
// and rejects a non-admin's direct server-method attempt to set it.
//
// Run: node tests/adminOnlyCustomField3141.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const {
  buildCustomFieldsWD,
  filterAdminOnlyDefinitions,
} = await import('../models/lib/customFieldsWD.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

console.log('adminOnlyCustomField3141:');

// --- models/customFields.js schema -----------------------------------------
const customFieldsSrc = fs.readFileSync(
  path.join(__dirname, '..', 'models', 'customFields.js'), 'utf8',
);

test('the CustomFields schema has an `adminOnly` boolean defaulting to false', () => {
  assert.ok(/adminOnly:\s*\{[\s\S]*?type:\s*Boolean,[\s\S]*?defaultValue:\s*false,/.test(customFieldsSrc),
    'a new field is unaffected unless explicitly marked admin-only');
});

// --- filterAdminOnlyDefinitions (the shared, pure choke point) -------------
const publicDef = { _id: 'cf-public', name: 'Priority', type: 'text', settings: {} };
const adminDef = { _id: 'cf-admin', name: 'API Key', type: 'text', settings: {}, adminOnly: true };
const legacyDef = { _id: 'cf-legacy', name: 'Old field', type: 'text', settings: {} }; // no adminOnly key at all

test('a non-admin viewer loses only the adminOnly definition', () => {
  const ret = filterAdminOnlyDefinitions([publicDef, adminDef, legacyDef], false);
  assert.deepStrictEqual(ret.map(d => d._id), ['cf-public', 'cf-legacy']);
});

test('a board admin sees every definition, including adminOnly ones', () => {
  const ret = filterAdminOnlyDefinitions([publicDef, adminDef, legacyDef], true);
  assert.deepStrictEqual(ret.map(d => d._id), ['cf-public', 'cf-admin', 'cf-legacy']);
});

test('a field created before #3141 (no `adminOnly` key) is never hidden', () => {
  const ret = filterAdminOnlyDefinitions([legacyDef], false);
  assert.strictEqual(ret.length, 1);
});

test('malformed input never throws', () => {
  assert.deepStrictEqual(filterAdminOnlyDefinitions(null, false), null);
  assert.deepStrictEqual(filterAdminOnlyDefinitions(undefined, true), undefined);
  // a null/undefined hole is left as-is rather than dropped - the same
  // defensive shape buildCustomFieldsWD() already uses for its own inputs -
  // since a hole is not a definition that could ever be marked admin-only.
  assert.deepStrictEqual(filterAdminOnlyDefinitions([null, undefined], false), [null, undefined]);
});

// --- End-to-end through buildCustomFieldsWD (card detail + minicard) -------
// Both client/components/cards/cardDetails.jade and minicard.jade render off
// the SAME `each customFieldsWD` - models/cards.js's customFieldsWD() calls
// filterAdminOnlyDefinitions() before buildCustomFieldsWD(), so proving the
// VALUE disappears once the definition is filtered out proves both call
// sites at once, without needing Blaze/Meteor to render either template.
test('a non-admin never receives the adminOnly field\'s VALUE from customFieldsWD', () => {
  const cardCustomFields = [
    { _id: 'cf-public', value: 'high' },
    { _id: 'cf-admin', value: 'sk-secret-token' },
  ];
  const nonAdminDefinitions = filterAdminOnlyDefinitions([publicDef, adminDef], false);
  const ret = buildCustomFieldsWD(cardCustomFields, nonAdminDefinitions);
  assert.deepStrictEqual(ret.map(f => f._id), ['cf-public']);
  assert.ok(!ret.some(f => f._id === 'cf-admin' || f.value === 'sk-secret-token'),
    'the admin-only value never appears anywhere in the result, for either render call site');
});

test('a board admin still receives the adminOnly field\'s VALUE from customFieldsWD', () => {
  const cardCustomFields = [
    { _id: 'cf-public', value: 'high' },
    { _id: 'cf-admin', value: 'sk-secret-token' },
  ];
  const adminDefinitions = filterAdminOnlyDefinitions([publicDef, adminDef], true);
  const ret = buildCustomFieldsWD(cardCustomFields, adminDefinitions);
  assert.deepStrictEqual(ret.map(f => f._id).sort(), ['cf-admin', 'cf-public']);
  assert.ok(ret.some(f => f._id === 'cf-admin' && f.value === 'sk-secret-token'));
});

// --- server/permissions/customFields.js: toggling the flag is admin-only ---
const customFieldsPermSrc = fs.readFileSync(
  path.join(__dirname, '..', 'server', 'permissions', 'customFields.js'), 'utf8',
);

test('CustomFields.allow update rejects a non-admin writing `adminOnly`', () => {
  assert.ok(/fields\.includes\('adminOnly'\)/.test(customFieldsPermSrc),
    'the update allow-rule inspects which fields are being written');
  assert.ok(/board\.hasAdmin\(userId\)/.test(customFieldsPermSrc),
    'and requires board admin specifically for that field');
});

test('CustomFields.allow insert rejects creating a field already marked adminOnly', () => {
  assert.ok(/if \(doc\.adminOnly\)/.test(customFieldsPermSrc));
});

// --- server/permissions/cards.js: a direct client write of the VALUE -------
const cardsPermSrc = fs.readFileSync(
  path.join(__dirname, '..', 'server', 'permissions', 'cards.js'), 'utf8',
);

test('Cards.deny rejects a direct client write to an adminOnly field\'s value', () => {
  assert.ok(/denyAdminOnlyCustomFieldValueWrite/.test(cardsPermSrc),
    'a dedicated deny check exists');
  assert.ok(/customFields\\\.\(\\d\+\)\\\.value/.test(cardsPermSrc) ||
    /customFields\.\(\\d\+\)\.value/.test(cardsPermSrc) ||
    /customFields\.\\\(\\d\+\\\)\.value/.test(cardsPermSrc),
    'it inspects the exact `customFields.<index>.value` modifier shape the client writes');
  assert.ok(/CustomFields\.findOneAsync\(entry\._id\)/.test(cardsPermSrc));
  assert.ok(/board\.hasAdmin\(userId\)/.test(cardsPermSrc));
});

// --- server/models/cards.js: the dedicated setCardCustomField* methods -----
const serverCardsSrc = fs.readFileSync(
  path.join(__dirname, '..', 'server', 'models', 'cards.js'), 'utf8',
);

test('setCardCustomFieldCheckbox rejects a non-admin writing an adminOnly field', () => {
  const method = serverCardsSrc.slice(
    serverCardsSrc.indexOf('async setCardCustomFieldCheckbox'),
    serverCardsSrc.indexOf('async setCardCustomFieldCurrency'),
  );
  assert.ok(/definition\.adminOnly && !board\.hasAdmin\(this\.userId\)/.test(method),
    'the method itself checks, independent of the deny rule above - a Meteor\n    method body running on the server bypasses allow/deny entirely');
});

test('setCardCustomFieldCurrency rejects a non-admin writing an adminOnly field', () => {
  const method = serverCardsSrc.slice(
    serverCardsSrc.indexOf('async setCardCustomFieldCurrency'),
  );
  const methodBody = method.slice(0, method.indexOf('\n  },\n\n  // Server-authoritative subtask'));
  assert.ok(/definition\.adminOnly && !board\.hasAdmin\(this\.userId\)/.test(methodBody));
});

// --- Negative: the SHAPE is not left open anywhere else on the server ------
test('negative: every setCardCustomField* method that writes an arbitrary value checks adminOnly', () => {
  // setCardCustomFieldAssigned only ever writes `value: null` (presence, not
  // content) - assert only that the two content-writing methods both guard.
  const guardedMethods = ['setCardCustomFieldCheckbox', 'setCardCustomFieldCurrency'];
  for (const name of guardedMethods) {
    const start = serverCardsSrc.indexOf(`async ${name}`);
    assert.ok(start > -1, `${name} exists`);
    const nextMethodStart = serverCardsSrc.indexOf('\n  async ', start + 1);
    const body = serverCardsSrc.slice(start, nextMethodStart > -1 ? nextMethodStart : undefined);
    assert.ok(/definition\.adminOnly/.test(body), `${name} inspects definition.adminOnly`);
  }
});

console.log(`\n${passed} passed`);

})().catch(e => { console.error(e); process.exit(1); });
