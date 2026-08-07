'use strict';

// #6573: picking up a card made every list on the board expand to fill the
// window, and dropping it snapped them all back.
//
// The two halves that met:
//
//   * a list's custom width is an inline `--list-width` custom property, and
//     what turns that property into an actual width is a CSS rule in list.css
//     whose selector needs an ANCESTOR: `.js-swimlane`, `.dragscroll`, or
//     `[id^="swimlane-"]`. In LISTS view the container is
//     `.swimlane.list-group.js-lists.dragscroll` - no `js-swimlane` class, no
//     `swimlane-<id>` id - so `.dragscroll` was the only one of the three that
//     matched, and every list's width hung on that one class;
//
//   * #6558 taught a card drag to stop the board panning under the same
//     pointer, and the way it does that is suspendBoardDragscroll(), which
//     REMOVES the `dragscroll` class from the board for the duration of the
//     drag and puts it back on drop.
//
// So the drag deleted the class the width rule was matching on. The rule stopped
// applying, `flex: none` and the three width declarations went with it, the lists
// fell back to the flex rules and re-flowed to fill the window - for exactly as
// long as the drag lasted. Nothing in either half was wrong on its own, which is
// why it survived review: the coupling was invisible from either file.
//
// The fix is that a layout rule may not hang on a class that an interaction
// removes. `.js-lists` is on the container in BOTH views and nothing takes it
// off, so it is the selector that belongs there.
//
// Run: node tests/listWidthDuringDrag.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const css = read('client/components/lists/list.css');
const swimlanesJade = read('client/components/swimlanes/swimlanes.jade');
const dragscrollJs = read('client/lib/boardDragscroll.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// The selector list of every rule in list.css that pins a list's width - the
// declarations that decide whether a custom width survives - as an array of
// individual selectors.
function widthRuleSelectors() {
  const out = [];
  // `selectors { … }` blocks, comments stripped so a commented-out example of
  // the old rule is not read as one.
  const plain = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of plain.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = m[1].trim();
    const body = m[2];
    if (!/width:\s*var\(--list-width/.test(body)) continue;
    if (!/\.list\b/.test(selectors)) continue;
    out.push(selectors.split(',').map(s => s.trim()).filter(Boolean));
  }
  return out;
}

console.log('listWidthDuringDrag:');

test('a card drag really does remove the dragscroll class', () => {
  // The premise of everything below. If this ever stops being true, the guard
  // still holds - but the comment above it would be describing history.
  assert.ok(/classList\.remove\('dragscroll'\)/.test(dragscrollJs),
    'suspendBoardDragscroll removes the class (that is how it stops panning)');
  assert.ok(/export function suspendBoardDragscroll/.test(dragscrollJs)
    && /export function resumeBoardDragscroll/.test(dragscrollJs),
    'and both halves are exported for the drag handlers to call');
  assert.ok(!/classList\.remove\('js-lists'\)/.test(dragscrollJs),
    'js-lists is NOT removed - which is what makes it safe to key layout on');
});

test('both views put their lists inside .js-lists', () => {
  // Swimlanes view, and lists view. The width rules key on this, so a container
  // that loses it would silently lose every custom list width.
  const containers = swimlanesJade.split('\n').filter(l => l.includes('js-lists'));
  assert.ok(containers.length >= 2,
    `expected the swimlane and the lists containers, found ${containers.length}`);
  assert.ok(containers.some(l => l.includes('js-swimlane')),
    'the swimlanes-view container');
  assert.ok(containers.some(l => l.includes('list-group') && !l.includes('js-swimlane')),
    'and the lists-view one, which is the container that has no js-swimlane class - '
    + 'the whole reason .dragscroll was load-bearing');
});

// Does this selector still match a list in LISTS view during a drag? The
// container there is `.swimlane.list-group.js-lists.dragscroll`, and the drag
// takes `dragscroll` off it - so a selector survives when it needs neither
// `.dragscroll` nor an ancestor that lists view does not have in the first
// place (`.js-swimlane`, or the `swimlane-<id>` id, which only swimlanes view
// carries). `.swimlane`, `.list-group`, `.js-lists` and no ancestor at all are
// all fine: they are on that container and nothing removes them.
function matchesInListsViewDuringDrag(selector) {
  return !/\.dragscroll\b/.test(selector)
    && !/\.js-swimlane\b/.test(selector)
    && !/\[id\^="swimlane-"\]/.test(selector);
}

test('no list-width rule depends on .dragscroll alone', () => {
  const rules = widthRuleSelectors();
  assert.ok(rules.length >= 3,
    `expected the width-pinning rules to be found, got ${rules.length}`);

  for (const selectors of rules) {
    assert.ok(selectors.some(matchesInListsViewDuringDrag),
      'every selector of this rule needs either the dragscroll class (which a card '
      + 'drag removes) or a swimlanes-view ancestor (which lists view does not '
      + 'have), so in lists view the rule switches off for the duration of a drag '
      + `and the lists re-flow:\n      ${selectors.join(',\n      ')}`);
  }
});

test('the rule that turns --list-width into a width says .js-lists', () => {
  // Stated positively for the one rule the bug was actually in, so a future
  // rewrite of that selector list keeps the fix rather than passing the test
  // above by accident.
  const pinning = widthRuleSelectors()
    .filter(sels => sels.some(s => s.includes('[style*="--list-width"]')));
  assert.ok(pinning.length >= 1, 'the inline-custom-property rule must be there');
  for (const selectors of pinning) {
    assert.ok(selectors.some(s => /\.js-lists\b/.test(s)),
      `no .js-lists selector on the rule that applies the width:\n      ${selectors.join(',\n      ')}`);
  }
  // The .list-resizing rules have the same three-ancestor shape and had the same
  // hole: a resize started while the board is not pannable would jump the same way.
  const resizing = css.match(/^[^{}]*\.list\.list-resizing[^{}]*\{/gm) || [];
  assert.ok(resizing.some(r => r.includes('.js-lists')), 'the resizing rules need it too');
});

console.log(`\n${passed} tests passed`);
