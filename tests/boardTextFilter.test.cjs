'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
test('text filtering combines with existing constraints and survives board navigation until reset', async () => {
  const { register } = require('node:module');
  const { pathToFileURL } = require('node:url');
  const path = require('node:path');
  register(pathToFileURL(path.join(__dirname, 'helpers/meteorStubLoader.mjs')), pathToFileURL(__filename));
  const { Filter } = await import('../client/lib/filter.js');
  Filter.reset(); Filter.text.set('needle');
  assert.equal(Filter.isActive(), true);
  assert.deepEqual(Filter._getMongoSelector(), { _id: { $in: ['needle'] } });
  Filter.labelIds.add('red');
  assert.equal(Filter._getMongoSelector().$and.length, 2);
  Filter.resetBoardScoped();
  assert.equal(Filter.text.value(), 'needle');
  Filter.reset(); assert.equal(Filter.isActive(), false);
});
