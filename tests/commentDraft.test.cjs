'use strict';

// Plain-Node regression guard (no Meteor) for issue #5547: a comment being
// written was lost when the card was closed or a click landed outside it.
// Run: node tests/commentDraft.test.cjs
//
// History this test protects: the comment-draft machinery existed since 2015
// (the form prefills from {{getUnsavedValue 'cardComment' ...}}), but the
// escape handler that SAVED the draft was gated on a commentFormIsOpen flag
// whose only setter was removed in 2019 (commit 3b3950369) — because that
// handler also CLEARED the visible textarea on every outside click. Since
// then, nothing saved the draft at all. The #5547 fix:
//  - saves the draft continuously (debounced) while typing,
//  - flushes a pending save when the form is torn down (card closed, route
//    change),
//  - clears the draft on successful submit (and cancels a pending save so a
//    late debounce cannot resurrect it),
//  - re-arms the escape handler (focus sets the flag) WITHOUT re-introducing
//    the 2019 "text disappears on outside click" bug (no input clearing).

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const src = fs.readFileSync(
  path.join(repoRoot, 'client/components/activities/comments.js'),
  'utf8',
);
const jade = fs.readFileSync(
  path.join(repoRoot, 'client/components/activities/comments.jade'),
  'utf8',
);

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- POSITIVE: the draft lifecycle -------------------------------------------

test('typing schedules a (debounced) draft save', () => {
  assert.ok(/'input \.js-new-comment-input'\(evt\) \{\s*\n\s*scheduleCommentDraftSave\(/.test(src));
});

test('form teardown flushes a pending draft save (card closed, route change)', () => {
  const onDestroyed = src.match(/Template\.commentForm\.onDestroyed\(function \(\) \{[\s\S]*?\n\}\);/);
  assert.ok(onDestroyed, 'onDestroyed found');
  assert.ok(onDestroyed[0].includes('flushCommentDraftSave();'));
});

test('focus arms the escape handler again (the flag lost its setter in 2019)', () => {
  assert.ok(/'focus \.js-new-comment-input'\(\) \{\s*\n\s*commentFormIsOpen\.set\(true\);/.test(src));
});

test('the form prefills from the stored draft', () => {
  assert.ok(jade.includes("{{getUnsavedValue 'cardComment' currentCard._id}}"));
});

test('submit clears the draft AND cancels any pending debounced save', () => {
  const submit = src.match(/'submit \.js-new-comment-form'[\s\S]*?\n  \},/);
  assert.ok(submit, 'submit handler found');
  assert.ok(submit[0].includes('cancelCommentDraftSave();'),
    'a debounce still in flight must not resurrect the submitted comment as a draft');
  assert.ok(/UnsavedEdits\.reset\(\{\s*\n?\s*fieldName: 'cardComment',/.test(submit[0]),
    'submit must remove the stored draft');
});

// --- NEGATIVE: the 2019 regression must NOT come back ------------------------

test("escape handler no longer clears the visible text (2019's 'text disappears')", () => {
  const escapeBlock = src.match(/EscapeActions\.register\(\s*'inlinedForm',[\s\S]*?\n\);/);
  assert.ok(escapeBlock, 'escape registration found');
  assert.ok(!escapeBlock[0].includes('resetCommentInput('),
    'escape must not clear the comment input — only blur and save the draft');
  assert.ok(escapeBlock[0].includes('commentInput.blur();'));
  assert.ok(escapeBlock[0].includes('commentFormIsOpen.set(false);'),
    'escape must disarm the flag so the next Escape press can close the card');
});

test('escape handler still saves a non-empty draft and resets an empty one', () => {
  const escapeBlock = src.match(/EscapeActions\.register\(\s*'inlinedForm',[\s\S]*?\n\);/);
  assert.ok(escapeBlock[0].includes('UnsavedEdits.set(draftKey, draft);'));
  assert.ok(escapeBlock[0].includes('UnsavedEdits.reset(draftKey);'));
});

test('an empty draft never persists (write helper resets instead of saving)', () => {
  const writer = src.match(/function commentDraftWrite\(\{ cardId, value \}\) \{[\s\S]*?\n\}/);
  assert.ok(writer, 'commentDraftWrite found');
  assert.ok(/if \(\(value \|\| ''\)\.trim\(\)\)/.test(writer[0]),
    'whitespace-only text must reset the draft, not store it');
  assert.ok(writer[0].includes('UnsavedEdits.reset(draftKey);'));
});

console.log(`\n${passed} tests passed`);
