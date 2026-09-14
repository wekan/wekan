const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
test('Swedish Due Cards labels include future due dates rather than implying overdue only', () => {
  const d = JSON.parse(fs.readFileSync('imports/i18n/data/sv.i18n.json', 'utf8'));
  for (const key of ['dueCards-title', 'dueCardsViewChange-title', 'dueCardsViewChangePopup-title']) {
    assert.match(d[key], /kort med förfallodatum/i);
    assert.doesNotMatch(d[key], /förfallna/i);
  }
  const context = {}; vm.createContext(context);
  vm.runInContext(fs.readFileSync('client/components/main/dueCardsLogic.js', 'utf8').replace(/^export /gm, ''), context);
  const result = context.filterAndSortDueCards([
    { _id: 'future', dueAt: '2099-01-01' }, { _id: 'past', dueAt: '2000-01-01' },
  ], { allUsers: true });
  assert.equal(result.length, 2);
  assert.equal(result[1]._id, 'future');
});
