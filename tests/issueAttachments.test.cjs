'use strict';

// Guard: an imported GitHub / GitLab / Gitea / Forgejo issue brings its files
// along, into Admin Panel / Attachments / Default Storage.
// Run: node tests/issueAttachments.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { issueAttachments, MAX_ATTACHMENTS_PER_ISSUE } = require('../models/lib/issueAttachments.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log(`ok - ${name}`); }
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

test('GitHub: user-attachments and user-images links in the body and comments', () => {
  const files = issueAttachments({
    body: 'See ![screenshot](https://github.com/user-attachments/assets/0b2c4e1a-1111-2222-3333-444455556666)\n'
      + '<img width="300" src="https://user-images.githubusercontent.com/1/abc.png">',
    comments: [{ body: '[log.txt](https://github.com/user-attachments/files/123/log.txt)' }],
  });
  assert.deepStrictEqual(files.map(f => f.name), ['screenshot', 'abc.png', 'log.txt']);
});

test('Gitea / Forgejo: assets of the issue and its comments, and /attachments/<uuid> links', () => {
  const files = issueAttachments({
    body: '![a](https://gitea.example.com/attachments/0b2c4e1a-1111-2222-3333-444455556666)',
    assets: [{ name: 'trace.zip', browser_download_url: 'https://gitea.example.com/attachments/aaaaaaaa-1111-2222-3333-444455556666', size: 5 }],
    comments_data: [{ body: 'x', assets: [{ name: 'c.png', browser_download_url: 'https://gitea.example.com/attachments/bbbbbbbb-1111-2222-3333-444455556666' }] }],
  });
  assert.deepStrictEqual(files.map(f => f.name), ['trace.zip', 'a', 'c.png']);
  assert.strictEqual(files[0].size, 5);
});

test('GitLab: /uploads/ links resolved against the project from web_url', () => {
  const files = issueAttachments({
    web_url: 'https://gitlab.com/group/proj/-/issues/9',
    description: '![shot](/uploads/0123456789abcdef0123456789abcdef/shot.png)',
  });
  assert.deepStrictEqual(files, [{ name: 'shot.png', url: 'https://gitlab.com/group/proj/uploads/0123456789abcdef0123456789abcdef/shot.png' }]);
});

test('negative: ordinary links, relative paths and other hosts are not files', () => {
  assert.deepStrictEqual(issueAttachments({
    body: '[docs](https://example.com/page) [rel](/uploads/x/y.png) ![x](javascript:alert(1)) '
      + '[gh](https://github.com/o/r/issues/1) [file](ftp://host/file)',
  }), []);
  assert.deepStrictEqual(issueAttachments(null), []);
  assert.deepStrictEqual(issueAttachments({ comments: 4 }), []);
});

test('each file once, and at most the per-issue cap', () => {
  const url = n => `https://github.com/user-attachments/files/${n}/f${n}.txt`;
  const body = Array.from({ length: MAX_ATTACHMENTS_PER_ISSUE + 10 }, (_, i) => `[f](${url(i)}) [f](${url(i)})`).join(' ');
  assert.strictEqual(issueAttachments({ body }).length, MAX_ATTACHMENTS_PER_ISSUE);
});

test('the parsers pass them on and the creator downloads them safely into default storage', () => {
  const parsers = read('models/lib/externalParsers.js');
  assert.strictEqual((parsers.match(/\.\.\.withAttachments\(issue\)/g) || []).length, 2, 'GitHub/Gitea and GitLab');
  const creator = read('models/kanboardCreator.js');
  // Through the import's sign-in plan (models/lib/importAttachmentAuth.js),
  // which ends in the same SSRF-guarded fetchImportedAttachment.
  assert.match(creator, /downloadImportAttachment\(this\.source, att, attachmentAuth\.get\(this\)\)/);
  assert.match(read('models/lib/importAttachmentDownload.js'), /await fetchImportedAttachment\(request\.url, \{ headers: request\.headers \}\)/);
  assert.match(creator, /Attachments\.writeAsync\(downloaded\.buffer, \{[\s\S]*?\}, true\)/);
  // negative: Meteor-Files' own download follows redirects unchecked (FollowBleed)
  assert.doesNotMatch(creator, /Attachments\.loadAsync\(/);
});

console.log(`# ${passed} passed`);
