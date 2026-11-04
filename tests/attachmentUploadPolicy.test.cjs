'use strict';

// #6870: attachments off for the whole installation. The switch exists already - Admin Panel /
// Attachments / Transfer limits, "Attachments upload" and "API upload" set to Blocked - and the
// server refuses on every path. What the card lacked was to STOP OFFERING the upload. This pins
// the client side, and the server enforcement it relies on, so the two cannot drift apart.
//
// Run: node tests/attachmentUploadPolicy.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { uploadPolicy } = require('../models/lib/attachmentUploadPolicy');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

test('only a real true blocks uploads', () => {
  assert.deepEqual(uploadPolicy({ attachmentsUploadBlocked: true }), { uploadsBlocked: true });
  for (const v of [undefined, null, {}, [], 'x', { attachmentsUploadBlocked: false },
    { attachmentsUploadBlocked: 'true' }, { attachmentsUploadBlocked: 1 }, { apiUploadBlocked: true }]) {
    assert.deepEqual(uploadPolicy(v), { uploadsBlocked: false }, JSON.stringify(v));
  }
});

test('negative: the answer carries only the boolean, nothing about limits or storage', () => {
  const answer = uploadPolicy({ attachmentsUploadBlocked: true, attachmentsUploadMaxBytes: 5, apiUploadMaxBytes: 7, secret: 'x' });
  assert.deepEqual(Object.keys(answer), ['uploadsBlocked']);
});

test('the method answers signed-in users only, and falls back to "not blocked" on a read error', () => {
  const src = read('server/methods/attachmentUploadPolicy.js');
  assert.match(src, /async attachmentUploadPolicy\(\) \{\s*if \(!this\.userId\) throw new Meteor\.Error\('error-notAuthorized'\);/);
  assert.match(src, /catch \(error\) \{[^}]*limitSettings = undefined;/);
});

test('the card offers the "+" only when uploads are not blocked', () => {
  const jade = read('client/components/cards/attachments.jade');
  assert.match(jade, /if canAddAttachment\s*\n\s*a\.card-label\.add-label\.add-attachment\.js-add-attachment/);
  assert.doesNotMatch(jade, /if canModifyCard\s*\n\s*a\.card-label\.add-label\.add-attachment/, 'the old condition is gone');
  const js = read('client/components/cards/attachments.js');
  assert.match(js, /canAddAttachment\(\) \{\s*return Utils\.canModifyCard\(\) && !attachmentUploadsBlocked\(\);/);
  // and a drop or paste does nothing either
  assert.match(js, /if \(attachmentUploadsBlocked\(\)\) return \[\];\s*\n\s*\/\/ Check if board allows attachments/);
});

test('the client asks once a minute at most and shows uploads until the server answers', () => {
  const src = read('client/lib/attachmentUploadPolicy.js');
  assert.match(src, /new ReactiveVar\(false\)/);
  assert.match(src, /Date\.now\(\) - askedAt < 60 \* 1000/);
  assert.match(src, /catch\(\(\) => \{ askedAt = 0; \}\)/);
});

test('the server refuses on every upload path whatever the client shows', () => {
  const pipeline = read('models/attachments.server.js');
  assert.match(pipeline, /uploadsBlocked = settings\?\.limitSettings\?\.attachmentsUploadBlocked === true/);
  const methods = read('server/attachmentApi.js');
  const routes = read('server/routes/attachmentApi.js');
  // api.attachment.upload and api.attachment.copy, the HTTP upload, upload-background and copy
  assert.equal((methods.match(/if \(apiUploadBlocked\)/g) || []).length >= 2, true, 'upload and copy methods');
  assert.equal((routes.match(/if \(apiUploadBlocked\)/g) || []).length >= 3, true, 'upload, background and copy routes');
});

test('negative: there is no second "disable attachments" setting to disagree with the server', () => {
  for (const f of ['models/settings.js', 'server/publications/settings.js', 'client/components/settings/settingBody.jade']) {
    assert.doesNotMatch(read(f), /disableAttachments/, f);
  }
});
