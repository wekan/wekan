'use strict';
// Hall of Fame regression coverage: VisibilityBleed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname, '../server/models/boards.js'), 'utf8');
const start = source.indexOf('  async createBoardWithInitialSwimlanes(payload) {');
const end = source.indexOf('    const boardId = await Boards.insertAsync({', start);
assert.ok(start >= 0 && end > start);
const prefix = source.slice(start, end).replace('  async createBoardWithInitialSwimlanes(payload) {', '');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const run = new AsyncFunction('payload', 'check', 'Match', 'Meteor', 'TableVisibilityModeSettings', 'ReactiveCache', 'require', prefix + '\nreturn permission;');
(async () => {
  for (const privateOnly of [false, true]) {
    for (const requested of ['private', 'public']) {
      const logs = [];
      const settings = { findOneAsync: async key => ({ booleanValue: key === 'tableVisibilityMode-allowPrivateOnly' && privateOnly }) };
      const result = await run.call({ userId: 'creator' }, { title: 'T', slug: 't', permission: requested }, () => {}, { ObjectIncluding: x => x, Maybe: x => x }, {}, settings, {}, () => ({ record: x => logs.push(x) }));
      assert.equal(result, privateOnly ? 'private' : requested);
      assert.equal(logs.length, privateOnly && requested === 'public' ? 1 : 0, 'only blocked public requests are logged');
    }
  }
  const cards = fs.readFileSync(require('node:path').join(__dirname, '../server/models/cards.js'), 'utf8');
  const at = cards.indexOf("    const privateOnly = await TableVisibilityModeSettings.findOneAsync(");
  assert.ok(at > 0);
  const conversion = new AsyncFunction('sourceBoard', 'TableVisibilityModeSettings', 'require', cards.slice(at, cards.indexOf('    const boardId = await Boards.insertAsync({', at)) + '\nreturn permission;');
  for (const enabled of [false, true]) {
    const settings = { findOneAsync: async () => ({ booleanValue: enabled }) };
    assert.equal(await conversion({ permission: 'public' }, settings, () => ({ record() { throw Error('logger unavailable'); } })), enabled ? 'private' : 'public', 'conversion policy survives logging failure');
  }
  assert.ok(!/permission:\s*sourceBoard\.permission/.test(cards), 'negative: conversion no longer copies visibility without policy');
  assert.ok(source.indexOf("'tableVisibilityMode-allowPrivateOnly'", start) < end, 'negative: method policy runs before insert');
  const hookAt = source.indexOf('Boards.before.insert(async (userId, doc) => {');
  const hookEnd = source.indexOf('\n});', hookAt);
  const hook = new AsyncFunction('userId', 'doc', 'TableVisibilityModeSettings', 'ReactiveCache', 'require', source.slice(source.indexOf('\n', hookAt) + 1, hookEnd));
  for (const enabled of [false, true]) {
    const doc = { permission: 'public' };
    await hook('u', doc, { findOneAsync: async () => ({ booleanValue: enabled }) }, { getBoard: async () => null }, () => ({ record() { throw Error('logger unavailable'); } }));
    assert.equal(doc.permission, enabled ? 'private' : 'public', 'shared copy/import/helper insert policy survives logger failure');
  }
  console.log('boardPrivateOnlyMethod: server decision preserves private-only policy');
})().catch(error => { console.error(error); process.exitCode = 1; });
