'use strict';

// wekan/wekan#2419: "Add support for markdown checkbox syntax" - a card
// description/comment containing GFM task-list syntax ("- [ ] Task") rendered
// as literal HTML text (`<input disable="" type="checkbox"/> Task`) instead of
// a real checkbox, because plain markdown-it (WeKan's renderer, see
// packages/markdown/src/template-integration.js) has no task-list extension
// and never emitted an <input> element in the first place - so there was
// nothing for the sanitizer to keep.
//
// This suite runs the real markdown-it from node_modules with WeKan's own
// options AND its task-list core rule (extracted from the package source,
// which imports Meteor and cannot be required directly here - the same
// technique tests/markdownCustomUrlSchemes.test.cjs already uses), so it
// proves the fix against the shipped renderer configuration rather than a
// description of it. It also checks packages/markdown/src/secureDOMPurify.js
// still allows the <input type="checkbox"> through (as a restricted,
// checkbox-only element) rather than stripping it back out.
//
// Run: node tests/markdownTaskListCheckbox.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const source = fs.readFileSync(
  path.join(repoRoot, 'packages/markdown/src/template-integration.js'), 'utf8');
const purifySource = fs.readFileSync(
  path.join(repoRoot, 'packages/markdown/src/secureDOMPurify.js'), 'utf8');

let passed = 0;
const queued = [];
function test(name, fn) { queued.push([name, fn]); }

console.log('markdownTaskListCheckbox:');

// Pull the task-list plugin registration (`Markdown.use(function(md) {...})`)
// out of the package source and apply it to a fresh markdown-it instance, the
// same way the package applies it to its own `Markdown` singleton.
function extractTaskListPlugin() {
  const marker = "Markdown.use(function(md) {\n  md.core.ruler.push('task-lists'";
  const start = source.indexOf(marker);
  assert.notStrictEqual(start, -1, 'the task-list plugin registration is gone');
  const fnStart = source.indexOf('function(md)', start);
  const open = source.indexOf('{', fnStart);
  let depth = 0;
  let end = -1;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') { depth -= 1; if (depth === 0) { end = i + 1; break; } }
  }
  const reStart = source.indexOf('const TASK_LIST_ITEM_RE');
  const reEnd = source.indexOf('\n', reStart) + 1;
  const preamble = source.slice(reStart, reEnd);
  const ctx = { module: { exports: {} } };
  vm.createContext(ctx);
  vm.runInContext(
    `${preamble}\nmodule.exports = ${source.slice(fnStart, end)};`, ctx);
  return ctx.module.exports;
}
const taskListPlugin = extractTaskListPlugin();

async function renderer() {
  const { default: MarkdownIt } = await import('markdown-it');
  const md = new MarkdownIt({ html: true, linkify: true, typographer: true, breaks: true });
  md.use(taskListPlugin);
  return md;
}

test('"- [ ] Task" renders a real, unchecked <input type="checkbox">', async () => {
  const md = await renderer();
  const rendered = md.render('- [ ] Task');
  assert.match(rendered, /<input type="checkbox" disabled="disabled">/,
    'expected an unchecked, disabled checkbox element');
  assert.ok(!/checked="checked"/.test(rendered), 'an unchecked item must not be checked');
  assert.match(rendered, />\s*Task/, 'the task text must still be there');
  assert.ok(!/\[\s?\]/.test(rendered), 'the literal "[ ]" source markup must not leak into the output');
});

test('"- [x] Done" renders a real, CHECKED <input type="checkbox">', async () => {
  const md = await renderer();
  const rendered = md.render('- [x] Done');
  assert.match(rendered, /<input type="checkbox" disabled="disabled" checked="checked">/,
    'expected a checked, disabled checkbox element');
  assert.match(rendered, />\s*Done/, 'the task text must still be there');
  assert.ok(!/\[x\]/i.test(rendered), 'the literal "[x]" source markup must not leak into the output');
});

test('uppercase "[X]" is treated as checked too', async () => {
  const md = await renderer();
  const rendered = md.render('- [X] Done');
  assert.match(rendered, /checked="checked"/);
});

test('a multi-item task list renders one checkbox per item', async () => {
  const md = await renderer();
  const rendered = md.render('- [ ] First\n- [x] Second\n- [ ] Third');
  const inputs = rendered.match(/<input type="checkbox"[^>]*>/g) || [];
  assert.strictEqual(inputs.length, 3, 'expected three checkboxes, one per list item');
  assert.strictEqual((rendered.match(/checked="checked"/g) || []).length, 1,
    'exactly the second item is checked');
});

test('an ordinary bullet list is unaffected (negative)', async () => {
  const md = await renderer();
  const rendered = md.render('- Apples\n- Oranges');
  assert.ok(!/<input/.test(rendered), 'a plain list must not grow checkboxes');
  assert.match(rendered, /Apples/);
  assert.match(rendered, /Oranges/);
});

test('other markdown syntax renders unaffected (negative)', async () => {
  const md = await renderer();
  const rendered = md.render('**bold** and *italic* and `code` and [a link](https://wekan.fi)');
  assert.ok(!/<input/.test(rendered), 'ordinary inline markdown must not grow a checkbox');
  assert.match(rendered, /<strong>bold<\/strong>/);
  assert.match(rendered, /<em>italic<\/em>/);
  assert.match(rendered, /<code>code<\/code>/);
  assert.match(rendered, /href="https:\/\/wekan\.fi"/);
});

test('text that merely contains literal "[ ] " mid-sentence is left alone (negative)', async () => {
  const md = await renderer();
  // Only the FIRST text of a list item is a task marker - matching GFM/GitHub
  // behaviour, this must not rewrite "[ ]" appearing elsewhere in a line.
  const rendered = md.render('This sentence has [ ] brackets in the middle, not at the start.');
  assert.ok(!/<input/.test(rendered), 'a mid-sentence "[ ]" is not a task-list marker');
});

test('secureDOMPurify allows the checkbox <input> through, restricted to checkbox-only', () => {
  assert.match(purifySource, /ALLOWED_TAGS:[^\n]*'input'/,
    'input must be in the allow-list so the rendered checkbox survives sanitization');
  assert.match(purifySource, /ALLOWED_ATTR:[^\n]*'type'/);
  assert.match(purifySource, /ALLOWED_ATTR:[^\n]*'checked'/);
  assert.match(purifySource, /ALLOWED_ATTR:[^\n]*'disabled'/);
  // 'input' must not still be in the FORBID_TAGS deny-list (that would negate
  // the allow-list above and strip the checkbox right back out).
  const forbidLine = purifySource.slice(
    purifySource.indexOf('FORBID_TAGS:'), purifySource.indexOf('FORBID_ATTR:'));
  assert.ok(!/'input'/.test(forbidLine), 'input must not be forbidden any more');
  // And the hook that restricts it to a bare checkbox (no name/value/form) is present.
  assert.match(purifySource, /type !== 'checkbox'/,
    'a non-checkbox input type must still be rejected');
});

(async () => {
  for (const [name, fn] of queued) { await fn(); passed += 1; console.log('  ok -', name); }
  console.log(`\nmarkdownTaskListCheckbox: ${passed} tests passed`);
})().catch(e => { console.error(e); process.exit(1); });
