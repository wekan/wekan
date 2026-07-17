'use strict';

// Regression test for #6479: "Removing users from boards doesn't work" — the
// "Remove member?" confirmation dialog appeared, but clicking "Remove Member"
// (any .js-confirm button) did nothing.
//
// Popup.afterConfirm() used to stash the action ON the Blaze data context
// (`context.__afterConfirmAction = action`) and the .js-confirm handler read it
// back as `this.__afterConfirmAction`. The context is a ReactiveCache/Minimongo
// document (a board member sub-doc); once Blaze re-renders the confirmation popup
// with a fresh/immutable copy of that context, the mutation is gone, so the
// confirm handler saw `undefined` and nothing happened. The fix stores the action
// on the Popup INSTANCE, which survives the re-render.
//
// The real code is Blaze/Meteor-coupled; this test models the mechanism to prove
// the instance-storage approach survives the two failure modes (a frozen context,
// and a re-rendered/replaced context), plus source guards on the actual files.
//
// Run: node tests/popupAfterConfirm.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- Minimal models of the OLD (context) and NEW (instance) mechanisms. ---
function makeOldPopup() {
  return {
    afterConfirm(action) {
      return context => {
        context.__afterConfirmAction = action; // mutate the data context
        return context; // "opened" context
      };
    },
    confirmClick(renderedContext) {
      // main/popup.js: this.__afterConfirmAction.call(this)
      if (typeof renderedContext.__afterConfirmAction === 'function') {
        renderedContext.__afterConfirmAction.call(renderedContext);
      }
    },
  };
}
function makeNewPopup() {
  const self = {
    afterConfirm(action) {
      return context => {
        self._afterConfirmAction = action; // stored on the instance
        return context;
      };
    },
    confirmClick(renderedContext) {
      const action = self._afterConfirmAction || renderedContext.__afterConfirmAction;
      if (typeof action === 'function') action.call(renderedContext);
    },
  };
  return self;
}

// Blaze re-renders the confirmation popup with a FRESH copy of the data context
// re-read from ReactiveCache — it does NOT carry the ad-hoc field the opener
// mutated onto the previous object, and it is frozen so a re-mutation can't help.
function reRenderedCopy(context) {
  const clean = { ...context };
  delete clean.__afterConfirmAction; // the mutation does not survive the re-fetch
  return Object.freeze(clean);
}

test('NEGATIVE: the old context-mutation mechanism loses the action on re-render', () => {
  const popup = makeOldPopup();
  let ran = false;
  const member = { userId: 'u1' };
  const opened = popup.afterConfirm(function () { ran = true; })(member);
  // The confirmation popup renders with a fresh/frozen copy, not `opened`.
  popup.confirmClick(reRenderedCopy(opened));
  assert.strictEqual(ran, false, 'reproduces #6479: the action never runs');
});

test('the instance-storage mechanism runs the action after a re-render', () => {
  const popup = makeNewPopup();
  let ranWith = null;
  const member = { userId: 'u1' };
  const opened = popup.afterConfirm(function () { ranWith = this.userId; })(member);
  popup.confirmClick(reRenderedCopy(opened));
  assert.strictEqual(ranWith, 'u1', 'action runs with the popup data context as `this`');
});

test('the instance-storage mechanism survives a FROZEN original context', () => {
  const popup = makeNewPopup();
  let ran = false;
  const frozenMember = Object.freeze({ userId: 'u2' });
  const opened = popup.afterConfirm(() => { ran = true; })(frozenMember);
  popup.confirmClick(reRenderedCopy(opened));
  assert.strictEqual(ran, true);
});

// --- Source guards on the actual files. ---
const repoRoot = path.resolve(__dirname, '..');
const popupLib = fs.readFileSync(path.join(repoRoot, 'client/lib/popup.js'), 'utf8');
const mainPopup = fs.readFileSync(path.join(repoRoot, 'client/components/main/popup.js'), 'utf8');

test('Popup.afterConfirm stores the action on the instance', () => {
  assert.ok(/self\._afterConfirmAction = action;/.test(popupLib),
    'afterConfirm must set self._afterConfirmAction');
  assert.ok(!/context\.__afterConfirmAction = action/.test(popupLib),
    'afterConfirm must NOT mutate the data context anymore');
});

test('the .js-confirm handler reads the action from the Popup instance', () => {
  const idx = mainPopup.indexOf("'click .js-confirm'");
  const body = mainPopup.slice(idx, idx + 500);
  assert.ok(/Popup\._afterConfirmAction/.test(body),
    '.js-confirm must invoke Popup._afterConfirmAction');
  assert.ok(/typeof action === 'function'/.test(body),
    'must guard against a missing action instead of throwing');
});

console.log(`\nAll ${passed} popup afterConfirm tests passed`);
