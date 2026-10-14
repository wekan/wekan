'use strict';

// #337: a link or button whose only content is an icon says nothing to a
// screen reader unless it has a name. client/lib/accessibility.js copies a
// control's title into aria-label, so every icon-only control in the
// templates needs a title (or an aria-label of its own).
// Run: node tests/iconOnlyControlLabels.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

function jadeFiles(dir, out = []) {
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) jadeFiles(rel, out);
    else if (entry.name.endsWith('.jade')) out.push(rel);
  }
  return out;
}

const indent = line => line.length - line.trimStart().length;
const NAMED = /\btitle=|aria-label=/;

// `a` or `button` with only `i.fa...` icon lines (and comments) under it.
function unlabelled(source) {
  const lines = source.split('\n');
  const found = [];
  lines.forEach((line, i) => {
    const head = line.trim();
    if (!/^(a|button)([.#(][^\s]*?(\(.*\))?)?$/.test(head) || NAMED.test(head)) return;
    const children = [];
    for (let j = i + 1; j < lines.length && (!lines[j].trim() || indent(lines[j]) > indent(line)); j++) {
      if (lines[j].trim()) children.push(lines[j].trim());
    }
    const iconOnly = children.length > 0 && children.every(c => /^i\.fa/.test(c) || c.startsWith('//'));
    if (iconOnly && !children.some(c => NAMED.test(c))) found.push(i + 1);
  });
  return found;
}

// The scanner itself (positive and negative).
assert.deepEqual(unlabelled('a.js-x\n  i.fa.fa-times'), [1]);
assert.deepEqual(unlabelled('a.js-x(class="{{#if y}}z{{/if}}")\n  i.fa.fa-times'), [1], 'with attributes');
assert.deepEqual(unlabelled("a.js-x(title=\"{{_ 'close'}}\")\n  i.fa.fa-times"), []);
assert.deepEqual(unlabelled("a.js-x\n  i.fa.fa-times(aria-label=\"{{_ 'close'}}\")"), []);
assert.deepEqual(unlabelled('a.js-x\n  i.fa.fa-times\n  | {{_ \'close\'}}'), [], 'visible text is a name');
console.log('  ok - the scanner');

const offenders = [];
for (const file of jadeFiles('client')) {
  for (const line of unlabelled(fs.readFileSync(path.join(ROOT, file), 'utf8'))) offenders.push(`${file}:${line}`);
}
assert.deepEqual(offenders, [], 'give each a title="{{_ \'...\'}}"');
console.log('  ok - every icon-only link and button in the templates has a name');

// Every image in the templates has alt text; the attachment viewer's is the
// file's name once a picture is shown.
const imgOffenders = [];
for (const file of jadeFiles('client')) {
  fs.readFileSync(path.join(ROOT, file), 'utf8').split('\n').forEach((line, i) => {
    const t = line.trim();
    if (/^img([.#(]|$)/.test(t) && !/\balt=/.test(t)) imgOffenders.push(`${file}:${i + 1}`);
  });
}
assert.deepEqual(imgOffenders, [], 'every img has alt text');
assert.match(fs.readFileSync(path.join(ROOT, 'client/components/cards/attachments.js'), 'utf8'),
  /if \(attachment\.name\) \$\("#image-viewer"\)\.attr\("alt", attachment\.name\);/);
console.log('  ok - every image has alt text');

// And the title still becomes the accessible name.
const a11y = fs.readFileSync(path.join(ROOT, 'client/lib/accessibility.js'), 'utf8');
assert.match(a11y, /HTML\.A = \(attributes, \.\.\.others\) => \{\s*return superA\(copyTitleInAriaLabel\(enforceHref\(attributes\)\), \.\.\.others\);/);
assert.match(a11y, /attributes\['aria-label'\] = attributes\.title;/);
console.log('  ok - title is copied into aria-label');
console.log('\niconOnlyControlLabels: all tests passed');
