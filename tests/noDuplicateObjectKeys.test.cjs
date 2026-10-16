'use strict';

// In an object literal the LAST definition of a key wins, silently. Cards.helpers
// defined assignMember ... toggleAssigner twice (twelve methods, about a hundred
// lines), so the first copy - with its own linked-board handling - never ran
// and anybody reading it was reading code that does nothing. Users.helpers had
// two copies of the swimlane-height storage helpers, and the header's event
// map an empty 'click .js-open-bookmarks' the real handler replaced. Each
// first copy was removed; what runs is unchanged.
//
// The negative sweep parses every JavaScript file of the app and its packages
// and fails on any object literal that defines the same plain key twice - a
// helpers({}), an events({}), a Meteor.methods({}) or anything else.
// Getter/setter pairs are one property and are allowed.
//
// Run: node tests/noDuplicateObjectKeys.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');

const ROOT = path.join(__dirname, '..');
const SKIP = new Set(['_build', 'node_modules', '.npm']);

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.name.endsWith('.js')) out.push(full);
  }
  return out;
}

function duplicates(src, label) {
  const ast = parse(src, {
    sourceType: 'unambiguous', errorRecovery: true,
    plugins: ['jsx', 'classProperties', 'topLevelAwait'],
  });
  const found = [];
  (function visit(node) {
    if (!node || typeof node.type !== 'string') return;
    if (node.type === 'ObjectExpression') {
      const seen = new Map();
      for (const p of node.properties) {
        if ((p.type !== 'ObjectProperty' && p.type !== 'ObjectMethod') || p.computed) continue;
        if (p.kind === 'get' || p.kind === 'set') continue;
        const key = p.key.name ?? p.key.value;
        if (key === undefined) continue;
        if (seen.has(key)) found.push(`${label}:${seen.get(key)} and ${p.loc.start.line}: ${key}`);
        else seen.set(key, p.loc.start.line);
      }
    }
    for (const k of Object.keys(node)) {
      if (k === 'loc') continue;
      const v = node[k];
      if (Array.isArray(v)) v.forEach(visit);
      else if (v && typeof v.type === 'string') visit(v);
    }
  })(ast.program);
  return found;
}

console.log('noDuplicateObjectKeys:');

test('the check finds a key defined twice, and lets a getter/setter pair be', () => {
  assert.strictEqual(duplicates('X.helpers({ a() {}, b: 1, a() {} });', 'x').length, 1);
  assert.strictEqual(duplicates('const o = { get v() { return 1; }, set v(x) {} };', 'x').length, 0);
});

test('each removed first copy is gone and the one that ran is kept', () => {
  const cards = fs.readFileSync(path.join(ROOT, 'models/cards.js'), 'utf8');
  for (const name of ['assignMember', 'unassignAssignee', 'toggleRequester', 'toggleAssigner']) {
    assert.strictEqual(cards.split(`\n  ${name}(`).length - 1, 1, `cards.js defines ${name} once`);
  }
  const users = fs.readFileSync(path.join(ROOT, 'models/users.js'), 'utf8');
  for (const name of ['getSwimlaneHeightFromStorage', 'setSwimlaneHeightToStorage']) {
    assert.strictEqual(users.split(`\n  ${name}(`).length - 1, 1, `users.js defines ${name} once`);
  }
});

test('no object literal anywhere defines the same key twice (negative)', () => {
  const found = ['client', 'models', 'server', 'imports', 'config', 'packages']
    .flatMap(top => walk(path.join(ROOT, top)))
    .flatMap(f => duplicates(fs.readFileSync(f, 'utf8'), path.relative(ROOT, f)));
  assert.deepStrictEqual(found, [], 'the later definition wins; the earlier one never runs');
});

console.log(`\nnoDuplicateObjectKeys: ${passed} tests passed`);
