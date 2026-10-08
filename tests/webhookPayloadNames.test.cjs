'use strict';
// #3297: an outgoing webhook carried mostly ids. It now carries by default the
// names behind them (list, board, swimlane), the card link, and the person a
// join or assignment is about - "the most important field which is missing
// is the user who got assigned or joined", so a chat integration can address
// them by username. WEBHOOKS_ATTRIBUTES still replaces the default list.
//
// Run: node tests/webhookPayloadNames.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const code = src => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const activities = code(read('server/models/activities.js'));
const outgoing = read('server/notifications/outgoing.js');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('webhookPayloadNames:');

const defaults = (() => {
  const start = outgoing.indexOf("process.env.WEBHOOKS_ATTRIBUTES.split(',')) || [");
  const block = outgoing.slice(start, outgoing.indexOf('];', start));
  return [...code(block).matchAll(/'([A-Za-z]+)'/g)].map(m => m[1]);
})();

test('the default payload names what the ids point at, and links the card', () => {
  for (const key of ['card', 'list', 'board', 'swimlane', 'user', 'username', 'url']) {
    assert.ok(defaults.includes(key), key);
  }
});

test('a join and an assignment name the person, by full name and by username', () => {
  for (const key of ['member', 'memberUsername', 'assigneeId', 'assignee', 'assigneeUsername']) {
    assert.ok(defaults.includes(key), key);
  }
  assert.match(activities, /params\.memberUsername = \(member && member\.username\) \|\| '';/);
  assert.match(activities, /if \(activity\.assigneeId\) \{\s*const assignee = await ReactiveCache\.getUser\(activity\.assigneeId\);\s*params\.assigneeId = activity\.assigneeId;\s*params\.assignee = getActivityUserName\(assignee, activity\.assigneeId\);\s*params\.assigneeUsername = \(assignee && assignee\.username\) \|\| '';/);
});

test('negative: WEBHOOKS_ATTRIBUTES still replaces the defaults wholesale, and nothing private is added', () => {
  assert.match(outgoing, /const webhooksAtbts = \(process\.env\.WEBHOOKS_ATTRIBUTES &&\s*process\.env\.WEBHOOKS_ATTRIBUTES\.split\(','\)\) \|\| \[/);
  for (const key of defaults) {
    assert.ok(!/email|password|token|secret|services/i.test(key), `${key} is not a private field`);
  }
});

console.log(`\nwebhookPayloadNames: ${passed} tests passed`);
