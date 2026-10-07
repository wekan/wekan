'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { validDependencyRestore } = require('../models/lib/flowHistory');
const metadata = () => import(`data:text/javascript;base64,${Buffer.from(fs.readFileSync('models/metadata/dependencies.js')).toString('base64')}`);
test('localized duplicate relation labels preserve tokens and distinguish both directions', async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const en = JSON.parse(fs.readFileSync('imports/i18n/data/en.i18n.json'));
  const keys = ['dependency-type-duplicates', 'dependency-type-is-duplicated-by'];
  const codes = fs.readdirSync('imports/i18n/data')
    .filter(file => file.endsWith('.i18n.json') && !/^en(?:[-_]|\.)/.test(file))
    .map(file => file.replace('.i18n.json', ''));
  assert.equal(codes.length, 234);
  for (const code of codes) {
    const locale = JSON.parse(fs.readFileSync(`imports/i18n/data/${code}.i18n.json`));
    for (const key of keys) {
      assert.ok(locale[key]?.trim(), code + ':' + key);
      assert.notEqual(locale[key], en[key], code + ':' + key);
      assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), code + ':' + key);
    }
    assert.notEqual(locale[keys[0]], locale[keys[1]], code);
  }
});
test('duplicate relations preserve direction, inverse and normalization through serialization', async () => {
  const m = await metadata();
  for (const [type, forward, inverse] of [['duplicates', true, 'is-duplicated-by'], ['is-duplicated-by', false, 'duplicates']]) {
    assert.deepEqual(m.dependencyTypeMeta(type), { id: type, directed: true, forward });
    assert.equal(m.DEPENDENCY_TYPE_INVERSE[type], inverse);
    const value = m.normalizeDependency({ cardId: 'b', type, color: '#123456', icon: 'link' });
    assert.equal(m.normalizeDependency(JSON.parse(JSON.stringify(value))).type, type);
    assert.equal(validDependencyRestore({ _id: 'a', boardId: 'board' }, [value], [{ _id: 'b', boardId: 'board' }]), true);
    for (const target of [{ _id: 'b', boardId: 'other' }, { _id: 'b', boardId: 'board', deletedAt: new Date() }]) {
      assert.equal(validDependencyRestore({ _id: 'a', boardId: 'board' }, [value], [target]), false);
    }
  }
  assert.equal(m.normalizeDependency({ cardId: 'b', type: 'unknown' }).type, 'related-to');
});
test('every dependency type has an English label and an involutive inverse', async () => {
  const m = await metadata(), en = JSON.parse(fs.readFileSync('imports/i18n/data/en.i18n.json'));
  for (const { id } of m.DEPENDENCY_TYPES) {
    assert.ok(en[`dependency-type-${id}`]);
    assert.equal(m.DEPENDENCY_TYPE_INVERSE[m.DEPENDENCY_TYPE_INVERSE[id]], id);
  }
});
