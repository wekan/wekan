// Every Meteor method checks its arguments BEFORE it decides who may call it.
//
// Meteor audits that each argument passed to a method was handed to `check()`.
// A method that returns early - for a signed-out caller, say - before reaching
// its `check()` calls therefore does not answer at all: it throws
//
//   Did not check() all arguments during call to '<name>'
//
// which reaches the client as a failed method rather than as the "0" or the
// empty answer the early return meant to give.
//
// That is exactly what `getArchivedBoardsCount` did. It had been correct in
// practice for as long as its only caller was the archive page, which asks
// after its subscription is ready and so always has a user; All Boards began
// asking from `onCreated`, which can run before the user is established, and
// the latent bug became a console error on every load.
//
// Validating the SHAPE of what you were given before deciding whether the
// caller may have it is the right order regardless - a malformed argument is
// malformed whoever sent it.
//
// Run: node tests/methodArgumentChecks.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
const tests = [];
function test(name, fn) { tests.push([name, fn]); }

// The server files that define Meteor methods taking arguments.
const FILES = [
  'server/publications/boards.js',
];

// One method body: from `async name(args) {` to the line that closes it at the
// same indent. Comments are stripped, because a comment that mentions `check(`
// or `return` is prose about the code and not the code.
function methodBodies(src) {
  const out = [];
  const code = src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of code.matchAll(/^ {2}(?:async )?(\w+)\(([^)]*)\) \{\n([\s\S]*?)^ {2}\},$/gm)) {
    out.push({ name: m[1], args: m[2].trim(), body: m[3] });
  }
  return out;
}

console.log('methodArgumentChecks:');

test('a method checks its arguments before it returns for anyone', () => {
  let examined = 0;
  for (const file of FILES) {
    for (const method of methodBodies(read(file))) {
      // Only methods that take arguments AND check them are in scope: one with
      // no arguments has nothing to audit.
      if (!method.args) continue;
      const checkAt = method.body.indexOf('check(');
      if (checkAt === -1) continue;
      examined += 1;

      // An early `return` before the first check() is the bug. `return` inside
      // a nested function is not an early exit from the method, so only
      // top-level ones count - those at the method's own indent.
      const before = method.body.slice(0, checkAt);
      const earlyReturn = /^ {4}(?:if \([^)]*\) )?return\b/m.exec(before);
      assert.strictEqual(earlyReturn, null,
        `${file}: ${method.name}() returns before check() - Meteor will throw `
        + `"Did not check() all arguments" instead of returning that value`);
    }
  }
  assert.ok(examined > 0, 'the scan must actually find methods to examine');
});

test('and getArchivedBoardsCount specifically, which is the one that broke', () => {
  const src = read('server/publications/boards.js');
  const at = src.indexOf('async getArchivedBoardsCount(');
  assert.notStrictEqual(at, -1, 'the method exists');
  const body = src.slice(at, src.indexOf('\n  },', at)).replace(/\/\/.*$/gm, '');
  const checkAt = body.indexOf('check(searchTerm');
  const authAt = body.indexOf('Match.test(this.userId');
  assert.notStrictEqual(checkAt, -1, 'it checks its argument');
  assert.notStrictEqual(authAt, -1, 'and it authorises the caller');
  assert.ok(checkAt < authAt,
    'the check must come first, or a signed-out caller gets a thrown method '
    + 'instead of the 0 the early return promises');
});

test('and its caller asks in a way that survives being early', () => {
  // All Boards asks from onCreated, which can run before the user is
  // established - that timing is what exposed the bug, and it is legitimate:
  // the count is wanted as soon as the page exists.
  const js = read('client/components/boards/boardsList.js');
  const at = js.indexOf("Meteor.call('getArchivedBoardsCount'");
  assert.notStrictEqual(at, -1, 'All Boards asks for the count');
  const call = js.slice(at, at + 200);
  assert.ok(/\(err, count\) =>/.test(call), 'with a callback, so a failure is not silent');
  assert.ok(/if \(!err\)/.test(call),
    'and it only trusts the answer when there was no error');
});

for (const [name, fn] of tests) {
  try { fn(); passed++; console.log('  ok -', name); }
  catch (err) { console.error(`  FAIL - ${name}\n    ${err.message}`); process.exitCode = 1; }
}
console.log(`\nmethodArgumentChecks: ${passed} tests passed`);
