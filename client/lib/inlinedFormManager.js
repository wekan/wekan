'use strict';

// Pure state transitions for the "only one inlined form open at a time"
// invariant — extracted so it is unit-testable without a DOM / Meteor
// (see tests/inlinedFormSingleOpen.test.cjs).
//
// #2418 ("Checklist item gets overwritten by previous item when selecting
// another item with mouse"): opening a checklist item's edit form while
// another item was already in edit mode did not close the previous form.
// With two edit forms open at once, the submit handlers (which locate the
// textarea with a template-wide `tpl.find('textarea.js-edit-checklist-item')`,
// i.e. FIRST match in DOM order) read the OTHER form's textarea and
// overwrote the submitted item with the previous item's text.
//
// Root cause in current code: the `.js-open-inlined-form` click handler
// tried to close the previously opened form with
// `EscapeActions.clickExecute(evt.target, 'inlinedForm')`, but the
// 'inlinedForm' escape action is registered with `enabledOnClick: false`,
// and EscapeActions._execute skips such actions for click executions
// (`isEnabled = enabledOnClick || !isClick`). So the call was silently a
// no-op and the previous form stayed open. (Regression from 8c3ce4bb7,
// 2021-10-19, which replaced `EscapeActions.executeUpTo('inlinedForm')`
// with `clickExecute` to stop popups from closing.)
//
// A secondary corruption: the close/submit/destroy paths reset the shared
// `currentlyOpenedForm` tracker UNCONDITIONALLY, so closing a stale form
// (e.g. checklists' "click all .js-close-inlined-form" workaround) nulled
// the tracker for a DIFFERENT, still-open form — after which Escape no
// longer closed the open form but fell through to closing the whole
// card-details pane.
//
// The functions below centralize the transitions and fix both problems:
// - openForm() explicitly closes the previously tracked form, without
//   touching popups (preserving the 8c3ce4bb7 intent).
// - closeForm()/forgetForm() only reset the tracker when the form being
//   closed/destroyed IS the tracked one.
//
// `tracker` is a ReactiveVar-like object ({ get(), set(v) }) holding the
// currently opened form; a "form" is any object with an `isOpen`
// ReactiveVar-like property.

/** Open `form`, closing the previously tracked form (if any and different). */
function openForm(tracker, form) {
  const previous = tracker.get();
  if (previous && previous !== form && previous.isOpen) {
    previous.isOpen.set(false);
  }
  if (form && form.isOpen) {
    form.isOpen.set(true);
  }
  tracker.set(form);
}

/**
 * Close `form`. Resets the tracker ONLY when `form` is the tracked one, so
 * closing a stale/already-closed form cannot orphan another open form.
 */
function closeForm(tracker, form) {
  if (form && form.isOpen) {
    form.isOpen.set(false);
  }
  if (tracker.get() === form) {
    tracker.set(null);
  }
}

/**
 * Stop tracking `form` without touching its own state (template destroyed).
 * Only resets the tracker when `form` is the tracked one.
 */
function forgetForm(tracker, form) {
  if (tracker.get() === form) {
    tracker.set(null);
  }
}

module.exports = { openForm, closeForm, forgetForm };
