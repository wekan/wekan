'use strict';

// Two open issues that turned out to be answered by the code as it stands.
// Run: node tests/openIssuesVerifiedFromCode.test.cjs
//
// Both were in the CHANGELOG's TODO Later list as "needs the running app", and
// both are decided by files that can simply be read - so they are pinned here
// rather than left in a backlog:
//
//   #5052  ".eml attachments cannot be opened" - a blank page in the browser
//          and nothing usable in Thunderbird, after a board was copied.
//   #5081  "Correct display of owner, member and assignee on mini cards" -
//          owner on the very left, members next, assignees on the very right,
//          wrapping to a second right-aligned row when they do not fit.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Module = require('module');

const repoRoot = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(repoRoot, f), 'utf8');

const origResolve = Module._resolveFilename;
Module._resolveFilename = function(request, ...rest) {
  if (request === '/imports/lib/fileNameDisplay') {
    return path.join(repoRoot, 'imports', 'lib', 'fileNameDisplay.js');
  }
  return origResolve.call(this, request, ...rest);
};
const { sanitizeUploadFileName } = require('../models/lib/uploadFileName.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('openIssuesVerifiedFromCode:');

// ── #5052: .eml attachments ──────────────────────────────────────────────────

test('#5052: an .eml keeps its name through upload and through a board copy', () => {
  // The mechanism that could produce "cannot open .eml": a mangled name. An
  // unknown MIME used to append .bin (#6589), and Thunderbird will not open a
  // .bin. Every type a mail file arrives as now keeps the extension.
  for (const type of ['message/rfc822', 'application/octet-stream', '', null]) {
    assert.strictEqual(sanitizeUploadFileName('mail.eml', type), 'mail.eml',
      `an .eml sent as ${JSON.stringify(type)} must stay an .eml`);
  }
  // The copy path runs the same function, so a copied board's attachments are
  // named like the originals.
  const store = read('models/lib/fileStoreStrategy.js');
  const copy = store.slice(store.indexOf('export const copyFile'));
  assert.ok(/sanitizeUploadFileName\(fileObj\.name, fileObj\.type\)/.test(copy.slice(0, 1200)),
    'copyFile names the copy with the same rule the upload used');
});

test('#5052: an .eml is served as a download, not rendered in the browser', () => {
  // The other mechanism: served inline, a browser shows a blank page for a type
  // it cannot render. message/rfc822 is neither in the dangerous list nor the
  // safe-inline one, so it takes the "unknown types" branch - which forces the
  // download with the file's own name.
  const server = read('server/routes/universalFileServer.js');
  const lists = server.slice(server.indexOf('const dangerousTypes'), server.indexOf('const isSvg'));
  assert.ok(!/message\/rfc822/.test(lists),
    'message/rfc822 is in neither list, which is what sends it down the fallback');
  const fallback = server.slice(server.indexOf('// Unknown types: force download as fallback'));
  const branch = fallback.slice(0, fallback.indexOf('\n      }'));
  assert.ok(/Content-Type', 'application\/octet-stream'/.test(branch), 'downloaded, not rendered');
  assert.ok(/buildContentDispositionHeader\('attachment'/.test(branch), 'as an attachment');
  assert.ok(/sanitizeFilenameForHeader\(fileObj\.name\)/.test(branch),
    'under its own name, so Thunderbird sees an .eml');
});

test('#5052: an attachment whose recorded path is wrong is still found', () => {
  // And the third: the file is there under a name the database does not know.
  // Reading, renaming and deleting all go through the same search (#6589).
  const store = read('models/lib/fileStoreStrategy.js');
  assert.ok(/resolveExistingPath\(\)/.test(store));
  const getReadStream = store.slice(store.indexOf('  getReadStream() {',
    store.indexOf('candidatePaths()')));
  assert.ok(/this\.resolveExistingPath\(\)/.test(getReadStream.slice(0, 300)));
});

// ── #5081: the minicard avatar row ───────────────────────────────────────────

test('#5081: owner on the left, members next, assignees on the right', () => {
  // The request, in the reporter's words: "Owner is on the very left, followed
  // by members (if there are any) and on the very right there are the
  // assignees."
  //
  // That is what the current markup and CSS produce, and the reason is the
  // float: three siblings that float to the inline end are laid out RIGHT to
  // left in DOM order. So DOM order assignees, members, creator renders as
  // creator | members | assignees, left to right.
  const jade = read('client/components/cards/minicard.jade');
  const assignees = jade.indexOf('.minicard-assignees');
  const members = jade.indexOf('.minicard-members');
  const creator = jade.indexOf('.minicard-creator');
  assert.ok(assignees !== -1 && members !== -1 && creator !== -1, 'all three groups exist');
  assert.ok(assignees < members && members < creator,
    'DOM order assignees, members, creator - which floats render in reverse');

  const css = read('client/components/cards/minicard.css');
  const rule = css.slice(css.indexOf('.minicard .minicard-members,'));
  const block = rule.slice(0, rule.indexOf('}'));
  assert.ok(/float:\s*inline-end/.test(block),
    'they float to the inline end, which is what puts the creator leftmost');
});

test('#5081: a row that does not fit wraps, still right-aligned', () => {
  // "If it does not fit into one row or get to close i would put the assignees
  // in a new line but still right aligned." Floated avatars do that by
  // themselves - each avatar floats too, so the group wraps within the card.
  const css = read('client/components/cards/minicard.css');
  const avatarRule = css.slice(css.indexOf('.minicard .minicard-members .member,'));
  const block = avatarRule.slice(0, avatarRule.indexOf('}'));
  assert.ok(/float:\s*inline-end/.test(block), 'each avatar floats to the inline end');
  assert.ok(/margin-bottom/.test(block), 'with room between the wrapped rows');
});

test('#5081: an empty group takes no space (negative)', () => {
  // "members (if there are any)": an empty members or assignees container must
  // not leave a gap where the group would have been.
  const css = read('client/components/cards/minicard.css');
  assert.ok(/\.minicard \.minicard-members:empty,\s*\n\.minicard \.minicard-assignees:empty \{\s*\n\s*display: none;/.test(css),
    'empty groups are display:none');
});

console.log(`\nopenIssuesVerifiedFromCode: ${passed} tests passed`);
