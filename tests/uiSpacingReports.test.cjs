'use strict';

// #6465, the screenshots in
// https://github.com/wekan/wekan/issues/6465#issuecomment-5187985815 - five
// separate places where a control had drifted away from the thing it belongs to.
// The comment is images only, with the fault circled in each; what they showed:
//
//   1. "Checkbox is misplaced"  - Admin Panel people table, the select-all box
//      sitting on top of the "all users" heading it labels.
//   2. "Please move the button down. This is too close ... panic ;-)" - the
//      backup schedule's Save button directly under the 1..28 day buttons.
//   3. "The alignment is out of place" - Admin Panel attachments, the move
//      button against the labelled selects beside it.
//   4. "This checkbox is crazy" - Member settings, the rescue-card-description
//      box drifted up beside the "Card settings" heading instead of its label.
//   5. "(2/5) <-- move this up here" and "Make this same height as the lanes
//      left and right" - the WIP counter on a second line under the list title,
//      which also made that list's header taller than its neighbours'.
//
// Four of the five have one cause each in the markup or CSS, and that is what is
// pinned here. Number 3 is normalisation only - see its test.
//
// Run: node tests/uiSpacingReports.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(ROOT, rel));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// Jade comments (//-) quote the old markup on purpose.
const jadeCode = src => src.replace(/^\s*\/\/-.*$/gm, '');
const cssCode = src => src.replace(/\/\*[\s\S]*?\*\//g, '');

console.log('uiSpacingReports:');

test('1. the select-all checkbox and its word are one label', () => {
  const jade = jadeCode(read('client/components/settings/peopleBody.jade'));
  const at = jade.indexOf('template(name="selectAllUser")');
  assert.notStrictEqual(at, -1, 'the selectAllUser template must be there');
  const tpl = jade.slice(at, jade.indexOf('template(name=', at + 10));
  assert.ok(/label\.select-all-user\(for="chkSelectAll"\)/.test(tpl),
    'a <label for> ties the two together - loose inline nodes in a centred '
    + 'heading cell are what let the box land on the word');
  assert.ok(tpl.indexOf('label.select-all-user') < tpl.indexOf('input.allUserChkBox'),
    'and the input lives inside it');

  // The CSS that keeps them apart. Either file may hold it; what matters is the
  // rule exists with a gap that cannot collapse.
  const css = ['client/components/settings/peopleBody.css',
    'client/components/settings/settingBody.css']
    .filter(exists).map(read).join('\n');
  const rule = /\.select-all-user\s*\{([^}]*)\}/.exec(cssCode(css));
  assert.ok(rule, '.select-all-user must be styled');
  assert.ok(/display:\s*inline-flex/.test(rule[1]), 'as one row');
  assert.ok(/gap:\s*\d/.test(rule[1]), 'with a real gap between word and box');
});

test('2. the backup Save button is not against the day buttons', () => {
  const css = cssCode(read('client/components/settings/attachments.css'));
  const rule = /\.schedule-day-buttons \+ \.form-group[^{]*\{([^}]*)\}/.exec(css);
  assert.ok(rule, 'the group that FOLLOWS the day grid needs the gap - putting it '
    + 'on the button would space it everywhere the button is used');
  const margin = /margin-top:\s*(\d+)px/.exec(rule[1]);
  assert.ok(margin && Number(margin[1]) >= 12,
    `margin-top: ${margin && margin[1]}px is still close enough to hit Save while `
    + 'aiming for a date');
});

test('3. the move button carries no margin of its own', () => {
  // Normalisation, not a measured fix: the row is align-items: flex-end, so a
  // margin on the button offsets it from the controls it acts on. Whether that
  // was the whole of what the reporter circled needs a browser - this removes
  // the one thing in the CSS that could shift it.
  const css = cssCode(read('client/components/settings/attachments.css'));
  const rule = /\.move-storage-form > button\s*\{([^}]*)\}/.exec(css);
  assert.ok(rule, 'the move button needs its own rule in the row');
  assert.ok(/margin:\s*0/.test(rule[1]), 'no margin to offset it');
  assert.ok(/align-self:\s*flex-end/.test(rule[1]),
    'and it aligns with the controls, not with the labels above them');
  // The row itself must still be the flex row this depends on.
  assert.ok(/\.move-storage-form\s*\{[^}]*align-items:\s*flex-end/.test(css),
    'the row aligns its children at the bottom');
});

test('4. the rescue-card-description checkbox sits with its label', () => {
  const jade = jadeCode(read('client/components/users/userHeader.jade'));
  const at = jade.indexOf('js-rescue-card-description');
  assert.notStrictEqual(at, -1, 'the row must be there');
  const row = jade.slice(at - 120, at + 400);
  assert.ok(!/b &nbsp;/.test(row),
    'the `b &nbsp;` spacer was a stray flex item between the box and its text');
  assert.ok(!/materialCheckBox\.left/.test(row),
    '.left is float: inline-start, which a flex container ignores - the box was '
    + 'floated in a row that does not float');
  // The shape every other checkbox row in this file uses.
  assert.ok(/a\.flex\.js-rescue-card-description/.test(row), 'a .flex row');
  assert.ok(/\.materialCheckBox\(class=/.test(row), 'then the box');
  assert.ok(row.indexOf('materialCheckBox') < row.indexOf('span {{_'), 'then the text');
});

test('5. the WIP counter stays on the list title line', () => {
  // The counter is already inside the h2, after the title. What pushed it down
  // was the title itself: `+viewer` renders .viewer, which is display: block
  // with a 22px min-height, so it also inflated that list's header height.
  const jade = read('client/components/lists/listHeader.jade');
  assert.ok(/\+viewer[\s\S]{0,200}wipLimit\.enabled/.test(jade),
    'the markup already puts the counter after the title inside the heading');

  const css = cssCode(read('client/components/lists/list.css'));
  const rule = /\.list-header \.list-header-name \.viewer,\s*\.list-header \.list-header-name \.viewer p\s*\{([^}]*)\}/
    .exec(css);
  assert.ok(rule, 'the heading\'s viewer needs to be inline, or the counter wraps');
  assert.ok(/display:\s*inline/.test(rule[1]), 'inline, so the counter follows the title');
  assert.ok(/min-height:\s*0/.test(rule[1]),
    'and no reserved 22px band, which is what made this header taller than the '
    + 'lists either side of it');

  // The premise: .viewer really is a block with that min-height.
  const layouts = cssCode(read('client/components/main/layouts.css'));
  const base = /\.viewer\s*\{([^}]*)\}/.exec(layouts);
  assert.ok(base && /display:\s*block/.test(base[1]) && /min-height:\s*22px/.test(base[1]),
    'if .viewer stops being a 22px block, this fix is no longer needed - but it '
    + 'is still correct, and the comment above it would be describing history');
});

console.log(`\n${passed} tests passed`);
