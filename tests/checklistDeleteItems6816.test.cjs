'use strict';

// #6816: deleting a checklist must delete its items. It did not: every delete path (the
// card, the REST API, a rule) removed only the checklist document, leaving its
// items with a checklistId that points nowhere.
// Run: node tests/checklistDeleteItems6816.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

test('a removed checklist removes its items, without an activity per item', () => {
  const src = read('server/models/checklists.js');
  assert.match(src, /Checklists\.after\.remove\(async \(userId, doc\) => \{\n\s+if \(!doc \|\| !doc\._id\) return;\n\s+try \{\n\s+await ChecklistItems\.direct\.removeAsync\(\{ checklistId: doc\._id \}\);/);
  assert.match(src, /^import ChecklistItems from '\/models\/checklistItems';$/m);
});

test('the same pattern as deleting a card', () => {
  assert.match(read('models/cards.js'), /await ChecklistItems\.direct\.removeAsync\(\{ cardId: doc\._id \}\);/);
});

test('negative: every delete path goes through the collection, so the hook sees it', () => {
  // UI, REST and rule all call Checklists.remove/removeAsync (no .direct).
  assert.match(read('client/components/cards/checklists.js'), /Checklists\.remove\(checklist\._id\);/);
  assert.match(read('server/models/checklists.js'), /await Checklists\.removeAsync\(\{ _id: paramChecklistId \}\);/);
  assert.match(read('server/rulesHelper.js'), /await Checklists\.removeAsync\(\{\n\s+title: action\.checklistName,/);
  assert.doesNotMatch(read('server/models/checklists.js') + read('server/rulesHelper.js'), /Checklists\.direct\.remove/);
  // The durable rule plans too.
  assert.match(read('server/notifications/storedRulePlans.js'), /Checklists\.removeAsync\(exactFieldSelector\(current, keys\)\)/);
  // Anywhere: the one .direct removal of checklists is deleting a CARD, which
  // removes the card's items itself in the same breath.
  const walk = dir => fs.readdirSync(path.join(__dirname, '..', dir), { withFileTypes: true }).flatMap(e => {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) return ['node_modules', '_build', '.build', '.tools', 'tests'].includes(e.name) ? [] : walk(rel);
    return /\.js$/.test(e.name) ? [rel] : [];
  });
  for (const file of [...walk('client'), ...walk('server'), ...walk('models')]) {
    const src = read(file);
    for (const m of src.matchAll(/Checklists\.direct\.removeAsync\(([^)]*)\)/g)) {
      assert.strictEqual(file, path.join('models', 'cards.js'), `${file}: a checklist removed past the hook`);
      assert.match(m[1], /cardId: doc\._id/);
      assert.match(src, /ChecklistItems\.direct\.removeAsync\(\{ cardId: doc\._id \}\)/);
    }
  }
});

console.log(`\n${passed} tests passed`);
