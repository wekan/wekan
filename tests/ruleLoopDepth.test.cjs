'use strict';

// Guard: BypassBleed's denial-of-service part (reported 2022; still open until
// 2026-10-02). A rule's action writes a card, the write inserts an activity,
// and the activity runs the rules again, in the same awaited chain. "Label
// added -> remove it" with "label removed -> add it" recursed without end.
// Rules started by rules are counted now, and a chain deeper than
// MAX_RULE_DEPTH stops and is reported.
// Run: node tests/ruleLoopDepth.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { AsyncLocalStorage } = require('node:async_hooks');

const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'server/rulesHelper.js'), 'utf8');

// Meteor's EnvironmentVariable, as Meteor 3 implements it: async context.
class EnvironmentVariable {
  constructor() { this.store = new AsyncLocalStorage(); }
  get() { return this.store.getStore(); }
  withValue(value, fn) { return this.store.run(value, fn); }
}

function loadExecute() {
  const max = Number(/export const MAX_RULE_DEPTH = (\d+);/.exec(src)[1]);
  const start = src.indexOf('  async executeRules(activity) {');
  const end = src.indexOf('  async executeRulesAtDepth(activity) {');
  const body = src.slice(start, end).replace('async executeRules(activity) {', 'async function executeRules(activity) {').replace(/\},\s*$/, '}');
  const records = [];
  // eslint-disable-next-line no-new-func
  const make = new Function('ruleDepth', 'MAX_RULE_DEPTH', 'require', `${body}\nreturn executeRules;`);
  const executeRules = make(new EnvironmentVariable(), max, () => ({ record: r => records.push(r) }));
  return { executeRules, records, max };
}

test('the reported loop: two rules undoing each other stop at the depth limit', async () => {
  const { executeRules, records, max } = loadExecute();
  let runs = 0;
  const helper = {
    executeRules,
    // Each run's action writes a card, whose activity runs the rules again.
    async executeRulesAtDepth(activity) { runs += 1; await this.executeRules(activity); },
  };
  await helper.executeRules({ boardId: 'b', activityType: 'addedLabel' });
  assert.equal(runs, max, 'the chain ran to the limit, not forever');
  assert.equal(records.length, 1);
  assert.equal(records[0].key, 'dos.rule-loop');
  assert.equal(records[0].action, 'detected', 'reported, never blocking: usually an honest mistake');
});

test('ordinary rules - and separate activities - run as before (negative)', async () => {
  const { executeRules, records } = loadExecute();
  let runs = 0;
  const helper = { executeRules, async executeRulesAtDepth() { runs += 1; } };
  for (let i = 0; i < 20; i++) await helper.executeRules({ boardId: 'b' });
  assert.equal(runs, 20, 'depth is per chain, not a global counter');
  assert.equal(records.length, 0);
});

test('the guard wraps every rule run', () => {
  assert.match(src, /await ruleDepth\.withValue\(depth \+ 1, \(\) => this\.executeRulesAtDepth\(activity\)\);/);
  assert.match(src, /const ruleDepth = new Meteor\.EnvironmentVariable\(\);/);
  assert.match(fs.readFileSync(path.join(ROOT, 'models/lib/securityCategories.js'), 'utf8'), /'dos\.rule-loop':\s*\{[^}]*bleed: 'BypassBleed'/);
});
