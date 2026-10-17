'use strict';

// "or Template or link a list from another board": the add-list form offers its
// alternatives as one span.quiet each in .edit-controls, which is a flex row.
// A flex item drops the space its text begins with, so the second "or" lost the
// space before it and read "Templateor". The gap is a margin between adjacent
// .quiet spans (forms.css) rather than a space the layout throws away.
//
// Run: node tests/editControlsOrSpacing.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('editControlsOrSpacing:');

test('the add-list form offers Template and the link as two adjacent spans', () => {
  const jade = read('client/components/swimlanes/swimlanes.jade');
  assert.match(jade, /span\.quiet\n\s*\| \{\{_ 'or'\}\}\n\s*a\.js-list-template/);
  assert.match(jade, /span\.quiet\n\s*\|\s+\{\{_ 'or'\}\}\n\s*a\.js-link-list/);
});

test('the controls row is flex, and adjacent alternatives get a margin between them', () => {
  const css = read('client/components/forms/forms.css').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.match(css, /\.edit-controls,\n\.add-controls \{\n\s*display: flex;/, 'the reason a leading space is lost');
  assert.match(css, /\.edit-controls > \.quiet \+ \.quiet,\n\.add-controls > \.quiet \+ \.quiet \{\n\s*margin-inline-start: 0\.3em;/);
});

console.log(`\neditControlsOrSpacing: ${passed} tests passed`);
