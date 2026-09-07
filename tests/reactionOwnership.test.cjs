'use strict';

// Being allowed to react is not being allowed to react AS SOMEBODY ELSE.
//
// Found while auditing for more of GHSA-pqr4-rxgp-hv2m (CommentBleed: the REST
// comment delete that checked board membership and nothing about WHOSE comment
// it was). A CardCommentReactions document holds
//
//   { cardCommentId, reactions: [ { reactionCodepoint, userIds: [...] } ] }
//
// and the whole array is ONE field, whose allow rule was board membership for
// insert, update and remove alike. So any member could $set `reactions` to
// anything: add a colleague's userId to a reaction they never made, or delete
// one they did. `toggleReaction()` only ever touches Meteor.userId(), so no
// legitimate client sends anything else - the rule simply never said so.
//
// Integrity rather than confidentiality (reactions are visible to the whole
// board already), but it puts words in another person's mouth.
//
// Run: node tests/reactionOwnership.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const {
  changesOnlyOwnReactions,
  denyForeignReactionChange,
} = require('../models/lib/reactionOwnership');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const ME = 'user-me';
const THEM = 'user-them';
const THUMB = '128077';
const HEART = '10084';

const set = reactions => ({ $set: { reactions } });

// ------------------------------------------------------- what must be allowed

test('adding my own reaction is allowed', () => {
  const before = [{ reactionCodepoint: THUMB, userIds: [THEM] }];
  const after = [{ reactionCodepoint: THUMB, userIds: [THEM, ME] }];
  assert.strictEqual(changesOnlyOwnReactions(before, after, ME), true);
});

test('removing my own reaction is allowed', () => {
  const before = [{ reactionCodepoint: THUMB, userIds: [THEM, ME] }];
  const after = [{ reactionCodepoint: THUMB, userIds: [THEM] }];
  assert.strictEqual(changesOnlyOwnReactions(before, after, ME), true);
});

test('the first reaction of all, and the last one going away, are allowed', () => {
  assert.strictEqual(changesOnlyOwnReactions([], [{ reactionCodepoint: THUMB, userIds: [ME] }], ME), true);
  assert.strictEqual(changesOnlyOwnReactions([{ reactionCodepoint: THUMB, userIds: [ME] }], [], ME), true);
});

test('a reordered array with the same membership is not a change', () => {
  // The client rebuilds the array on every toggle; order is not meaning.
  const before = [
    { reactionCodepoint: THUMB, userIds: [THEM, ME] },
    { reactionCodepoint: HEART, userIds: [THEM] },
  ];
  const after = [
    { reactionCodepoint: HEART, userIds: [THEM] },
    { reactionCodepoint: THUMB, userIds: [ME, THEM] },
  ];
  assert.strictEqual(changesOnlyOwnReactions(before, after, ME), true);
});

test('I may toggle several of my own reactions at once', () => {
  const before = [{ reactionCodepoint: THUMB, userIds: [ME, THEM] }];
  const after = [
    { reactionCodepoint: THUMB, userIds: [THEM] },
    { reactionCodepoint: HEART, userIds: [ME] },
  ];
  assert.strictEqual(changesOnlyOwnReactions(before, after, ME), true);
});

// -------------------------------------------------------- the attacks refused

test('THE ATTACK: adding somebody else to a reaction is refused', () => {
  const before = [{ reactionCodepoint: THUMB, userIds: [ME] }];
  const after = [{ reactionCodepoint: THUMB, userIds: [ME, THEM] }];
  assert.strictEqual(changesOnlyOwnReactions(before, after, ME), false);
});

test('THE ATTACK: deleting somebody else\'s reaction is refused', () => {
  const before = [{ reactionCodepoint: THUMB, userIds: [ME, THEM] }];
  const after = [{ reactionCodepoint: THUMB, userIds: [ME] }];
  assert.strictEqual(changesOnlyOwnReactions(before, after, ME), false);
});

test('wiping the whole array is refused when it was not only mine', () => {
  const before = [{ reactionCodepoint: THUMB, userIds: [THEM] }];
  assert.strictEqual(changesOnlyOwnReactions(before, [], ME), false);
});

