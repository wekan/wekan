'use strict';

// Every attachment upload is started from one config builder.
// Run: node tests/attachmentUploadConfig.test.cjs
//
// Two fields of that config are not optional in the way they look, and neither
// says so when it is missing:
//
//   * `fileId`, and the SAME id copied into `meta.fileId`. Attachments'
//     namingFunction (models/attachments.js) decides the name the file is
//     stored under, and on the client it reads that id out of `meta` and
//     deletes it. Without it the name is `undefined`.
//   * `transport` - HTTP everywhere, DDP on Sandstorm, whose http-bridge strips
//     Meteor-Files' `x-*` upload headers so every chunk is rejected with "Can't
//     continue upload, session expired" [408].
//
// The board-background uploader was written by hand and had NEITHER, so
// "Upload background image" did nothing at all. It is one builder now, so the
// next uploader gets both by asking for a config.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const lib = read('client/lib/attachmentUploadConfig.js');
const cardUploads = read('client/components/cards/attachments.js');
const sidebar = read('client/components/sidebar/sidebar.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('attachmentUploadConfig:');

test('the id is generated once and stamped into meta', () => {
  assert.ok(/const fileId = new ObjectId\(\)\.toString\(\);/.test(lib), 'an id is made');
  assert.ok(/fileId,\n\s*fileName/.test(lib), 'the config carries it');
  assert.ok(/meta: \{ \.\.\.meta, fileId \}/.test(lib),
    'and meta carries the SAME one - which is where the naming function reads it');
  const naming = read('models/attachments.js');
  assert.ok(/fileId = opts\.meta\.fileId;\n\s*delete opts\.meta\.fileId;/.test(naming),
    'because that is what the naming function does with it');
});

test('the transport is DDP on Sandstorm and HTTP elsewhere', () => {
  assert.ok(/transport: Meteor\.settings\?\.public\?\.sandstorm \? 'ddp' : 'http'/.test(lib),
    'one rule');
  assert.ok(/http-bridge strips/.test(lib), 'with the reason written down');
});

test('every uploader uses it - none builds its own config (negative)', () => {
  for (const [what, source] of [['the card', cardUploads], ['the board background', sidebar]]) {
    assert.ok(/buildAttachmentUploadConfig\(\{/.test(source), `${what} asks the builder`);
    assert.ok(!/config\.meta\.fileId = fileId/.test(source),
      `${what} does not stamp the id by hand any more`);
    assert.ok(!/chunkSize: 'dynamic',\n\s*transport:/.test(source),
      `${what} has no second copy of the transport rule`);
  }
  // Two card call sites - the file picker and a pasted image - and one
  // background uploader.
  assert.strictEqual((cardUploads.match(/buildAttachmentUploadConfig\(/g) || []).length, 2,
    'both card uploads');
  assert.strictEqual((sidebar.match(/buildAttachmentUploadConfig\(/g) || []).length, 1,
    'and the background upload');
});

test('a file with no usable name still gets one (negative)', () => {
  // A pasted image has no name; a name that sanitizes to nothing must not
  // become an empty one, or the upload is stored under "".
  assert.ok(/type\.replace\('image\/', 'clipboard\.'\)/.test(lib), 'a pasted image is named by its type');
  assert.ok(/Empty-filename-after-sanitize\.txt/.test(lib), 'and a sanitized-away name has a fallback');
  assert.ok(/sanitizeText/.test(lib), 'the name goes through the sanitizer first');
});

test('the board background is still filed as one', () => {
  const handler = sidebar.slice(sidebar.indexOf("'change .js-bg-upload-input'"));
  const body = handler.slice(0, handler.indexOf('\n  },'));
  assert.ok(/meta: \{ boardId: tpl\.boardId, source: 'board-background' \}/.test(body),
    'the meta that makes it a background, not a card attachment');
  const publication = read('server/publications/backgrounds.js');
  assert.ok(/'meta\.source': 'board-background'/.test(publication),
    'which is what the publication looks for');
});

test('a failed background upload SAYS so (negative)', () => {
  // It can fail before there is an uploader to listen to - a config the
  // collection refuses, a name its namingFunction cannot build. That rejected
  // into nothing: the spinner stopped, no message appeared, and the picture
  // just never turned up in the list, which is how this bug hid.
  const handler = sidebar.slice(sidebar.indexOf("'change .js-bg-upload-input'"));
  const body = handler.slice(0, handler.indexOf('\n  },'));
  assert.ok(/try \{/.test(body) && /\} catch \(error\) \{/.test(body),
    'the insert is inside a try');
  assert.ok(/tpl\.error\.set\(\(error && \(error\.reason \|\| error\.message\)\) \|\| 'upload-failed'\)/
    .test(body), 'and what went wrong is shown in the popup');
  assert.ok(/tpl\.uploading\.set\(false\);\n\s+console\.error/.test(body),
    'the spinner stops and the console says why');
  assert.ok(/input\.value = '';/.test(body),
    'and the same file can be picked again after a failure');
  const jade = read('client/components/sidebar/sidebar.jade');
  assert.ok(/if error\.get\n\s+\.warning \{\{_ error\.get\}\}/.test(jade),
    'which the template draws');
});

console.log(`\nattachmentUploadConfig: ${passed} tests passed`);
