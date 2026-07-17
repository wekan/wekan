'use strict';

// Plain-Node unit test (no DOM/Meteor) for the inlined-form open/close state
// transitions used by client/lib/inlinedform.js.
// Run: node tests/inlinedFormSingleOpen.test.cjs
//
// Regression guard for #2418 ("Checklist item gets overwritten by previous
// item when selecting another item with mouse"): opening a checklist item's
// edit form while another item was already in edit mode did not close the
// previous form (the 'inlinedForm' EscapeAction is registered with
// enabledOnClick: false, so EscapeActions.clickExecute() skipped it). With
// two edit forms open, the submit handlers find the textarea with a
// template-wide first-match (`tpl.find('textarea.js-edit-checklist-item')`)
// and so saved the PREVIOUS item's text into the newly submitted item.
// openForm() must restore the "only one inlined form open at a time"
// invariant, and closeForm()/forgetForm() must not orphan a different,
// still-open form when a stale form is closed or destroyed.

const assert = require('assert');
const {
  openForm,
  closeForm,
  forgetForm,
} = require('../client/lib/inlinedFormManager');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// Minimal ReactiveVar stand-in (same get/set surface as Meteor's).
function fakeVar(initial) {
  let value = initial;
  return {
    get() {
      return value;
    },
    set(v) {
      value = v;
    },
  };
}

// A form template stand-in: only the `isOpen` ReactiveVar matters.
function fakeForm(name) {
  return { name, isOpen: fakeVar(false) };
}

// --- POSITIVE: the #2418 reproduction chain ---------------------------------
test('#2418: opening item B closes item A (previous form leaves edit mode)', () => {
  const tracker = fakeVar(null);
  const A = fakeForm('A');
  const B = fakeForm('B');

  openForm(tracker, A);
  assert.strictEqual(A.isOpen.get(), true, 'A opens');
  assert.strictEqual(tracker.get(), A, 'A is tracked');

  openForm(tracker, B);
  assert.strictEqual(A.isOpen.get(), false, 'A must leave edit mode');
  assert.strictEqual(B.isOpen.get(), true, 'B is in edit mode');
  assert.strictEqual(tracker.get(), B, 'B is tracked');
});

test('#2418: full A→B→C→D click chain keeps exactly one form open', () => {
  const tracker = fakeVar(null);
  const forms = ['A', 'B', 'C', 'D'].map(fakeForm);

  for (const form of forms) {
    openForm(tracker, form);
    const open = forms.filter(f => f.isOpen.get());
    assert.deepStrictEqual(
      open.map(f => f.name),
      [form.name],
      `after opening ${form.name}, only ${form.name} may be open`,
    );
    assert.strictEqual(tracker.get(), form);
  }
});

test('closeForm closes the tracked form and resets the tracker (Escape path)', () => {
  const tracker = fakeVar(null);
  const A = fakeForm('A');
  openForm(tracker, A);

  closeForm(tracker, A);
  assert.strictEqual(A.isOpen.get(), false);
  assert.strictEqual(tracker.get(), null, 'tracker is reset');
});

test('forgetForm of the tracked form resets the tracker (onDestroyed path)', () => {
  const tracker = fakeVar(null);
  const A = fakeForm('A');
  openForm(tracker, A);

  forgetForm(tracker, A);
  assert.strictEqual(tracker.get(), null);
});

// --- NEGATIVE: stale-form operations must not orphan the open form ----------
test('NEGATIVE: closing a STALE form does not untrack the newly opened form', () => {
  // checklists.js clicks every .js-close-inlined-form after opening a new
  // form; the stale (already closed) form's close handler must not null the
  // tracker for the new form, or Escape would close the card details
  // instead of the form.
  const tracker = fakeVar(null);
  const A = fakeForm('A');
  const B = fakeForm('B');
  openForm(tracker, A);
  openForm(tracker, B); // A is now closed, B open and tracked

  closeForm(tracker, A); // stale close (the workaround's synthetic click)
  assert.strictEqual(B.isOpen.get(), true, 'B stays open');
  assert.strictEqual(tracker.get(), B, 'B stays tracked');
});

test('NEGATIVE: destroying an unrelated form instance keeps the open form tracked', () => {
  const tracker = fakeVar(null);
  const A = fakeForm('A');
  const B = fakeForm('B');
  openForm(tracker, B);

  forgetForm(tracker, A); // some other inlinedForm template gets destroyed
  assert.strictEqual(tracker.get(), B, 'B must remain tracked');
  assert.strictEqual(B.isOpen.get(), true);
});

test('NEGATIVE: re-opening the already-open form does not close it', () => {
  const tracker = fakeVar(null);
  const A = fakeForm('A');
  openForm(tracker, A);

  openForm(tracker, A);
  assert.strictEqual(A.isOpen.get(), true, 'A stays open');
  assert.strictEqual(tracker.get(), A);
});

test('NEGATIVE: openForm tolerates a previous form without isOpen and a null tracker', () => {
  const tracker = fakeVar(null);
  const A = fakeForm('A');
  assert.doesNotThrow(() => openForm(tracker, A)); // previous is null
  assert.strictEqual(A.isOpen.get(), true);

  tracker.set({ name: 'no-isOpen' }); // defensive: malformed previous entry
  const B = fakeForm('B');
  assert.doesNotThrow(() => openForm(tracker, B));
  assert.strictEqual(B.isOpen.get(), true);
  assert.strictEqual(tracker.get(), B);
});

test('NEGATIVE: closeForm tolerates null/malformed forms without throwing', () => {
  const tracker = fakeVar(null);
  assert.doesNotThrow(() => closeForm(tracker, null));
  assert.strictEqual(tracker.get(), null);

  const stub = { name: 'no-isOpen' };
  tracker.set(stub);
  assert.doesNotThrow(() => closeForm(tracker, stub));
  assert.strictEqual(tracker.get(), null, 'tracked malformed form is untracked');
});

console.log(`\n${passed} tests passed`);
