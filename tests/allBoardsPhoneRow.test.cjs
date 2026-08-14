'use strict';

// Two things on the All Boards page of a phone, both of which differed between
// mobile mode and desktop mode on the SAME phone:
//
//   * the board tile's drag handle was a 26px circle in mobile mode and a 40px one
//     in desktop mode - the big one covering a good part of a ~97px tile;
//   * a workspace had no readable name in either mode: the row's fixed items (drag
//     handle, folder icon, menu button, count chip), at their desktop paddings,
//     came to ~130px of a ~145px column, so the name was laid out in what was left.
//
// A CSS source guard - Playwright has no phone viewport in the suite, and the
// widths here are the ones the cascade actually resolves to.
//
// Run: node tests/allBoardsPhoneRow.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
// Sizes are written `calc(Npx * var(--wekan-ui-font-scale, 1))` so Member
// Settings / Font / Size can move all of them (client/components/main/uiFont.css).
// This guard is about the N, so the wrapper is unwrapped before it is read - and
// unwrapping it here rather than loosening every assertion keeps each one saying
// the size it means.
const unscale = css => css.replace(
  /calc\((\d*\.?\d+px) \* var\(--wekan-ui-font-scale, 1\)\)/g, '$1');
const read = rel => unscale(fs.readFileSync(path.join(__dirname, '..', rel), 'utf8'));

const css = read('client/components/boards/boardsList.css');

// Every rule, including the ones inside a media query.
function rules() {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => ({
    selector: m[1].trim().split('\n').pop().trim(),
    body: m[2],
  }));
}

const decl = (body, prop) => {
  const m = new RegExp(`(?<![-\\w])${prop}:\\s*([^;!]+)`).exec(body);
  return m ? m[1].trim() : null;
};

console.log('allBoardsPhoneRow:');

test('a board tile has ONE drag-handle size on a phone, the smaller one', () => {
  const handles = rules().filter(r => r.selector.endsWith('.board-handle')
    && decl(r.body, 'width'));
  assert.ok(handles.length >= 3, `expected the phone rules, found ${handles.length}`);
  const sizes = new Set(handles.map(r => decl(r.body, 'width')));
  assert.deepStrictEqual([...sizes], ['26px'],
    'mobile mode and desktop mode must not draw the same handle at two sizes');
  for (const r of handles) {
    assert.strictEqual(decl(r.body, 'height'), '26px', `${r.selector}: square`);
    assert.strictEqual(decl(r.body, 'font-size'), '16px', `${r.selector}: glyph`);
    // Still a comfortable touch target: 26px + the tile's own padding around it.
    assert.ok(parseInt(decl(r.body, 'width'), 10) >= 24,
      `${r.selector}: a finger needs about 24px`);
  }
});

test('the mobile-mode handle is the one the others were made to match', () => {
  const mobile = rules().find(r => r.selector === '.board-list.mobile-view .board-handle'
    && decl(r.body, 'width'));
  assert.ok(mobile, 'the mobile-view handle must still be there');
  assert.strictEqual(decl(mobile.body, 'width'), '26px');
});

test('a workspace name always has room to be read', () => {
  const name = rules().filter(r => r.selector === '.workspace-node .workspace-name')
    .pop();
  assert.ok(name, 'the phone rule for the name must be there');
  const floor = decl(name.body, 'min-width');
  assert.ok(floor && floor !== '0',
    `the name must have a floor, found ${floor} - "shrink to nothing" is what it did`);
  assert.ok(/em$/.test(floor), 'in em, so it follows the font size');
  assert.ok(parseFloat(floor) >= 3, `about six characters at least, found ${floor}`);
  assert.ok(/text-overflow: ellipsis;/.test(name.body), 'and it truncates');
});

test('the fixed items around it are trimmed to fit the phone column', () => {
  // ~145px of column; measured from the declarations, not guessed.
  const find = sel => rules().filter(r => r.selector === sel).pop();
  const px = (rule, prop, fallback) => {
    const v = rule && decl(rule.body, prop);
    if (!v) return fallback;
    const m = /(\d+)px/.exec(v.split(' ').pop());
    return m ? Number(m[1]) : fallback;
  };
  const handle = find('.workspace-node .workspace-drag-handle');
  const menu = find('.workspace-node .js-open-workspace-menu');
  const count = find('.workspace-node .workspace-count');
  assert.ok(handle && menu && count, 'each fixed item must be sized for the phone');
  assert.ok(px(handle, 'font-size', 14) <= 12, 'the drag handle gives way');
  assert.ok(px(menu, 'padding', 6) <= 4, 'the menu button gives way');
  assert.ok(px(count, 'min-width', 20) <= 16, 'the count chip gives way');
  // The old comment promised the name "must give way" - which is what broke it.
  assert.ok(!/the name must give way to/.test(css),
    'the rule that made the name the only thing allowed to vanish is gone');
});

test('the name is still clipped, so it cannot cover the menu button', () => {
  const select = rules().filter(r => r.selector === '.workspace-node .js-select-space')
    .pop();
  assert.ok(select && /overflow: hidden;/.test(select.body),
    'the overlap this prevents was a separate bug - it must not come back');
});

console.log(`\n${passed} tests passed`);