test('moving somebody else from one reaction to another is refused', () => {
  const before = [{ reactionCodepoint: THUMB, userIds: [THEM] }];
  const after = [{ reactionCodepoint: HEART, userIds: [THEM] }];
  assert.strictEqual(changesOnlyOwnReactions(before, after, ME), false);
});

test('an anonymous caller changes nobody\'s reactions', () => {
  assert.strictEqual(changesOnlyOwnReactions([], [{ reactionCodepoint: THUMB, userIds: [ME] }], null), false);
  assert.strictEqual(changesOnlyOwnReactions([], [], ''), false);
});

// -------------------------------------------------------- the deny-rule shape

test('the deny rule refuses exactly the foreign changes', () => {
  const doc = { reactions: [{ reactionCodepoint: THUMB, userIds: [THEM] }] };
  // Mine: allowed.
  assert.strictEqual(
    denyForeignReactionChange(ME, doc, set([{ reactionCodepoint: THUMB, userIds: [THEM, ME] }])),
    false,
  );
  // Theirs: refused.
  assert.strictEqual(
    denyForeignReactionChange(ME, doc, set([{ reactionCodepoint: THUMB, userIds: [] }])),
    true,
  );
});

test('negative: an update that does not touch reactions is left alone', () => {
  const doc = { reactions: [{ reactionCodepoint: THUMB, userIds: [THEM] }] };
  assert.strictEqual(denyForeignReactionChange(ME, doc, { $set: { cardId: 'c1' } }), false);
  assert.strictEqual(denyForeignReactionChange(ME, doc, {}), false);
  assert.strictEqual(denyForeignReactionChange(ME, doc, null), false);
});

test('the modifier forms that cannot be checked field by field are refused', () => {
  // toggleReaction() always $sets the whole array, so nothing legitimate sends
  // these - and letting them through would be a hole exactly the size of the one
  // being closed.
  const doc = { reactions: [{ reactionCodepoint: THUMB, userIds: [THEM] }] };
  assert.strictEqual(denyForeignReactionChange(ME, doc, { $push: { reactions: {} } }), true);
  assert.strictEqual(denyForeignReactionChange(ME, doc, { $pull: { reactions: {} } }), true);
  assert.strictEqual(denyForeignReactionChange(ME, doc, { $addToSet: { 'reactions.0.userIds': THEM } }), true);
  assert.strictEqual(denyForeignReactionChange(ME, doc, { $unset: { reactions: '' } }), true);
});

test('negative: junk in the stored or incoming array does not throw or pass', () => {
  assert.strictEqual(changesOnlyOwnReactions(null, null, ME), true, 'nothing to nothing is no change');
  assert.strictEqual(
    changesOnlyOwnReactions('nonsense', [{ reactionCodepoint: THUMB, userIds: [THEM] }], ME),
    false,
    'inventing somebody else\'s reaction out of junk is still refused',
  );
  assert.strictEqual(
    changesOnlyOwnReactions([{ reactionCodepoint: THUMB, userIds: [THEM] }], 'nonsense', ME),
    false,
    'and deleting theirs by sending junk is refused',
  );
});

// -------------------------------------------------------------- the wiring

test('the deny rule is registered on the collection, with the reactions fetched', () => {
  const src = read('server/permissions/cardCommentReactions.js');
  assert.ok(/CardCommentReactions\.deny\(\{/.test(src), 'a deny rule exists');
  assert.ok(/denyForeignReactionChange\(userId, doc, modifier\)/.test(src));
  assert.ok(/fetch: \['reactions'\]/.test(src),
    'the deny rule must be given the stored reactions, or it has nothing to compare against');
});

test('the membership rule it sits on top of is unchanged', () => {
  const src = read('server/permissions/cardCommentReactions.js');
  // Read-only / no-comment members still may not react at all (the earlier fix).
  // Count the CALLS, not the import line that also carries the name.
  const allows = src.match(/allowIsBoardMemberCommentOnly\(userId,/g) || [];
  assert.strictEqual(allows.length, 3, 'insert, update and remove all still require comment rights');
});

console.log(`\n${passed} tests passed`);
