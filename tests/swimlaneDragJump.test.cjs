'use strict';

// Plain-Node unit test (no Meteor) for the drag-start layout stability of the
// board canvas. Run: ELECTRON_RUN_AS_NODE=1 <node> tests/swimlaneDragJump.test.cjs
//
// Regression guard for #2877 ("Wekan swimlane jumps when moving card").
// When a card drag starts, boardBody.jade puts `is-dragging-active` on the
// .board-canvas and CSS hides the "+ Add Card" composer link at the bottom of
// every list. Hiding it with `display: none` removed the composer's box from
// the flow, so each list got shorter, each auto-height swimlane shrank by the
// composer row, and every swimlane below the first jumped UP the moment the
// drag started — then jumped back DOWN on drop (clearly visible in the GIF
// attached to the issue). The rule must hide the link with a layout-preserving
// declaration (`visibility: hidden`) instead, so starting/ending a drag moves
// nothing.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- tiny CSS scanner (comment-safe) -----------------------------------------

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

// Return the declaration blocks of every rule whose selector list matches ALL
// of the given substrings (e.g. ['.is-dragging-active', '.open-minicard-composer']).
function rulesFor(css, selectorParts) {
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  const clean = stripComments(css);
  while ((m = re.exec(clean)) !== null) {
    // A selector list applies each declaration to EACH comma-separated
    // selector independently — inspect them one by one.
    const selectors = m[1].split(',').map(s => s.trim());
    for (const sel of selectors) {
      if (selectorParts.every(p => sel.includes(p))) {
        out.push({ selector: sel, declarations: m[2] });
      }
    }
  }
  return out;
}

// Would these declarations remove the element's box from the layout (and
// therefore shift everything after it)?
function collapsesLayout(declarations) {
  return /(?:^|[\s;])display\s*:\s*none/.test(declarations);
}

// Do these declarations hide the element visually?
function hidesElement(declarations) {
  return (
    /(?:^|[\s;])visibility\s*:\s*hidden/.test(declarations) ||
    collapsesLayout(declarations)
  );
}

const cssPath = path.join(
  __dirname, '..', 'client', 'components', 'boards', 'boardBody.css',
);
const boardCss = fs.readFileSync(cssPath, 'utf8');

const composerRules = rulesFor(boardCss, [
  '.is-dragging-active',
  '.open-minicard-composer',
]);

// --- POSITIVE: dragging still hides the composer, without moving layout ------

test('boardBody.css has an is-dragging-active rule for .open-minicard-composer', () => {
  assert.ok(
    composerRules.length > 0,
    'expected a rule hiding the add-card composer while dragging',
  );
});

test('the composer is hidden during a drag (drop zone stays uncluttered)', () => {
  assert.ok(
    composerRules.some(r => hidesElement(r.declarations)),
    'the composer link must still be hidden while a card is dragged',
  );
});

test('#2877: hiding the composer preserves its box (no swimlane jump)', () => {
  for (const r of composerRules) {
    assert.ok(
      !collapsesLayout(r.declarations),
      `"${r.selector}" uses display:none — removing the composer row from ` +
        'the flow shrinks every list and auto-height swimlane at drag start, ' +
        'making the swimlanes below jump (issue #2877)',
    );
  }
  assert.ok(
    composerRules.some(r =>
      /visibility\s*:\s*hidden/.test(r.declarations),
    ),
    'the composer must be hidden with layout-preserving visibility:hidden',
  );
});

test('multi-selection payload cards are still removed from the flow', () => {
  // The checked cards of a multi-selection are the cards being dragged;
  // collapsing them previews the post-drop list on purpose. #2877 only
  // concerns the composer row present during EVERY drag.
  const checkedRules = rulesFor(boardCss, [
    '.is-dragging-active',
    '.minicard-wrapper.is-checked',
  ]);
  assert.ok(checkedRules.length > 0, 'is-checked drag rule exists');
  assert.ok(
    checkedRules.some(r => collapsesLayout(r.declarations)),
    'checked multi-selection cards keep display:none while dragging',
  );
});

// --- NEGATIVE: the scanner itself flags the pre-fix CSS ----------------------

test('NEGATIVE: the old (buggy) rule is detected as layout-collapsing', () => {
  // This is the exact rule shipped before the fix.
  const oldCss = `
.board-wrapper .board-canvas.is-dragging-active .open-minicard-composer,
.board-wrapper .board-canvas.is-dragging-active .minicard-wrapper.is-checked {
  display: none;
}`;
  const rules = rulesFor(oldCss, [
    '.is-dragging-active',
    '.open-minicard-composer',
  ]);
  assert.strictEqual(rules.length, 1, 'old composer rule found');
  assert.ok(
    collapsesLayout(rules[0].declarations),
    'display:none must be recognized as removing the box from the layout',
  );
  assert.ok(hidesElement(rules[0].declarations));
});

test('NEGATIVE: a display:none hidden inside a comment is not a false positive', () => {
  const css = `
.board-canvas.is-dragging-active .open-minicard-composer {
  /* display: none; would jump (see #2877) */
  visibility: hidden;
}`;
  const rules = rulesFor(css, ['.is-dragging-active', '.open-minicard-composer']);
  assert.strictEqual(rules.length, 1);
  assert.ok(!collapsesLayout(rules[0].declarations));
  assert.ok(hidesElement(rules[0].declarations));
});

test('NEGATIVE: visibility:visible or no rule would NOT count as hidden', () => {
  const css = `
.board-canvas.is-dragging-active .open-minicard-composer {
  visibility: visible;
  opacity: 1;
}`;
  const rules = rulesFor(css, ['.is-dragging-active', '.open-minicard-composer']);
  assert.strictEqual(rules.length, 1);
  assert.ok(!hidesElement(rules[0].declarations));
  assert.ok(!collapsesLayout(rules[0].declarations));
});

test('NEGATIVE: rules for other elements are not attributed to the composer', () => {
  // Selector-list splitting: display:none on .minicard-wrapper.is-checked in
  // the SAME rule text must not be reported for a separate composer selector.
  const css = `
.board-canvas.is-dragging-active .open-minicard-composer {
  visibility: hidden;
}
.board-canvas.is-dragging-active .minicard-wrapper.is-checked {
  display: none;
}`;
  const rules = rulesFor(css, ['.is-dragging-active', '.open-minicard-composer']);
  assert.strictEqual(rules.length, 1);
  assert.ok(!collapsesLayout(rules[0].declarations));
});

console.log(`\nswimlaneDragJump: ${passed} tests passed`);
