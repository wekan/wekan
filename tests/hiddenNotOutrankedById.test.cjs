'use strict';
// #6612 again: `.hidden { display: none }` is a class rule, and an id rule
// that sets `display` outranks it. The attachment slideshow's #zip-viewer and
// #rich-viewer got `display: flex`, so while "hidden" they still showed as two
// empty white boxes beside every PDF, image and video, each taking a third of
// the width - the PDF was 468 px wide in a 1600 px window.
//
// So, everywhere in client/: an element a template marks `#id.hidden` whose id
// rule sets display must also have a `#id.hidden` rule that hides it again.
// Negative: the rule is found missing in a sample that lacks it.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}
const files = walk(path.join(ROOT, 'client'));
const read = f => fs.readFileSync(f, 'utf8');

// Ids a template starts hidden: `#zip-viewer.hidden` or `img#image-viewer.hidden`.
function hiddenIds(jade) {
  return new Set([...jade.matchAll(/(?:^|\s|[a-z])#([A-Za-z][\w-]*)\.hidden\b/gm)].map(m => m[1]));
}
// Ids whose own rule (the id alone, or in a selector list) sets display other than none.
function offenders(css, ids) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const bad = [];
  for (const id of ids) {
    const own = [...text.matchAll(/([^{}]+)\{([^}]*)\}/g)]
      .filter(([, sel]) => sel.split(',').some(s => s.trim() === `#${id}`));
    const shows = own.some(([, , body]) => /(^|;)\s*display\s*:(?!\s*none)/.test(body));
    const hides = [...text.matchAll(/([^{}]+)\{([^}]*)\}/g)]
      .some(([, sel, body]) => sel.split(',').some(s => s.trim() === `#${id}.hidden`) && /display\s*:\s*none/.test(body));
    if (shows && !hides) bad.push(`#${id}`);
  }
  return bad;
}

test('no element a template starts hidden is shown by its own id rule', () => {
  const ids = new Set();
  for (const f of files.filter(f => f.endsWith('.jade'))) for (const id of hiddenIds(read(f))) ids.add(id);
  assert.ok(ids.has('zip-viewer') && ids.has('rich-viewer') && ids.has('pdf-viewer'), 'the slideshow viewers are found');
  const css = files.filter(f => f.endsWith('.css')).map(read).join('\n');
  assert.deepEqual(offenders(css, ids), []);
});

test('negative: an id rule that sets display without its .hidden rule is caught', () => {
  assert.deepEqual(offenders('#a, #b {\n  display: flex;\n}\n#b.hidden { display: none; }', new Set(['a', 'b'])), ['#a']);
  assert.deepEqual(offenders('#a { display: none; }', new Set(['a'])), []);
  assert.deepEqual([...hiddenIds('  object#pdf-viewer.hidden(type="x")\n  #zip-viewer.hidden')].sort(), ['pdf-viewer', 'zip-viewer']);
});
