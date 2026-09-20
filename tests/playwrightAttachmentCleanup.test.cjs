'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { EJSON } = require('bson');
const records = [
  { _id: 'owned', meta: { boardId: 'test-board' } },
  { _id: 'other', meta: { boardId: 'other-board' } },
  { _id: 'unscoped', meta: {} },
];
const sandbox = { module: { exports: {} }, process, __dirname: require('node:path').resolve('tests/playwright/helpers'),
  require(name) {
    if (name !== 'child_process') return require(name);
    return { execFileSync(_node, _args, options) {
      for (const op of EJSON.parse(options.input).ops) {
        if (op.collection !== 'attachments') continue;
        assert.equal(op.method, 'deleteMany');
        assert.deepEqual(Object.keys(op.filter), ['meta.boardId']);
        for (let i = records.length - 1; i >= 0; i--) {
          if (records[i].meta.boardId === op.filter['meta.boardId']) records.splice(i, 1);
        }
      }
      return '{}';
    } };
  },
};
vm.runInNewContext(fs.readFileSync('tests/playwright/helpers/db.js', 'utf8'), sandbox);
sandbox.module.exports.cleanup({ boardIds: ['test-board'] });
assert.deepEqual(records.map(row => row._id), ['other', 'unscoped']);
sandbox.module.exports.cleanup({ boardIds: [] });
assert.equal(records.length, 2);
console.log('Browser fixture cleanup removes owned attachment metadata and preserves other/unscoped records.');
