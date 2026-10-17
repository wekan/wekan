'use strict';

// Board Table view's two toggle buttons ("wrap card titles" and "group by
// swimlane") had bare one-word tooltips ({{_ 'card'}}, {{_ 'swimlane'}}) that
// did not say what clicking the button actually does, or which of the two
// states is currently on. Run: node tests/tableViewToggleTooltips.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('tableViewToggleTooltips:');

const jade = read('client/components/boards/tableView.jade');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));

const TOGGLES = [
  { cls: 'js-table-view-toggle-card-title-wrap', flag: 'wrapCardTitles', onKey: 'board-table-card-title-wrap-on', offKey: 'board-table-card-title-wrap-off' },
  { cls: 'js-table-view-toggle-swimlane-groups', flag: 'groupBySwimlane', onKey: 'board-table-group-by-swimlane-on', offKey: 'board-table-group-by-swimlane-off' },
];

TOGGLES.forEach(({ cls, flag, onKey, offKey }) => {
  test(`.${cls} has a descriptive tooltip for both states`, () => {
    const at = jade.indexOf(cls);
    assert.ok(at !== -1, `${cls} exists in tableView.jade`);
    const tag = jade.slice(jade.lastIndexOf('button', at), jade.indexOf(')', at) + 1);
    assert.match(tag, new RegExp(`title="\\{\\{#if ${flag}\\}\\}\\{\\{_ '${onKey}'\\}\\}\\{\\{else\\}\\}\\{\\{_ '${offKey}'\\}\\}\\{\\{/if\\}\\}"`),
      'the title switches between the on/off translation key with the toggle state');
    assert.match(tag, new RegExp(`aria-label="\\{\\{#if ${flag}\\}\\}\\{\\{_ '${onKey}'\\}\\}\\{\\{else\\}\\}\\{\\{_ '${offKey}'\\}\\}\\{\\{/if\\}\\}"`),
      'aria-label mirrors the same descriptive text, not just the bare word');
    assert.ok(typeof en[onKey] === 'string' && en[onKey].length > 10, `${onKey} has a real English sentence`);
    assert.ok(typeof en[offKey] === 'string' && en[offKey].length > 10, `${offKey} has a real English sentence`);
    // Each explains BOTH what is true now and what clicking it does.
    assert.match(en[onKey], /click/i);
    assert.match(en[offKey], /click/i);
  });
});

test('the bare {{_ \'card\'}}/{{_ \'swimlane\'}} tooltips are gone from these buttons (negative)', () => {
  TOGGLES.forEach(({ cls }) => {
    const at = jade.indexOf(cls);
    const tag = jade.slice(jade.lastIndexOf('button', at), jade.indexOf(')', at) + 1);
    assert.ok(!/title="\{\{_ '(card|swimlane)'\}\}"/.test(tag),
      `${cls} no longer uses the bare one-word tooltip`);
  });
});

// The global `button` rule (forms.css) pads every button 35px a side and paints
// its text white; on these white toggles the icon was white on white and the
// box 72px wide. tests/playwright/specs/viewport-matrix.e2e.js checks the colour
// in a browser.
test('the toggles draw a dark icon on their white face, at their own size', () => {
  const css = read('client/components/boards/tableView.css').replace(/\/\*[\s\S]*?\*\//g, '');
  const at = css.indexOf('.table-view-controls .js-table-view-toggle-card-title-wrap,\n.table-view-controls .js-table-view-toggle-swimlane-groups {');
  assert.ok(at !== -1, 'the toggle rule exists');
  const body = css.slice(at, css.indexOf('}', at));
  assert.match(body, /background:\s*#fff/);
  assert.match(body, /color:\s*#333/, 'a dark icon, not the global white');
  assert.match(body, /padding:\s*0/, 'no 35px global padding');
});

console.log(`\ntableViewToggleTooltips: ${passed} tests passed`);
