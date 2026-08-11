'use strict';

// NoSQL injection detection, and the canaries that report an attempt
// (design: docs/Security/Remediation/WeKan.md §12.6).
//
// Two shapes, and they are different problems:
//
//   EXECUTION - a client-supplied selector carrying $where / $function /
//               $accumulator / $out / $merge. A selector is data; these turn it
//               into code the DATABASE runs.
//   OPERATOR  - {"$ne": null} or {"$gt": ""} where the string a user typed
//               belongs. This is how "match every row" is spelled in a document
//               database, and it needs no JavaScript at all.
//
// The hard part of a detector like this is NOT catching the attacks. It is not
// firing on ordinary traffic: a security report that cries wolf on every search
// is a report nobody reads, so most of what follows is the negative half.
//
// Run: node tests/injectionDetect.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const {
  executionOperatorsIn,
  isOperatorObject,
  classifyScalarParam,
  classifySelector,
  injectionDetail,
} = require('../models/lib/injectionDetect');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// ------------------------------------------------------------- the attacks

test('server-side JavaScript is found wherever it hides', () => {
  assert.deepStrictEqual(executionOperatorsIn({ $where: 'this.x' }), ['$where']);
  assert.deepStrictEqual(executionOperatorsIn({ a: { b: { $where: '1' } } }), ['$where']);
  assert.deepStrictEqual(executionOperatorsIn({ $or: [{ x: 1 }, { $where: '1' }] }), ['$where']);
  assert.deepStrictEqual(
    executionOperatorsIn({ $expr: { $function: { body: 'f' } } }),
    ['$function'],
  );
  assert.deepStrictEqual(executionOperatorsIn({ $accumulator: {} }), ['$accumulator']);
});

test('an aggregation that writes somewhere is found too', () => {
  assert.deepStrictEqual(executionOperatorsIn([{ $match: {} }, { $out: 'stolen' }]), ['$out']);
  assert.deepStrictEqual(executionOperatorsIn([{ $merge: { into: 'x' } }]), ['$merge']);
});

test('THE CLASSIC: an operator object where a value was expected', () => {
  // The login-bypass shape, and its relatives.
  [{ $ne: null }, { $gt: '' }, { $regex: '.*' }, { $exists: true }, { $in: ['a', 'b'] }]
    .forEach(payload => {
      const verdict = classifyScalarParam(payload);
      assert.strictEqual(verdict.injection, true, JSON.stringify(payload));
      assert.strictEqual(verdict.kind, 'operator');
      assert.ok(verdict.operators.length >= 1);
    });
});

test('an execution operator in a scalar position is reported as execution', () => {
  const verdict = classifyScalarParam({ $where: 'true' });
  assert.strictEqual(verdict.kind, 'execution', 'the worse of the two names the event');
});

test('a selector is only an attack when it can EXECUTE something', () => {
  // Comparison operators are what a selector is made of - flagging them would
  // flag every query WeKan itself builds.
  assert.strictEqual(classifySelector({ boardId: 'b1', archived: false }).injection, false);
  assert.strictEqual(classifySelector({ sort: { $gt: 5 } }).injection, false);
  assert.strictEqual(classifySelector({ $or: [{ a: 1 }, { b: 2 }] }).injection, false);
  assert.strictEqual(classifySelector({ $where: '1' }).injection, true);
});

// ------------------------------------------------------------ the negatives

test('negative: an ordinary typed value is never an injection', () => {
  ['hello', '', 'a title with $ in it', '$where', 42, 0, true, false, null, undefined]
    .forEach(v => assert.strictEqual(classifyScalarParam(v).injection, false, String(v)));
});

test('negative: a $ inside a STRING is text, not an operator', () => {
  // A card titled "$100 refund" must not put anybody in the security report.
  assert.strictEqual(classifyScalarParam('$100 refund').injection, false);
  assert.strictEqual(classifySelector({ title: '$where' }).injection, false);
  assert.strictEqual(classifySelector({ title: { $regex: '\\$ne' } }).injection, false);
});

test('negative: a plain object is a type error, not an attack', () => {
  // Somebody sending the wrong shape is a validation problem. Calling it an
  // attack would fill the report with noise and hide the real ones.
  assert.strictEqual(isOperatorObject({ title: 'x' }), false);
  assert.strictEqual(isOperatorObject({ $ne: null, title: 'x' }), false,
    'EVERY key must be an operator, or it is somebody sending a document');
  assert.strictEqual(isOperatorObject({}), false);
  assert.strictEqual(isOperatorObject([]), false);
  assert.strictEqual(isOperatorObject([{ $ne: 1 }]), false);
  assert.strictEqual(isOperatorObject(null), false);
  assert.strictEqual(isOperatorObject('$ne'), false);
});

