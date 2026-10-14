'use strict';

// #140: real-time shared editing of card descriptions with Yjs.
// Run: node tests/sharedDescription.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Y = require('yjs');
const {
  textDiff, applyTextChange, initialText, isStale, bytesToBase64, base64ToBytes, IDLE_MS,
} = require('../models/lib/sharedDescription.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

// The textarea's change is the one contiguous edit.
assert.deepEqual(textDiff('hello world', 'hello brave world'), { index: 6, remove: 0, insert: 'brave ' });
assert.deepEqual(textDiff('hello world', 'hello'), { index: 5, remove: 6, insert: '' });
assert.deepEqual(textDiff('aaa', 'aaaa'), { index: 3, remove: 0, insert: 'a' });
assert.deepEqual(textDiff('same', 'same'), { index: 4, remove: 0, insert: '' });
assert.deepEqual(textDiff('a😀b', 'a😃b'), { index: 1, remove: 2, insert: '😃' }, 'an emoji is replaced whole');
console.log('  ok - the smallest edit, never half an emoji');

// Two people typing at once both keep what they typed (the issue).
function editor(state) {
  const doc = new Y.Doc();
  if (state) Y.applyUpdate(doc, state);
  return doc;
}
const server = editor();
server.getText('description').insert(0, 'Steps:\n1. build\n');
const alice = editor(Y.encodeStateAsUpdate(server));
const bob = editor(Y.encodeStateAsUpdate(server));
const at = doc => doc.getText('description');
applyTextChange(at(alice), at(alice).toString(), 'Steps:\n1. build\n2. test\n');
applyTextChange(at(bob), at(bob).toString(), 'Release steps:\n1. build\n');
for (const doc of [alice, bob]) Y.applyUpdate(server, Y.encodeStateAsUpdate(doc));
for (const doc of [alice, bob]) Y.applyUpdate(doc, Y.encodeStateAsUpdate(server));
assert.equal(at(server).toString(), 'Release steps:\n1. build\n2. test\n');
assert.equal(at(alice).toString(), at(server).toString());
assert.equal(at(bob).toString(), at(server).toString());
// The same state applied again changes nothing - the publication resends it.
Y.applyUpdate(alice, Y.encodeStateAsUpdate(server));
assert.equal(at(alice).toString(), 'Release steps:\n1. build\n2. test\n');
console.log('  ok - concurrent edits merge, and a repeated state is harmless');

// The caret stays on the text it was in when someone else types before it.
const caret = Y.createRelativePositionFromTypeIndex(at(alice), at(alice).toString().indexOf('test'));
applyTextChange(at(bob), at(bob).toString(), `Draft. ${at(bob).toString()}`);
Y.applyUpdate(alice, Y.encodeStateAsUpdate(bob));
const index = Y.createAbsolutePositionFromRelativePosition(caret, alice).index;
assert.equal(at(alice).toString().slice(index, index + 4), 'test');
console.log('  ok - the caret follows remote edits');

// First sync: no draft adopts the shared text; a draft is kept and sent.
assert.deepEqual(initialText({ textarea: 'saved', saved: 'saved', shared: 'saved + typing' }), { text: 'saved + typing', push: false });
assert.deepEqual(initialText({ textarea: 'my draft', saved: 'saved', shared: 'saved + typing' }), { text: 'my draft', push: true });
assert.deepEqual(initialText({ textarea: 'x', saved: 'saved', shared: 'x' }), { text: 'x', push: false });
assert.equal(isStale({ updatedAt: new Date() }), false);
assert.equal(isStale({ updatedAt: new Date(Date.now() - IDLE_MS - 1) }), true);
assert.equal(isStale(null), true);
console.log('  ok - first sync and idle documents');

// Encoding round trip, and malformed input refused.
const bytes = Y.encodeStateAsUpdate(server);
assert.deepEqual(base64ToBytes(bytesToBase64(bytes)), bytes);
for (const bad of ['%%%', 'abc', 42, null, 'ab=c']) assert.throws(() => base64ToBytes(bad), String(bad));
console.log('  ok - base64 round trip, malformed refused');

// Server: only an editor of the card sees or changes the shared document.
const srv = read('server/sharedDescription.js');
assert.match(srv, /CardDescriptionDocs\.deny\(\{ insert: \(\) => true, update: \(\) => true, remove: \(\) => true \}\);/);
assert.match(srv, /Meteor\.publish\('cardDescriptionDoc', async function \(cardId\) \{\s*check\(cardId, String\);\s*const card = await editableCard\(this\.userId, cardId\);\s*if \(!card\) return this\.ready\(\);/);
assert.match(srv, /const card = await editableCard\(this\.userId, cardId\);\s*if \(!card\) throw new Meteor\.Error\('not-authorized'\);/);
assert.match(srv, /canEditCardOrLinkedCard\(userId, card, null, \{ recordDenial: false \}\)/);
assert.match(srv, /if \(update\.length > Math\.ceil\(MAX_UPDATE_BYTES \/ 3\) \* 4\) throw/, 'the update is size-checked before it is decoded');
assert.match(srv, /if \(state\.length > MAX_STATE_BYTES\) throw/);
assert.match(srv, /if \(generation !== current\) throw new Meteor\.Error\('description-doc-reset'\);/);
assert.match(srv, /\{ _id: cardId, generation, state: before \}/, 'the write is conditional on the state it merged into');
assert.match(srv, /DDPRateLimiter\.addRule\(\{ type: 'method', name: 'applyCardDescriptionUpdate'/);
assert.match(read('server/imports.js'), /^import '\/server\/sharedDescription';$/m);
console.log('  ok - editors only, sizes, resets, races, rate limit');

// Negative: the shared document is not published or written anywhere else.
const offenders = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    // _build-local-test and the like: rspack's bundled copy of every file.
    if (['node_modules', '.tools', '.build', '.meteor', '.git'].includes(entry.name) || entry.name.startsWith('_build')) continue;
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(rel);
    else if (/\.js$/.test(entry.name) && !['server/sharedDescription.js', 'client/lib/sharedDescription.js'].includes(rel)
      && /cardDescriptionDocs|CardDescriptionDocs/.test(read(rel))) offenders.push(rel);
  }
})('.');
assert.deepEqual(offenders, [], 'no other module reads or writes the shared document');
console.log('  ok - nowhere else');

// UI: the description form joins the shared document and leaves it.
const form = read('client/components/cards/cardDescription.js');
assert.match(form, /Template\.descriptionForm\.onRendered\(function \(\) \{[\s\S]{0,200}attachSharedDescription\(\{/);
assert.match(form, /textarea: this\.find\('textarea\.js-new-description-input'\)/);
assert.match(form, /if \(this\.sharedDescription\) this\.sharedDescription\.detach\(\);/);
assert.match(form, /tpl\.sharedDescription\.flush\(\);\s*await this\.setDescription\(description\);/, 'flushed before the save');
const client = read('client/lib/sharedDescription.js');
assert.match(client, /if \(doc\.generation !== generation\) start\(doc\);\s*else merge\(doc\);/);
assert.match(client, /if \(origin !== 'local'\) return;/, 'a remote update is never sent back');
assert.match(read('package.json'), /"yjs": "13\.6\.33"/);
console.log('  ok - the description form');
console.log('\nsharedDescription: all tests passed');
