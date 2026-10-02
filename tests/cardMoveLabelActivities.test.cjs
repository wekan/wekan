'use strict';
// A card moved to another board keeps its addedLabel activities, re-pointed
// at the new board's labels. updateActivities (models/cards.js) is not
// idempotent - a second run in the same update deletes what the first one
// re-pointed - so it must run once per update.
// Server test: server/lib/tests/cardMoveLabelActivities.tests.js.
// Run: node tests/cardMoveLabelActivities.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const src = fs.readFileSync(path.join(__dirname, '../server/models/cards.js'), 'utf8');
assert.equal((src.match(/updateActivities\(doc, fieldNames, modifier\)/g) || []).length, 1, 'updateActivities runs once per update');
// ...unless a durable rule move to another board writes its changes itself
// (server/lib/syncRuleMoveBoardCommand.js).
assert.match(src, /await cardMembers\(userId, doc, fieldNames, modifier\);[\s\S]{0,500}if \(!deferSyncLabelActivities\(doc\)\) await updateActivities\(doc, fieldNames, modifier\);/);
// Negative: no other server hook calls it again.
for (const dir of ['server', 'models']) {
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory()
    ? (['node_modules', 'tests'].includes(e.name) ? [] : walk(path.join(d, e.name))) : [path.join(d, e.name)]);
  for (const file of walk(path.join(__dirname, '..', dir)).filter(f => f.endsWith('.js'))) {
    if (file.endsWith(path.join('server', 'models', 'cards.js'))) continue;
    assert.ok(!/await updateActivities\(/.test(fs.readFileSync(file, 'utf8')), `${file} calls updateActivities`);
  }
}
console.log('  ok - updateActivities runs once per card update');
