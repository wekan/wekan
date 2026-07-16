'use strict';

// Plain-Node unit test (no Meteor) for issue #6459: the card "More" menu
// rendered completely empty (no Delete option).
// Run: node tests/htmljsArrayContent.test.cjs
//
// Root cause: a WeKan-local vm-sandbox patch in the vendored jade compiler's
// htmljs made isConstructedObject(Array) return false (upstream htmljs returns
// true), so the HTML.Tag constructor took an ARRAY first argument — the
// compiled form of a tag with multi-part inline text like
// `label {{_ 'source-board'}}:` (a [TemplateTag, ":"] array) — as the tag's
// ATTRIBUTES dictionary instead of its content. At runtime Blaze then found a
// template view object inside the attributes and threw "The basic
// TransformingVisitor does not support foreign objects in attributes",
// killing the whole cardMorePopup render.
//
// The fix makes the Tag constructor treat an array first argument as content
// (like upstream), while keeping the vm-sandbox patch's answer for
// isConstructedObject(Array) itself (flattenAttributes depends on it).

const assert = require('assert');

// The vendored file is a sloppy-mode IIFE that publishes onto a `Package`
// global (creating it when missing) — exactly how the jade loader consumes it.
require('../npm-packages/meteor-jade-loader/lib/vendor/htmljs.js');
const HTML = global.Package.htmljs.HTML;

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- POSITIVE: #6459 — an array first argument is tag CONTENT ---------------

test('array first argument becomes children, not attrs (the #6459 crash)', () => {
  // Compiled shape of `label {{_ 'source-board'}}:` — inline text that is an
  // array of [something-view-like, ':'].
  const viewLike = { foo: 'templateTagPlaceholder' };
  const tag = HTML.LABEL([viewLike, ':'], HTML.SELECT());
  assert.strictEqual(tag.attrs, null, 'attrs must stay empty (prototype default)');
  assert.strictEqual(tag.children.length, 2);
  assert.ok(Array.isArray(tag.children[0]), 'first child is the inline-text array');
  assert.strictEqual(tag.children[0][1], ':');
});

test('array-only tag keeps its content renderable', () => {
  const tag = HTML.LABEL(['a', 'b']);
  assert.strictEqual(tag.attrs, null);
  assert.deepStrictEqual(tag.children[0], ['a', 'b']);
});

// --- NEGATIVE: everything that must keep working exactly as before ----------

test('plain object first argument is still the attributes dictionary', () => {
  const tag = HTML.LABEL({ class: 'nice' }, 'text');
  assert.deepStrictEqual(tag.attrs, { class: 'nice' });
  assert.deepStrictEqual(tag.children, ['text']);
});

test('HTML.Attrs first argument is still unwrapped into attrs', () => {
  const tag = HTML.LABEL(HTML.Attrs({ id: 'x' }), 'text');
  assert.deepStrictEqual(tag.attrs, { id: 'x' });
  assert.deepStrictEqual(tag.children, ['text']);
});

test('a constructed object (another tag) first argument is content', () => {
  const inner = HTML.SPAN('y');
  const tag = HTML.LABEL(inner, 'text');
  assert.strictEqual(tag.attrs, null);
  assert.strictEqual(tag.children[0], inner);
});

test('vm-sandbox patch stays: isConstructedObject(Array) is false', () => {
  // flattenAttributes relies on arrays NOT being "constructed objects"; only
  // the Tag constructor needed the array special-case.
  assert.strictEqual(HTML.isConstructedObject([1, 2]), false);
});

test('no-argument tags still work', () => {
  const tag = HTML.LABEL();
  assert.strictEqual(tag.attrs, null);
  assert.strictEqual(tag.children.length, 0);
});

console.log(`\n${passed} tests passed`);
