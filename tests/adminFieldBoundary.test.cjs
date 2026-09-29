'use strict';
// AdminFieldBleed: protected values stay behind server field permissions.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { mayReadField, redact, protectedValues } = require('../models/lib/adminOnlyCustomFields');
const definitions = new Map([
  ['private', { _id: 'private', adminOnly: true, boardIds: ['a', 'b'] }],
  ['public', { _id: 'public', adminOnly: false, boardIds: ['a'] }],
]);
const card = { _id: 'card', boardId: 'a', customFields: [{ _id: 'private', value: 'SECRET' }, { _id: 'public', value: 'PUBLIC' }] };
test('raw card, nested snapshot and activity values are redacted without changing field indexes or source', () => {
  const raw = { cards: [card], history: { boardId: 'a', previousContent: card }, activity: { boardId: 'a', customFieldId: 'private', value: 'SECRET' } };
  const result = redact(raw, definitions, new Set());
  assert.doesNotMatch(JSON.stringify(result), /SECRET/);
  assert.equal(result.cards[0].customFields[1].value, 'PUBLIC');
  assert.equal(result.cards[0].customFields[0]._id, 'private');
  assert.equal(card.customFields[0].value, 'SECRET');
  assert.equal(redact(card, definitions, new Set(['a'])).customFields[0].value, 'SECRET');
});
test('missing/foreign definitions and missing board context fail closed, including shared definitions', () => {
  assert.equal(mayReadField(undefined, 'a', new Set(['a'])), false);
  assert.equal(mayReadField(definitions.get('public'), 'b', new Set(['b'])), false);
  assert.equal(mayReadField(definitions.get('private'), undefined, new Set(['a'])), false);
  assert.equal(mayReadField(definitions.get('private'), undefined, new Set(['a', 'b'])), true);
});
test('protected comparison catches insertion, deletion, array replacement, false and zero; public edits remain possible', () => {
  assert.deepEqual(protectedValues(null, definitions, new Set()), []);
  assert.equal(protectedValues(card, definitions, new Set()).length, 1);
  assert.deepEqual(protectedValues(card, definitions, new Set(['a'])), []);
  for (const value of [false, 0, '', 'forged']) assert.equal(protectedValues({ ...card, customFields: [{ _id: 'private', value }] }, definitions, new Set()).length, 1);
  const after = structuredClone(card); after.customFields[1].value = 'changed';
  assert.deepEqual(protectedValues(card, definitions, new Set()), protectedValues(after, definitions, new Set()));
});
test('boundaries cover all publication/method registrations, REST serialization and direct writes', () => {
  const imports = fs.readFileSync('server/imports.js', 'utf8');
  assert.ok(imports.indexOf('/server/00adminOnlyFieldBoundary') < imports.indexOf('/imports/startup/shared-models'));
  assert.match(imports, /\/server\/adminOnlyFieldWrites/);
  const boundary = fs.readFileSync('server/00adminOnlyFieldBoundary.js', 'utf8');
  for (const shape of ['Meteor.publish =', 'Meteor.methods =', 'this.added =', 'this.changed =', 'this.removed =', 'observeChangesAsync', 'held.release()']) assert.ok(boundary.includes(shape));
  assert.match(fs.readFileSync('server/apiMiddleware.js', 'utf8'), /redactFields\(options.data, res.req\?\.userId\)/);
  const writes = fs.readFileSync('server/adminOnlyFieldWrites.js', 'utf8');
  for (const shape of ['Cards._collection', 'driver.insertAsync', "['updateAsync', 'upsertAsync']", 'modifiedCard(row, modifier)', 'assertFieldWrite', 'CustomFields._collection']) assert.ok(writes.includes(shape));
});
test('every binary and streaming exporter entry point checks the shared field boundary', () => {
  const paths = ['models/exporter.js', ...fs.readdirSync('models/server').filter(n => /^Exporter.*\.js$/.test(n)).map(n => `models/server/${n}`)];
  let count = 0;
  for (const path of paths) {
    const text = fs.readFileSync(path, 'utf8');
    for (const match of text.matchAll(/async build(?:Stream|CsvStream|Csv)?\([^\n]*\) \{([\s\S]{0,200})/g)) {
      count++; assert.match(match[1], /assertFieldExport\(this\._boardId, this\._customFieldViewerId\)/, path);
    }
  }
  assert.ok(count >= 12);
});

test('history field snapshots are redacted, including nested values and deleted definitions', () => {
  const row = { boardId: 'a', previousContent: { field: 'customFields', value: card.customFields }, newContent: { field: 'customFields', value: [{ _id: 'gone', value: 'OLD SECRET' }] } };
  const safe = redact(row, definitions, new Set());
  assert.equal(safe.previousContent.value[0].value, null);
  assert.equal(safe.previousContent.value[1].value, 'PUBLIC');
  assert.equal(safe.newContent.value[0].value, null);
  assert.doesNotMatch(JSON.stringify(safe), /SECRET/);
});
test('custom-field searches bind value predicates to readable IDs and refuse positional probes', () => {
  const { scopeFieldSelector } = require('../models/lib/adminOnlyCustomFields');
  const scoped = scopeFieldSelector({ $or: [{ title: /needle/ }, { customFields: { $elemMatch: { value: /needle/ } } }] }, definitions, new Set());
  assert.deepEqual(scoped.$or[1].customFields.$elemMatch.$and[1]._id.$in, ['public']);
  assert.deepEqual(scopeFieldSelector({ 'customFields.0.value': 'guess' }, definitions, new Set())._id.$in, []);
  assert.deepEqual(scopeFieldSelector({ 'customFields.value': 'guess' }, definitions, new Set()).customFields.$elemMatch._id.$in, ['public']);
  assert.deepEqual(scopeFieldSelector({ 'customFields.value': 'guess' }, definitions, new Set(['a', 'b'])).customFields.$elemMatch._id.$in, ['private', 'public']);
});

test('history hashes are withheld from non-admins, including successor links, and retained for admins', () => {
  const row = { boardId: 'a', integrityHash: 'digest', previousHash: 'secret-predecessor' };
  assert.equal(redact(row, definitions, new Set()).integrityHash, null);
  assert.equal(redact(row, definitions, new Set()).previousHash, null);
  assert.equal(redact(row, definitions, new Set(['a'])).previousHash, 'secret-predecessor');
});

test('export authorization examines raw unknown values outside the caller search context', async () => {
  const vm = require('node:vm');
  const { AsyncLocalStorage } = require('node:async_hooks');
  const context = new AsyncLocalStorage();
  let unknown = null;
  const collections = {
    '/models/boards': { find: () => ({ fetchAsync: async () => [{ _id: 'a' }] }) },
    '/models/customFields': { find: () => ({ fetchAsync: async () => [] }) },
    '/models/cards': { findOneAsync: async () => {
      assert.equal(context.getStore(), undefined, 'authorization must inspect unreadable values too');
      return unknown;
    } },
  };
  const source = fs.readFileSync('server/lib/adminOnlyCustomFields.js', 'utf8')
    .replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
  const guard = vm.runInNewContext(`${source}\nassertFieldExport`, {
    fieldReadContext: context, Meteor: { Error: Error },
    require: name => name === '/models/lib/adminOnlyCustomFields' ? require('../models/lib/adminOnlyCustomFields') : { default: collections[name] },
  });
  await context.run({}, () => guard('a', 'admin'));
  unknown = { _id: 'orphan' };
  await assert.rejects(context.run({}, () => guard('a', 'admin')), /not-authorized/);
});

test('authorized writes keep exact hook snapshots while caller field searches stay scoped', async () => {
  const vm = require('node:vm');
  const { AsyncLocalStorage } = require('node:async_hooks');
  const fieldReadContext = new AsyncLocalStorage();
  const policy = { definitions, adminBoards: new Set() };
  const selectors = [];
  let deny = false;
  const driver = {
    insertAsync: async () => {}, upsertAsync: async () => {},
    find: selector => { selectors.push(selector); return { fetchAsync: async () => [card] }; },
    findOneAsync: async () => card, rawCollection: () => ({}),
    updateAsync: async selector => {
      assert.equal(fieldReadContext.getStore(), undefined, 'internal hook reads use the checked snapshot');
      assert.deepEqual(selector.$and[1].$or[0].customFields, card.customFields);
      return 1;
    },
  };
  const Cards = { _collection: driver, find: (...args) => driver.find(...args) };
  const CustomFields = { _collection: { insertAsync() {}, updateAsync() {}, upsertAsync() {}, removeAsync() {} } };
  const source = fs.readFileSync('server/adminOnlyFieldWrites.js', 'utf8').replace(/^import .*;\n/gm, '');
  vm.runInNewContext(source, { Cards, CustomFields, fieldReadContext,
    DDP: { _CurrentMethodInvocation: { get: () => ({ userId: 'member' }) } },
    currentReportRequest: () => null,
    require: () => require('../models/lib/adminOnlyCustomFields'),
    modifiedCard: row => row,
    assertFieldWrite: async () => { if (deny) throw new Error('protected-value'); },
  });
  await fieldReadContext.run(policy, async () => {
    assert.equal(await driver.updateAsync('card', { $set: { 'customFields.1.value': 'updated' } }), 1);
    assert.equal(fieldReadContext.getStore(), policy, 'context restored for subsequent caller reads');
    driver.find({ customFields: { $eq: card.customFields } });
    assert.equal(selectors.at(-1).customFields.$elemMatch._id.$in.length, 0);
    deny = true;
    await assert.rejects(driver.updateAsync('card', { $set: { 'customFields.0.value': 'forged' } }), /protected-value/);
  });
});