test('negative: the walk is depth-bounded, so a nested payload cannot burn CPU', () => {
  let deep = { $where: 'x' };
  for (let i = 0; i < 200; i++) deep = { a: deep };
  const started = Date.now();
  const found = executionOperatorsIn(deep);
  assert.ok(Date.now() - started < 500, 'must not walk an arbitrarily deep tree');
  assert.deepStrictEqual(found, [], 'and below the limit it simply reports nothing');
});

test('negative: cycles and exotic values do not throw', () => {
  const cyclic = { a: 1 };
  cyclic.self = cyclic;
  assert.doesNotThrow(() => executionOperatorsIn(cyclic));
  assert.doesNotThrow(() => classifyScalarParam(new Date()));
  assert.doesNotThrow(() => classifySelector(Symbol('x')));
});

// -------------------------------------------------------------- the report

test('the detail names the operators and nothing else', () => {
  const detail = injectionDetail(classifyScalarParam({ $ne: null }), 'username');
  assert.ok(detail.includes('$ne'));
  assert.ok(detail.includes('username'));
  // The VALUE is attacker-controlled and has no business in the log.
  assert.ok(!detail.includes('null') || detail.indexOf('null') > detail.indexOf('$ne'));
  assert.ok(detail.length < 160);
});

// ---------------------------------------------------------------- the wiring

test('the windowed card publication trips a canary on an injected selector', () => {
  // GHSA-phm4-4v26-j2vq moved selectorIsInjection out of this publication and into
  // /server/lib/selectorGuard, because eight OTHER handlers took the same
  // client-supplied selector and never called it. The publication's behaviour is
  // unchanged - it imports the same function - so what is pinned here is that the
  // definition exists in one place and that both refusal sites still use it.
  const src = read('server/publications/cardsWindow.js');
  const guard = read('server/lib/selectorGuard.js');
  assert.ok(/function selectorIsInjection\(selector, where\)/.test(guard),
    'the one definition lives in the shared guard now');
  assert.ok(/import \{ selectorIsInjection \} from '\/server\/lib\/selectorGuard'/.test(src),
    'and the publication imports it rather than keeping a copy');
  assert.ok(/tripCanary\('injection\.nosql-selector'/.test(guard));
  // Both refusal sites go through it.
  const uses = src.match(/selectorIsInjection\(cardSelector, '/g) || [];
  assert.strictEqual(uses.length, 2, 'the window AND the count');
});

test('SILENT: the publication still answers exactly as before', () => {
  const src = read('server/publications/cardsWindow.js');
  // An injected selector still becomes the empty result / a ready() - the
  // caller cannot tell the canary is there.
  assert.ok(/\? \{ _id: \{ \$in: \[\] \} \}/.test(src));
  assert.ok(/if \(!board \|\| selectorIsInjection\(cardSelector, 'boardCardsCount'\)\) \{\s*\n\s*return this\.ready\(\);/.test(src));
  const guard = read('server/lib/selectorGuard.js');
  assert.ok(/return true;/.test(guard.match(/function selectorIsInjection[\s\S]*?\n\}/)[0]),
    'and it returns the same boolean hasWhere() did');
});

test('the old $where-only check is still honoured, not replaced', () => {
  // Looked for in the shared guard now (GHSA-phm4-4v26-j2vq moved the function
  // there); the point is unchanged - hasWhere is the narrower, older check and the
  // widened classifier must not quietly replace it.
  const guard = read('server/lib/selectorGuard.js');
  assert.ok(/hasWhere\(selector\)/.test(guard),
    'the narrower existing guard stays: a widened detector must not lose a case');
});

// ----------------------------------------------- SQL: the database reports it

test('the SQL guard marks its refusal so the attempt reaches the admin', () => {
  const go = path.join(repoRoot, '.tools/FerretDB/internal/util/sqlguard/sqlguard.go');
  if (!fs.existsSync(go)) {
    console.log('  -- .tools/FerretDB not cloned; skipping the Go side');
    return;
  }
  const src = fs.readFileSync(go, 'utf8');
  assert.ok(/canary:db\.sql-injection/.test(src),
    'a refused statement must carry the marker, or nobody is told');
  assert.ok(!/wekan/i.test(src), 'no application name in a FerretDB source file');
});

test('WeKan turns that marker into its own canary, not a database problem', () => {
  const src = read('server/lib/databaseProblems.js');
  assert.ok(/'db\.sql-injection':/.test(src), 'the id is known');
  assert.ok(/id === 'db\.sql-injection' \? 'injection\.sql-statement'/.test(src),
    'and gets its own canary id, so the report distinguishes it at a glance');
});

console.log(`\n${passed} tests passed`);
