const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

for (const [collection, timestamp] of [['triggers', 'updatedAt'], ['actions', 'modifiedAt']]) {
  test(`${collection} timestamps support replacement and modifier updates`, () => {
    const vm = require('node:vm');
    const source = fs.readFileSync(path.join(__dirname, `../models/${collection}.js`), 'utf8');
    const hook = source.match(/before\.update\(([^]*?)\n\}\);/)[1];
    const update = vm.runInNewContext(`(${hook}\n})`, { Date });
    const createdAt = new Date('2020-01-01');
    const replacement = { desc: 'Replacement' };
    update(null, { createdAt }, [], replacement);
    assert.equal(replacement.createdAt, createdAt);
    assert.ok(replacement[timestamp] instanceof Date);
    assert.equal(replacement.$set, undefined);
    const modifier = { $unset: { obsolete: '' } };
    update(null, { createdAt }, [], modifier);
    assert.ok(modifier.$set[timestamp] instanceof Date);
    assert.equal(modifier.createdAt, undefined);
    assert.deepEqual(modifier.$unset, { obsolete: '' });
  });
}
