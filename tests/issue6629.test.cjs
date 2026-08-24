'use strict';

// Regression coverage for #6629.
// Run: node tests/issue6629.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

(async () => {
  const { tableViewCardsSelector } =
    await import('../models/lib/tableViewFilter.js');

  assert.deepStrictEqual(
    tableViewCardsSelector('board-a'),
    { boardId: 'board-a', archived: false },
  );

  const filter = {
    $or: [
      { _id: { $in: [] } },
      { labelIds: { $in: ['label-a'] } },
    ],
  };
  assert.deepStrictEqual(tableViewCardsSelector('board-a', filter), {
    $and: [filter, { boardId: 'board-a', archived: false }],
  });

  const root = path.join(__dirname, '..');
  const js = fs.readFileSync(
    path.join(root, 'client/components/boards/tableView.js'),
    'utf8',
  );
  assert.ok(/Filter\.isActive\(\)/.test(js));
  assert.ok(/Filter\._getMongoSelector\(\)/.test(js));
  assert.ok(/tableViewCardsSelector\(board\._id, filterSelector\)/.test(js));
  assert.ok(/ReactiveCache\.getCards\(/.test(js));
  assert.ok(!/board\.cards\(\)\.forEach/.test(js));

  console.log('issue6629: all tests passed');
})();
