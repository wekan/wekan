'use strict';

// The accessibility promises the Jalor layer makes, and the WeKan mechanisms it
// must not break.
//
// The one that matters most: a card cannot be movable ONLY by dragging it
// (RGAA 7.3 / WCAG 2.1 SC 2.1.1). WeKan already answers that in two ways, and
// a restyling layer is exactly the kind of change that quietly removes one of
// them - by hiding a control, by dropping a `.sr-only` rule, or by making a
// focus ring invisible.
//
// Run: node tests/jalorAccessibility.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('jalorAccessibility:');

test('a card can be moved without a mouse, two different ways', () => {
  // 1. The up/down controls on the card itself.
  const minicard = read('client/components/cards/minicard.jade');
  assert.ok(/\.minicard-move-buttons/.test(minicard), 'the move controls are rendered');
  assert.ok(/js-card-move-up/.test(minicard) && /js-card-move-down/.test(minicard));
  assert.ok(/aria-label="\{\{_ 'move-card-up'\}\}"/.test(minicard),
    'and they are labelled for a screen reader');
  const js = read('client/components/cards/minicard.js') + read('client/components/lists/listBody.js');
  assert.ok(/js-card-move-up/.test(js), 'and something handles the click');

  // 2. "Move card to..." in the card's own menu, which is a VISIBLE route -
  // the one for somebody who is not tabbing through the board.
  const details = read('client/components/cards/cardDetails.jade');
  assert.ok(/js-move-card\b/.test(details), 'the card menu offers "Move card to..."');
  assert.ok(/js-move-card-to-top/.test(details) && /js-move-card-to-bottom/.test(details));
});

test('those controls are still reachable, and still show themselves on focus', () => {
  // They are transparent rather than clipped on purpose: a `clip: rect(0,0,0,0)`
  // control is not hit-testable, so activating it does nothing. And they reveal
  // themselves when focused, so the focus ring never vanishes mid-board.
  const css = read('client/components/main/layouts.css');
  assert.ok(/\.minicard-move-buttons\.sr-only,[\s\S]*?position: static !important/.test(css),
    'the group keeps a real box');
  assert.ok(/\.minicard-move-buttons\.sr-only a:focus[\s\S]*?opacity: 1/.test(css),
    'and reveals itself on focus');
  // The Jalor layer recolours that reveal; it must not undo it.
  const jalor = read('client/jalor/jalor-kanban.css');
  assert.ok(/minicard-move-buttons\.sr-only a:focus/.test(jalor),
    'the Jalor layer styles the revealed state, not the hidden one');
  assert.ok(!/minicard-move-buttons[^{]*\{[^}]*display:\s*none/.test(jalor),
    'and never hides them');
});

test('there is exactly one focus indicator, and it is the DSFR one', () => {
  const base = read('client/jalor/jalor-base.css');
  assert.ok(/:focus-visible \{[\s\S]*?outline: var\(--jalor-focus-width\) solid var\(--jalor-focus-color\)/
    .test(base), 'the DSFR ring is declared once, on :focus-visible');
  assert.ok(/--jalor-focus-color:\s*#0a76f6/.test(read('client/jalor/jalor-tokens.css')),
    "and it is the DSFR's own colour");
  // WeKan clears the outline on every form control and draws a glow instead;
  // the layer has to put the ring back or keyboard focus is invisible in forms.
  const controls = read('client/jalor/jalor-controls.css');
  assert.ok(/input:not\(\[type='file'\]\):not\(\.fr-input\):focus,\n\.wekan-form-control:focus \{\n  outline: var\(--jalor-focus-width\)/
    .test(controls), 'fields get the ring back');
  assert.ok(/box-shadow: none/.test(controls),
    'and the glow goes, so there are not two indicators');
});

test('the skip link is invisible until it is focused, then visible', () => {
  assert.ok(/a\.skip-link\(href="#content"\)/.test(read('client/components/main/layouts.jade')),
    'WeKan renders a skip link');
  const base = read('client/jalor/jalor-base.css');
  assert.ok(/\.skip-link \{[\s\S]*?inset-inline-start: -9999px/.test(base));
  assert.ok(/\.skip-link:focus[\s\S]*?inset-inline-start: 0/.test(base),
    'and it comes on screen when focused');
});

test('animation gives way to prefers-reduced-motion', () => {
  const base = read('client/jalor/jalor-base.css');
  assert.ok(/@media \(prefers-reduced-motion: reduce\)/.test(base));
  assert.ok(/animation-duration: 0\.001ms !important/.test(base));
  assert.ok(/transition-duration: 0\.001ms !important/.test(base));
});

test('an error is never carried by colour alone', () => {
  // RGAA 3.1. The error states in the layer all pair a colour with a border and
  // a message element, and the sign-in error region is announced.
  const controls = read('client/jalor/jalor-controls.css');
  assert.ok(/\.jalor-field-error/.test(controls), 'there is a message element');
  assert.ok(/aria-invalid='true'/.test(controls),
    'and the state is taken from aria-invalid, not only from a class');
  const layouts = read('client/components/main/layouts.jade');
  assert.ok(/div#login-error-message\(role="alert" aria-live="assertive"\)/.test(layouts),
    'the sign-in error is announced');
  // ...and it carries no inline style, which no stylesheet could override.
  assert.ok(!/login-error-message\([^)]*style=/.test(layouts),
    'the error region must not hard-code its own colour inline');
  const auth = read('client/jalor/jalor-auth.css');
  assert.ok(/#login-error-message:not\(:empty\)/.test(auth),
    'and only draws its alert when it has something to say');
});

test('the sign-in page has one h1, and the mark beside it is decoration', () => {
  const layouts = read('client/components/main/layouts.jade');
  assert.ok(/img\.jalor-auth-logo\([^)]*alt="" aria-hidden="true"/.test(layouts),
    'the mark is hidden from assistive tech - the name beside it already says it');
  assert.ok(/h1\.jalor-auth-name/.test(layouts), 'the product name is the heading');
});

console.log(`\njalorAccessibility: ${passed} tests passed`);
