'use strict';

// models/lib/schemaTimestamps.js holds the createdAt / modifiedAt autoValue
// that 34 collection schemas used to write out by hand, 64 times. This test
// runs both functions the way SimpleSchema calls an autoValue - with the
// field's context as `this` - and fails when a schema spells one out again.
//
// Run: node tests/schemaTimestamps.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const { createdAtAutoValue, modifiedAtAutoValue } = require('../models/lib/schemaTimestamps.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

function context(kind) {
  const ctx = { isInsert: kind === 'insert', isUpsert: kind === 'upsert', isUpdate: kind === 'update', unsetCalled: false };
  ctx.unset = () => { ctx.unsetCalled = true; };
  return ctx;
}

test('createdAt: set on insert, set only on insert by an upsert', () => {
  assert.ok(createdAtAutoValue.call(context('insert')) instanceof Date);
  const upsert = createdAtAutoValue.call(context('upsert'));
  assert.ok(upsert.$setOnInsert instanceof Date);
  assert.deepEqual(Object.keys(upsert), ['$setOnInsert']);
});

test('negative: createdAt is never changed by an update, and a value sent with one is dropped', () => {
  const ctx = context('update');
  assert.equal(createdAtAutoValue.call(ctx), undefined);
  assert.equal(ctx.unsetCalled, true);
});

test('modifiedAt: set on insert, upsert and update', () => {
  for (const kind of ['insert', 'upsert', 'update']) {
    const ctx = context(kind);
    assert.ok(modifiedAtAutoValue.call(ctx) instanceof Date, kind);
    assert.equal(ctx.unsetCalled, false, kind);
  }
});

test('negative: modifiedAt outside a write (plain validation) is unset', () => {
  const ctx = context('validate');
  assert.equal(modifiedAtAutoValue.call(ctx), undefined);
  assert.equal(ctx.unsetCalled, true);
});

// The shapes that were copied: the createdAt and modifiedAt bodies, in any of
// the spellings that had grown (if/else blocks, early returns, the three
// conditions in either order).
const files = execFileSync('git', ['ls-files', '--', 'models/*.js', 'server/*.js'], { cwd: ROOT }).toString()
  .split('\n').filter(f => f && !f.includes('/tests/') && f !== 'models/lib/schemaTimestamps.js'
    && fs.existsSync(path.join(ROOT, f)));

function handWritten(src) {
  const out = [];
  const re = /( *)autoValue\(\) \{\n([\s\S]*?)\n\1\},/g;
  let m;
  while ((m = re.exec(src))) {
    const body = m[2].split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//')).join(' ');
    const created = /^if \(this\.isInsert\) \{? ?return new Date\(\);/.test(body)
      && /this\.isUpsert\) \{? ?return \{ \$setOnInsert: new Date\(\),? \};/.test(body) && /this\.unset\(\);/.test(body);
    const conds = body.match(/^if \(this\.is(\w+) \|\| this\.is(\w+) \|\| this\.is(\w+)\) \{? ?return new Date\(\);/);
    const modified = conds && [conds[1], conds[2], conds[3]].sort().join() === 'Insert,Update,Upsert' && /this\.unset\(\);/.test(body);
    if (created || modified) out.push(src.slice(0, m.index).split('\n').length);
  }
  return out;
}

test('negative: no schema writes either function out by hand again', () => {
  const found = [];
  for (const f of files) for (const line of handWritten(fs.readFileSync(path.join(ROOT, f), 'utf8'))) found.push(`${f}:${line}`);
  assert.deepEqual(found, []);
});

test('negative: the detector finds the spellings that had been copied', () => {
  const samples = [
    'x: {\n    autoValue() {\n      if (this.isInsert) {\n        return new Date();\n      } else if (this.isUpsert) {\n        return { $setOnInsert: new Date() };\n      } else {\n        this.unset();\n      }\n    },\n',
    'x: {\n    autoValue() {\n      if (this.isInsert) return new Date();\n      if (this.isUpsert) return { $setOnInsert: new Date() };\n      this.unset();\n    },\n',
    'x: {\n    autoValue() {\n      if (this.isUpdate || this.isUpsert || this.isInsert) {\n        return new Date();\n      } else {\n        this.unset();\n      }\n    },\n',
    'x: {\n    autoValue() {\n      if (this.isInsert || this.isUpsert || this.isUpdate) return new Date();\n      this.unset();\n    },\n',
  ];
  for (const sample of samples) assert.equal(handWritten(sample).length, 1, sample);
  // A different rule is not a copy: changeHistory keeps a createdAt the
  // caller set, and that stays written out.
  assert.equal(handWritten('x: {\n    autoValue() {\n      if (this.isInsert && !this.isSet) return new Date();\n      if (this.isUpsert) return { $setOnInsert: new Date() };\n      if (!this.isInsert) this.unset();\n    },\n').length, 0);
});

test('the schemas use the shared functions', () => {
  const users = files.filter(f => /autoValue: (createdAt|modifiedAt)AutoValue,/.test(fs.readFileSync(path.join(ROOT, f), 'utf8')));
  assert.ok(users.length >= 30, `${users.length} schema files use them`);
  for (const f of users) {
    assert.match(fs.readFileSync(path.join(ROOT, f), 'utf8'), /(from|require\()\s*'\/models\/lib\/schemaTimestamps'/, f);
  }
});

console.log(`\nschemaTimestamps: ${passed} tests passed`);
