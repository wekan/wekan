'use strict';

// Editing a card's title keeps the X that closes it.
// Run: node tests/cardTitleEditClose.test.cjs
//
// The card header carries the card's own close X. Opening the title editor
// REPLACES that header - `+inlinedForm(classNames="js-card-details-title")`
// renders `editCardTitleForm` in its place - so the X vanished the moment you
// clicked the title, and Save was the only way out of the editor. Escape worked,
// and nothing on the screen said so.
//
// The editor now draws the X itself, in the same place: it reuses
// `.close-card-details`, the class the header's own X uses, so the button does
// not move or change size as the editor opens and closes. That class floats to
// `inline-end` - the right in English, the left in Arabic - which is why there
// is no RTL branch here and must not become one.
//
// The click is handled by the generic `Template.inlinedForm` events in
// client/lib/inlinedform.js, which the anchor's `js-close-inlined-form` class
// reaches by bubbling. That is also why an <a> and not a <button>: a button
// inside the form would submit it.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const jade = read('client/components/cards/cardDetails.jade');
const css = read('client/components/cards/cardDetails.css');
const inlinedForm = read('client/lib/inlinedform.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

function template(name) {
  const start = jade.indexOf(`template(name="${name}")`);
  assert.ok(start !== -1, `missing template: ${name}`);
  const next = jade.indexOf('\ntemplate(name="', start + 1);
  return jade.slice(start, next === -1 ? undefined : next);
}

console.log('cardTitleEditClose:');

test('the title editor has a close X, not just Save', () => {
  const form = template('editCardTitleForm');
  assert.ok(/a\.close-card-details\.js-close-inlined-form/.test(form),
    'the editor draws a close button of its own');
  assert.ok(/i\.fa\.fa-times-thin/.test(form),
    'with the X icon in it - an empty anchor is a click target nobody can see');
  assert.ok(/js-submit-edit-card-title-form/.test(form), 'and Save is still there');
});

test('it is in the same place as the header X it replaces', () => {
  const form = template('editCardTitleForm');
  // Same class as the card's own close button, so it does not jump when the
  // editor opens.
  assert.ok(/close-card-details/.test(form), 'it reuses the header button class');
  // The selector list this rule shares is long; take it to its closing brace
  // rather than guessing a character count.
  const from = css.indexOf('.card-details .card-details-header .close-card-details,');
  const rule = css.slice(from, css.indexOf('}', from));
  assert.ok(/float:\s*inline-end/.test(rule),
    'which floats to the inline end');
  // And it is FIRST in the form, so it is at the top rather than under the text.
  assert.ok(form.indexOf('close-card-details') < form.indexOf('textarea'),
    'above the textarea, which is what puts it at the top of the editor');
});

test('RTL mirrors by itself, with no second rule (negative)', () => {
  // `float: inline-end` is already the left in a right-to-left language. A
  // `float: right` or a direction branch would pin it to one side in both.
  const from = css.indexOf('.card-details .card-details-header .close-card-details,');
  const rule = css.slice(from, css.indexOf('}', from));
  assert.ok(!/float:\s*right/.test(rule), 'no physical float on the header controls');
  const form = template('editCardTitleForm');
  assert.ok(!/rtl|dir="rtl"/.test(form), 'and no direction branch in the editor');
});

test('the click closes the form through the shared handler', () => {
  assert.ok(/'click \.js-close-inlined-form'/.test(inlinedForm),
    'inlinedForm handles the class, and the click bubbles to it');
  const form = template('editCardTitleForm');
  assert.ok(!/button[^\n]*js-close-inlined-form/.test(form),
    'an <a>, not a <button> - a button inside the form would submit it');
});

test('the other card editors show their X too', () => {
  // The same one-line omission: the anchor was there, the icon was not, so the
  // close was invisible in these as well.
  for (const name of ['editCardRequesterForm', 'editCardAssignerForm']) {
    const form = template(name);
    assert.ok(/js-close-inlined-form\n\s+i\.fa\.fa-times-thin/.test(form),
      `${name} has a visible close`);
  }
});

test('the title editor keeps exactly one close anchor (negative)', () => {
  // Two would both fire on the programmatic `.js-close-inlined-form` clicks
  // other components make.
  const form = template('editCardTitleForm');
  const anchors = form.match(/js-close-inlined-form/g) || [];
  assert.strictEqual(anchors.length, 1, 'one close anchor in the title editor');
});

console.log(`\ncardTitleEditClose: ${passed} tests passed`);
