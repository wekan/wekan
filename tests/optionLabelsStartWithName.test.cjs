'use strict';

// #6135 "numbering boards, list, swim caused some issues": a number in front
// of every board, swimlane and list option ("3. My Board") made a board whose
// name starts with a digit hard to read, and broke typing a name's first
// letter to jump to it in a native <select> - with a hundred boards, the way
// people pick one.
//
// It was closed as fixed by fe4d2a56f, which took the number out of the card
// move/copy popups and added a boardOptionLabel() helper that nothing ever
// called. The list move/copy picker, the multi-selection picker and the
// restore-from-archive pickers kept "{{add @index 1}}. {{title}}", so the
// reported fault was still there. Those templates now show the name alone,
// and the unused helper, with its test of code no template ran, is gone.
//
// Run: node tests/optionLabelsStartWithName.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const templates = execFileSync('git', ['ls-files', '--', 'client/*.jade', 'client/*.html', 'packages/*.jade', 'packages/*.html'],
  { cwd: ROOT }).toString().split('\n').filter(f => f && fs.existsSync(path.join(ROOT, f)));

// The text of an option, as it renders: what follows `option(...)` in Jade.
// An index helper (@index, add, increment) before the first name helper is a
// position number in front of the name.
const NUMBERED = /^\s*option\((?:[^()]|\([^()]*\))*\)\s*(?:[^{\s][^{]*)?\{\{[^}]*@index/;

function numberedOptions(files) {
  const out = [];
  for (const file of files) {
    read(file).split('\n').forEach((line, i) => {
      if (NUMBERED.test(line)) out.push(`${file}:${i + 1}: ${line.trim()}`);
    });
  }
  return out;
}

test('the pickers #6135 named show each board, swimlane and list by its name', () => {
  const pickers = {
    'client/components/lists/listHeader.jade': ['listDestinationPicker', 'addListPopup'],
    'client/components/sidebar/sidebarFilters.jade': ['selectionDestinationPicker'],
    'client/components/sidebar/sidebarArchives.jade': ['restoreArchivedCardToListPopup', 'restoreArchivedListToSwimlanePopup'],
  };
  for (const [file, names] of Object.entries(pickers)) {
    const src = read(file);
    for (const name of names) {
      const start = src.indexOf(`template(name="${name}")`);
      assert.ok(start >= 0, `${file} still has ${name}`);
      const end = src.indexOf('\ntemplate(name="', start + 1);
      const options = src.slice(start, end < 0 ? undefined : end).split('\n').filter(l => /^\s*option\(/.test(l));
      assert.ok(options.length > 0, `${name} has options`);
      for (const option of options) {
        assert.match(option, /\)\s*\{\{(?:title|isTitleDefault title)\}\}\s*$/, `${name}: ${option.trim()}`);
      }
    }
  }
});

test('negative: no option anywhere puts a position number before its label', () => {
  assert.deepEqual(numberedOptions(templates), []);
});

test('negative: the detector catches each spelling the pickers used', () => {
  const tmp = path.join(ROOT, '.tools', 'tmp', `option-labels-${process.pid}`);
  fs.mkdirSync(tmp, { recursive: true });
  try {
    const file = path.join(tmp, 'x.jade');
    const rel = path.relative(ROOT, file);
    fs.writeFileSync(file, [
      '  option(value="{{_id}}" selected="{{#if isDialogOptionBoardId _id}}selected{{/if}}") {{add @index 1}}. {{title}}',
      '  option(value="{{_id}}" selected="{{$eq _id currentListIdValue}}") {{increment @index}} {{title}}',
      '  option(value="{{_id}}") {{title}}',
      '  option(value="{{_id}}") {{name}} ({{stateLabel}})',
    ].join('\n'));
    assert.equal(numberedOptions([rel]).length, 2);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('the helpers only those numbers used, and the helper nothing called, are gone', () => {
  const blaze = read('client/config/blazeHelpers.js');
  assert.doesNotMatch(blaze, /registerHelper\('(add|increment)'/);
  assert.ok(!fs.existsSync(path.join(ROOT, 'client/components/boards/boardLabelHelpers.js')));
});

console.log(`\noptionLabelsStartWithName: ${passed} tests passed`);
