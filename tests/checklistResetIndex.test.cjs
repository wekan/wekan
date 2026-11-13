'use strict';

// #6899: the recurring-checklist reset cron reads the checklists with a
// resetInterval on every tick; with no index that was a full scan of every
// checklist (about 45,000 on the reporting instance), reported on Admin Panel
// -> Problems as db.collection-scan. A partial index holds only the recurring
// checklists, as #6825 did for recurring cards.
// Run: node tests/checklistResetIndex.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

test('checklists have a partial index on resetInterval, ensured at startup', () => {
  const src = read('models/checklists.js');
  const startup = src.slice(src.indexOf('Meteor.startup(async () => {'));
  assert.match(startup,
    /await ensureIndex\(Checklists, \{ resetInterval: 1 \},\s+\{ partialFilterExpression: \{ resetInterval: \{ \$exists: true \} \} \}\);/);
});

test('the cron selector asks $exists: true, which lets MongoDB use the partial index', () => {
  // negative: a selector without $exists: true could not use a partial index
  // and would go back to scanning every checklist
  assert.match(read('server/checklistResetSchedule.js'),
    /resetInterval: \{ \$exists: true, \$nin: \[null, 'none'\] \}/);
});

test('every server-side resetInterval query carries $exists: true', () => {
  const root = path.join(__dirname, '..');
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.js') ? [path.join(d, e.name)] : []);
  for (const file of [...walk(path.join(root, 'server')), ...walk(path.join(root, 'models'))]) {
    for (const m of fs.readFileSync(file, 'utf8').matchAll(/resetInterval: \{ \$nin[^}]*\}/g)) {
      assert.fail(`${path.relative(root, file)}: ${m[0]} cannot use the partial index`);
    }
  }
});

console.log(`\n${passed} tests passed`);
