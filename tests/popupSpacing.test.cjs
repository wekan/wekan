'use strict';

// A popup must have the SAME empty space above its first row as beside it, and the
// rows that carry a description must line up in columns.
//
// Two bugs, one of them invisible in the file that showed it:
//
//  1. `client/components/settings/peopleBody.css` and `translationBody.css` each
//     carried a bare `.content-wrapper { margin-top: 10px }`. `.content-wrapper` is
//     not a settings class - the only element in WeKan with that class is the
//     scrolling body of a POPUP (client/components/main/popup.tpl.jade) - and nothing
//     in popup.css sets a margin on it, so those two stray rules pushed the content of
//     EVERY popup down by 10px. On top of the 9px under the header and the 12px of
//     content padding that is 31px above the first row against 18px beside it, which
//     is the "too much empty space above" in Board Settings, Board View, Member
//     Settings, Sort Cards, Change Watch, Change Visibility, Swimlane Actions and the
//     Title field of Rename Board.
//
//  2. In Change Visibility / Change Watch each row is icon + name + description laid
//     out as a flex row, so every row started its description wherever its own name
//     happened to end - and the check mark on the active row pushed that row's
//     description further right still. They are three columns and must read as three.
//
// Run: node tests/popupSpacing.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const strip = src => src.replace(/\/\*[\s\S]*?\*\//g, '');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// Comments out, so a note above or inside a rule cannot be read as a declaration.
const popupCss = strip(read('client/components/main/popup.css'));

function rule(css, selector) {
  const i = css.indexOf(selector + ' {');
  assert.ok(i !== -1, `missing rule: ${selector}`);
  return css.slice(i, css.indexOf('}', i));
}
const px = (body, prop) => {
  const m = new RegExp(`${prop}:\\s*(-?[\\d.]+)px`).exec(body);
  assert.ok(m, `${prop} not found in: ${body.trim().slice(0, 80)}`);
  return parseFloat(m[1]);
};

console.log('popupSpacing:');

test('the space above the first row equals the space beside it', () => {
  const header = rule(popupCss, '.pop-over .header');
  const content = rule(popupCss, '.pop-over .content-container .content');
  // `padding: <top> <side> <bottom>` on .content.
  const parts = /padding:\s*([\d.]+)px\s+([\d.]+)px\s+([\d.]+)px/.exec(content);
  assert.ok(parts, '.content declares its padding');
  const [, top, side] = parts.map(Number);
  const gap = px(header, 'margin-bottom') + top;
  assert.strictEqual(gap, side,
    `above the first row: ${gap}px, beside it: ${side}px - they must match`);
});

test('the member menu, whose header is out of the flow, reserves exactly the same', () => {
  const header = rule(popupCss, '.pop-over .header');
  const wrapper = rule(popupCss, ".pop-over[data-popup='memberMenuPopup'] > .content-wrapper");
  const calc = /padding-top:\s*calc\(([^)]+)\)/.exec(wrapper);
  assert.ok(calc, 'it reserves the header height as padding');
  const sum = calc[1].split('+').reduce((a, t) => a + parseFloat(t), 0);
  // header height + its bottom border + the gap every other popup has.
  const expected = px(header, 'height') + 1 + px(header, 'margin-bottom');
  assert.strictEqual(sum, expected,
    'the member menu must not be 10px lower than every other popup');
});

test('no stylesheet styles .content-wrapper without saying which popup', () => {
  // This is the rule that leaked: 0,1,0 specificity, in a file about the People pane,
  // applying to every popup in WeKan.
  const offenders = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(rel);
      else if (entry.name.endsWith('.css')) {
        const src = strip(read(rel));
        for (const m of src.matchAll(/([^{}]+)\{[^{}]*\}/g)) {
          for (const sel of m[1].split(',')) {
            const s = sel.trim().replace(/\s+/g, ' ');
            if (s === '.content-wrapper' || s === '.content-container') {
              offenders.push(`${rel}: ${s}`);
            }
          }
        }
      }
    }
  };
  walk('client');
  assert.deepStrictEqual(offenders, [],
    'an unscoped popup-internal class hits every popup in the app');
});

test('rows with a description are three left-aligned columns', () => {
  const row = rule(popupCss, '.pop-over-list.described-list li > a');
  assert.ok(/display:\s*grid/.test(row), 'a grid, not a flex row');
  const cols = /grid-template-columns:\s*([^;]+);/.exec(row);
  assert.ok(cols, 'with declared tracks');
  assert.strictEqual(cols[1].trim().split(/\s+(?![^(]*\))/).length, 4,
    'icon | name | check | description - four tracks, so the check has one of its own');
  // Fixed leading tracks: each row is its own grid container, and separate grid
  // containers cannot share auto-sized tracks, so `auto` would not line anything up.
  assert.ok(!/^\s*auto/.test(cols[1]), 'the leading tracks have a width');

  const check = rule(popupCss, '.pop-over-list.described-list li > a > .fa-check');
  assert.ok(/grid-column:\s*3/.test(check), 'the check mark is pinned to its own track');
  const sub = rule(popupCss, '.pop-over-list.described-list li > a > .sub-name');
  assert.ok(/grid-column:\s*4/.test(sub),
    'and the description to the last one - the check can never shift it');
});

test('and the two popups that have those rows ask for that layout', () => {
  const jade = read('client/components/boards/boardHeader.jade');
  for (const template of ['boardVisibilityList', 'boardChangeWatchPopup']) {
    const at = jade.indexOf(`template(name="${template}")`);
    assert.ok(at !== -1, `${template} exists`);
    const list = jade.slice(at, at + 200);
    assert.ok(/ul\.pop-over-list\.described-list/.test(list),
      `${template} must carry the described-list class`);
  }
  // Not the permission list: those rows have no leading icon, so a fixed icon track
  // would misalign every one of them.
  const sidebar = read('client/components/sidebar/sidebar.jade');
  const perms = sidebar.indexOf('template(name="changePermissionsPopup")');
  assert.ok(perms !== -1);
  assert.ok(!/described-list/.test(sidebar.slice(perms, perms + 200)),
    'changePermissionsPopup has no icon column to align');
});

console.log(`\n${passed} tests passed`);
