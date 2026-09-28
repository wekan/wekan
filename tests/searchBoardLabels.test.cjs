'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../server/publications/cards.js'), 'utf8');
const block = source.slice(source.indexOf('    if (queryParams.hasOperator(OPERATOR_LABEL))'),
  source.indexOf('    if (queryParams.hasOperator(OPERATOR_HAS))'));
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const run = new AsyncFunction('queryParams', 'Boards', 'userId', 'errors', 'escapeForRegex',
  'OPERATOR_LABEL', 'selector', `${block}\nreturn selector;`);

async function select(labels) {
  const boards = [
    { _id: 'one', labels: [{ _id: 'shared', color: 'red', name: 'Urgent' }] },
    { _id: 'two', labels: [{ _id: 'shared', color: 'blue', name: 'Routine' }] },
    { _id: 'three', labels: [{ _id: 'other', color: 'red', name: 'Urgent' }] },
  ];
  const errors = [];
  const selector = await run({ hasOperator: () => true, getPredicates: () => labels }, {
    async userBoards(userId, ignored, query) {
      assert.equal(userId, 'reader');
      const match = query.labels.$elemMatch;
      return boards.filter(board => board.labels.some(label => match.color
        ? label.color === match.color : match.name.test(label.name)));
    },
  }, 'reader', { addNotFound: (...error) => errors.push(error) },
  text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'label', { $and: [] });
  return { selector, errors };
}

test('label colors and names remain paired with their owning boards', async () => {
  for (const term of ['red', 'Urgent']) {
    const { selector, errors } = await select([term]);
    assert.deepEqual(selector, { $and: [{ $or: [
      { boardId: 'one', labelIds: 'shared' }, { boardId: 'three', labelIds: 'other' },
    ] }] });
    assert.deepEqual(errors, []);
  }
});

test('a missing label matches nothing; numeric terms retain their card-number alternative', async () => {
  const missing = await select(['unavailable']);
  assert.deepEqual(missing.selector, { $and: [{ _id: { $in: [] } }] });
  assert.equal(missing.errors.length, 1);
  const number = await select(['12']);
  assert.deepEqual(number.selector, { $and: [{ cardNumber: { $in: [12] } }] });
  assert.deepEqual(number.errors, []);
  const combined = await select(['red', '12']);
  assert.deepEqual(combined.selector.$and[0].$or[1], { cardNumber: { $in: [12] } });
});
