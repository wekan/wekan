'use strict';

// Plain-Node guard for the WIP-limit popup (#6465, and issue 6533's neighbour in
// the same report). Run: node tests/wipLimitPopup.test.cjs
//
// Two symptoms, one cause: "the checkbox can not be unchecked" and "the counter
// always falls back to 1".
//
// models/lists.js getWipLimit() read the list back through
// `ReactiveCache.getList(this._id)`. On the SERVER that getter is async - it
// returns a PROMISE, and a promise has no `wipLimit` - so the helper answered 0
// for every option, on every call. The `enableWipLimit` method then:
//
//   * saw value 0 and reset the limit to 1 on every click;
//   * saw enabled 0 and called toggleWipLimit(!0) = toggleWipLimit(true), so
//     every click turned the limit ON and none could turn it off.
//
// The document is `this`, so the server needs no lookup. The client keeps the
// lookup, because it is what makes the popup's helpers reactive.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const model = read('models/lists.js');
const serverModel = read('server/models/lists.js');
const client = read('client/components/lists/listHeader.js');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ok -', name);
  } catch (err) {
    console.error(`  FAIL - ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('wipLimitPopup:');

// The helper's body, so the assertions are about IT and not about the file.
function helper() {
  const at = model.indexOf('getWipLimit(option) {');
  assert.notStrictEqual(at, -1, 'getWipLimit must exist');
  return model.slice(at, model.indexOf('\n  },', at));
}

test('the server reads the document it was given, not a promise', () => {
  const body = helper();
  assert.ok(/Meteor\.isServer \? this :/.test(body),
    'on the server the document is `this` - ReactiveCache.getList() is async there');
  assert.ok(/ReactiveCache\.getList\(this\._id\) \|\| this/.test(body),
    'and on the client the reactive lookup stays, so the popup follows the change');
  assert.ok(!/^\s*const list = ReactiveCache\.getList\(this\._id\);\s*$/m.test(body),
    'the unconditional lookup is what returned a promise on the server');
});

test('a toggle is still a toggle, and 0 still becomes 1', () => {
  const at = serverModel.indexOf('async enableWipLimit(listId)');
  assert.notStrictEqual(at, -1, 'the method must exist');
  const method = serverModel.slice(at, serverModel.indexOf('\n  },', at));
  assert.ok(/toggleWipLimit\(!\(await list\.getWipLimit\('enabled'\)\)\)/.test(method),
    'it toggles the stored state - which now IS the stored state');
  assert.ok(/getWipLimit\('value'\)\) === 0/.test(method) && /setWipLimit\(1\)/.test(method),
    'a list with no limit yet starts at 1');
  assert.ok(/hasAdmin\(this\.userId\)/.test(method), 'and only a board admin may do it');
});

test('a limit that is not a usable number never reaches the document', () => {
  // NaN passes `check(limit, Number)` - it IS a number - and the schema then
  // refuses the write with nothing to show the user.
  const at = serverModel.indexOf('async applyWipLimit(listId, limit)');
  const method = serverModel.slice(at, serverModel.indexOf('\n  },', at));
  assert.ok(/!Number\.isFinite\(limit\) \|\| limit < 1/.test(method),
    'the server clamps a non-number / below-one limit to 1');

  const at2 = client.indexOf("'click .wip-limit-apply'");
  const handler = client.slice(at2, client.indexOf('\n  },', at2));
  assert.ok(/!Number\.isFinite\(limit\) \|\| limit < 1 \|\| limit > 99/.test(handler),
    'and the popup says so instead of sending it: the field is min=1 max=99');
  assert.ok(/wip-limit-error/.test(handler), 'by opening the error popup it already has');
});

console.log(`\n${passed} tests passed`);
