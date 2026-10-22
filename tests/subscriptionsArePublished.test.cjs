'use strict';

// Every Meteor.subscribe('name') on the client must name a publication the
// server actually has. A misspelt name is not an error anywhere: Meteor logs
// nothing, the subscription never becomes ready and the data it should carry
// is simply absent. The notifications drawer subscribed to
// 'notificationsAttachments' while the server publishes
// 'notificationAttachments', so an attachment named in a notification was
// never sent to the drawer.
//
// The test pins that subscription, and the negative sweep checks every
// subscribe() in the tree against every publish(), so the same slip cannot
// live at another call site.
//
// Run: node tests/subscriptionsArePublished.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { isMeteorPackageFork } = require('./lib/meteorPackageForks.cjs');

const ROOT = path.join(__dirname, '..');
const TOPS = ['client', 'server', 'models', 'imports', 'packages', 'config'];
const SKIP = new Set(['node_modules', '.npm', '_build']);

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const full = path.join(dir, e.name);
    // Meteor's own packages subscribe in their own tests to what those tests
    // publish; they are not WeKan's subscriptions.
    if (isMeteorPackageFork(path.relative(ROOT, full))) continue;
    if (e.isDirectory()) walk(full, out);
    else if (/\.(js|jade)$/.test(e.name)) out.push(full);
  }
  return out;
}

const files = TOPS.flatMap(t => walk(path.join(ROOT, t)));
const published = new Set();
const subscribed = [];
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  for (const m of src.matchAll(/\b(?:Meteor\.publish|publishComposite)\(\s*['"]([\w.-]+)['"]/g)) {
    published.add(m[1]);
  }
  // server/notifications/* register with Notifications.subscribe(), which is
  // WeKan's own notifier registry, not a DDP subscription.
  for (const m of src.matchAll(/(\w+)\.subscribe\(\s*['"]([\w.-]+)['"]/g)) {
    if (m[1] === 'Notifications') continue;
    subscribed.push({ name: m[2], file: path.relative(ROOT, file) });
  }
}

console.log('subscriptionsArePublished:');

test('the notifications drawer subscribes to the attachments publication by its real name', () => {
  const drawer = fs.readFileSync(
    path.join(ROOT, 'client/components/notifications/notificationsDrawer.js'), 'utf8');
  assert.ok(drawer.includes("Meteor.subscribe('notificationAttachments')"));
  assert.ok(published.has('notificationAttachments'));
});

test('the scan sees the publications it is checking against', () => {
  assert.ok(published.size >= 50, `found only ${published.size} publications`);
  assert.ok(subscribed.length >= 50, `found only ${subscribed.length} subscriptions`);
});

test('no subscribe() names a publication that does not exist (negative)', () => {
  const missing = subscribed.filter(s => !published.has(s.name))
    .map(s => `${s.file}: '${s.name}'`);
  assert.deepStrictEqual([...new Set(missing)], [],
    'these subscriptions name no publication, so they never become ready');
});

console.log(`\nsubscriptionsArePublished: ${passed} tests passed`);
