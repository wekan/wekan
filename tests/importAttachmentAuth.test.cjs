'use strict';

// The attachment files of a Jira, Nextcloud Deck, OpenProject, Asana or GitLab
// import (models/lib/importAttachmentAuth.js): each service's documented
// download, with the sign-in the import page asks for - sent only to the
// address the member typed, never stored, never logged.
// Run: node tests/importAttachmentAuth.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  ATTACHMENT_AUTH_SOURCES, attachmentAuthFields, isAttachmentAuthShape, attachmentSignIn, attachmentRequest,
} = require('../models/lib/importAttachmentAuth.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log(`ok - ${name}`); };
const basic = (u, p) => `Basic ${Buffer.from(`${u}:${p}`).toString('base64')}`;

const JIRA = { url: 'https://acme.atlassian.net', username: 'me@acme.test', token: 'jira-token' };

test('the five services and what each asks for; Zenkit publishes no download', () => {
  assert.deepEqual(ATTACHMENT_AUTH_SOURCES, ['jira', 'deck', 'openproject', 'asana', 'gitlab']);
  assert.deepEqual(attachmentAuthFields('jira'), { url: true, username: true });
  assert.deepEqual(attachmentAuthFields('deck'), { url: true, username: true });
  assert.deepEqual(attachmentAuthFields('openproject'), { url: true, username: false });
  assert.deepEqual(attachmentAuthFields('asana'), { url: false, username: false });
  assert.deepEqual(attachmentAuthFields('gitlab'), { url: true, username: false });
  assert.equal(attachmentAuthFields('zenkit'), null);
  assert.equal(attachmentAuthFields('trello'), null);
});

test('each service signs in the way its API documents', () => {
  assert.deepEqual(attachmentSignIn('jira', JIRA).headers, { Authorization: basic('me@acme.test', 'jira-token') });
  assert.deepEqual(attachmentSignIn('deck', { url: 'https://cloud.example.test/nc/', username: 'ann', token: 'app-pw' }),
    { origin: 'https://cloud.example.test', base: 'https://cloud.example.test/nc',
      headers: { Authorization: basic('ann', 'app-pw'), 'OCS-APIRequest': 'true' } });
  assert.deepEqual(attachmentSignIn('openproject', { url: 'https://op.example.test', token: 'k' }).headers,
    { Authorization: basic('apikey', 'k') });
  assert.deepEqual(attachmentSignIn('asana', { token: 'pat' }),
    { origin: 'https://app.asana.com', base: 'https://app.asana.com', headers: { Authorization: 'Bearer pat' } });
  assert.deepEqual(attachmentSignIn('gitlab', { url: 'https://gitlab.example.test', token: 'glpat' }).headers,
    { Authorization: 'Bearer glpat' });
});

test('Jira: the content address, with the sign-in', () => {
  const r = attachmentRequest('jira', { name: 'a.png', url: 'https://acme.atlassian.net/rest/api/3/attachment/content/10003' }, JIRA);
  assert.deepEqual(r, { url: 'https://acme.atlassian.net/rest/api/3/attachment/content/10003',
    headers: { Authorization: basic('me@acme.test', 'jira-token') } });
});

test('Deck: v1.0 for files kept in Deck, v1.1 for Nextcloud Files', () => {
  const auth = { url: 'https://cloud.example.test/nc', username: 'ann', token: 'pw' };
  const att = type => ({ name: 'a', deck: { boardId: 1, stackId: 2, cardId: 3, id: 4, type } });
  assert.equal(attachmentRequest('deck', att('deck_file'), auth).url,
    'https://cloud.example.test/nc/index.php/apps/deck/api/v1.0/boards/1/stacks/2/cards/3/attachments/4');
  assert.equal(attachmentRequest('deck', att('file'), auth).url,
    'https://cloud.example.test/nc/index.php/apps/deck/api/v1.1/boards/1/stacks/2/cards/3/attachments/4');
  assert.equal(attachmentRequest('deck', att('file'), auth).headers['OCS-APIRequest'], 'true');
  // negative: an id that is not a number never becomes part of a path
  assert.match(attachmentRequest('deck', { name: 'a', deck: { boardId: 1, stackId: '../2', cardId: 3, id: 4 } }, auth).lost, /incomplete Deck ids/);
});

test('OpenProject: the download link is relative to the instance', () => {
  const r = attachmentRequest('openproject', { name: 'a', path: '/api/v3/attachments/1/content' }, { url: 'https://op.example.test', token: 'k' });
  assert.deepEqual(r, { url: 'https://op.example.test/api/v3/attachments/1/content', headers: { Authorization: basic('apikey', 'k') } });
  // negative: a protocol-relative "path" would name another host
  assert.match(attachmentRequest('openproject', { name: 'a', path: '//evil.example/x' }, { url: 'https://op.example.test', token: 'k' }).lost, /not a path/);
});

test('Asana: the record first, then its short-lived download_url without the token', () => {
  const r = attachmentRequest('asana', { name: 'a', asanaGid: '5' }, { token: 'pat' });
  assert.deepEqual(r, { url: 'https://app.asana.com/api/1.0/attachments/5?opt_fields=download_url,name',
    headers: { Authorization: 'Bearer pat' }, then: 'asana' });
  const download = read('models/lib/importAttachmentDownload.js');
  assert.match(download, /const file = await fetchImportedAttachment\(downloadUrl\);/, 'the signed address gets no token');
  // Without a token, a download_url the export still holds is tried as it is.
  assert.deepEqual(attachmentRequest('asana', { name: 'a', asanaGid: '5', url: 'https://s3.example.test/x' }), { url: 'https://s3.example.test/x', headers: {} });
  assert.match(attachmentRequest('asana', { name: 'a', asanaGid: '5' }).lost, /Asana access token/);
});

test('GitLab: an upload of a private project through the API, with the token', () => {
  const auth = { url: 'https://gitlab.example.test', token: 'glpat' };
  const secret = '0123456789abcdef0123456789abcdef';
  assert.deepEqual(attachmentRequest('gitlab', { name: 'l.txt', url: `https://gitlab.example.test/grp/sub/proj/uploads/${secret}/l.txt` }, auth),
    { url: `https://gitlab.example.test/api/v4/projects/grp%2Fsub%2Fproj/uploads/${secret}/l.txt`, headers: { Authorization: 'Bearer glpat' } });
  assert.equal(attachmentRequest('gitlab', { name: 'l', url: `https://gitlab.example.test/-/project/42/uploads/${secret}/l.txt` }, auth).url,
    `https://gitlab.example.test/api/v4/projects/42/uploads/${secret}/l.txt`);
  // Without a token a public project's upload downloads as before.
  assert.deepEqual(attachmentRequest('gitlab', { name: 'l', url: `https://gitlab.com/a/b/uploads/${secret}/l.txt` }),
    { url: `https://gitlab.com/a/b/uploads/${secret}/l.txt`, headers: {} });
});

test('negative: the sign-in goes ONLY to the address the member typed', () => {
  // An export file names whatever URL it likes.
  assert.deepEqual(attachmentRequest('jira', { name: 'x', url: 'https://attacker.example/steal' }, JIRA),
    { url: 'https://attacker.example/steal', headers: {} });
  assert.deepEqual(attachmentRequest('jira', { name: 'x', url: 'https://acme.atlassian.net.attacker.example/x' }, JIRA).headers, {});
  assert.deepEqual(attachmentRequest('jira', { name: 'x', url: 'http://acme.atlassian.net/x' }, JIRA).headers, {}, 'not over another scheme');
  const gitlab = { url: 'https://gitlab.example.test', token: 'glpat' };
  const secret = '0123456789abcdef0123456789abcdef';
  assert.deepEqual(attachmentRequest('gitlab', { name: 'l', url: `https://gitlab.com/a/b/uploads/${secret}/l.txt` }, gitlab).headers, {});
  // An Asana gid that is not a number never reaches the address.
  assert.match(attachmentRequest('asana', { name: 'a', asanaGid: '5/../../x' }, { token: 'pat' }).lost, /Asana access token/);
  // and a redirect elsewhere drops Authorization (Jira's media store is one).
  const guard = read('server/lib/ssrfGuard.js');
  assert.match(guard, /if \(nextOrigin !== origin\) \{[\s\S]{0,600}\/\^\(authorization\|cookie\|proxy-authorization\)\$\/i/);
  // Every header the services use is Authorization - or OCS-APIRequest, which is not a secret.
  const src = read('models/lib/importAttachmentAuth.js');
  assert.doesNotMatch(src, /PRIVATE-TOKEN|Zenkit-API-Key|X-Api-Key/i);
});

test('negative: incomplete or malformed sign-ins are no sign-in', () => {
  assert.equal(attachmentSignIn('jira', { url: 'https://acme.atlassian.net', token: 't' }), null, 'Jira needs the email');
  assert.equal(attachmentSignIn('jira', { url: 'https://u:p@acme.atlassian.net', username: 'a', token: 't' }), null);
  assert.equal(attachmentSignIn('openproject', { url: 'ftp://op.example.test', token: 't' }), null);
  assert.equal(attachmentSignIn('openproject', { url: 'https://op.example.test', token: '  ' }), null);
  assert.equal(attachmentSignIn('zenkit', { token: 't' }), null);
  assert.match(attachmentRequest('jira', { name: 'x', url: 'https://acme.atlassian.net/rest/api/3/attachment/content/1' }).lost, /Jira address, email and API token/);
  assert.match(attachmentRequest('openproject', { name: 'a', path: '/api/v3/attachments/1/content' }).lost, /sign-in on the import page/);
  assert.equal(isAttachmentAuthShape(undefined), true);
  assert.equal(isAttachmentAuthShape({ url: 'a', username: 'b', token: 'c' }), true);
  assert.equal(isAttachmentAuthShape({ token: 'c', extra: 'x' }), false);
  assert.equal(isAttachmentAuthShape({ token: 5 }), false);
  assert.equal(isAttachmentAuthShape({ token: 'x'.repeat(2049) }), false);
  assert.equal(isAttachmentAuthShape(['x']), false);
});

test('never stored, never logged: held beside the creators, checked by the method', () => {
  for (const file of ['models/kanboardCreator.js', 'models/jiraCreator.js']) {
    const src = read(file);
    assert.match(src, /const attachmentAuth = new WeakMap\(\);/, file);
    assert.match(src, /if \(data && data\.attachmentAuth\) attachmentAuth\.set\(this, data\.attachmentAuth\);/, file);
    // negative: never a field of the creator, which the import run reads
    assert.doesNotMatch(src, /this\.attachmentAuth\s*=/, file);
  }
  const method = read('models/import.js');
  assert.match(method, /check\(data\.attachmentAuth, Match\.Maybe\(Match\.Where\(isAttachmentAuthShape\)\)\);/);
  // the check is before the first await (audit-argument-checks)
  assert.ok(method.indexOf('check(data.attachmentAuth') < method.indexOf('await assertImportEnabled()'));
  // The REST import takes it too, checked the same way.
  assert.match(read('server/models/boards.js'), /if \(!isAttachmentAuthShape\(body\.attachmentAuth\)\) \{[\s\S]{0,200}additionalData\.attachmentAuth = body\.attachmentAuth;/);
  // No log line anywhere on the path names the sign-in or the request headers.
  for (const file of ['models/lib/importAttachmentAuth.js', 'models/lib/importAttachmentDownload.js',
    'models/kanboardCreator.js', 'models/jiraCreator.js', 'models/import.js']) {
    for (const line of read(file).split('\n').filter(l => /console\.|securityLog|record\(/.test(l))) {
      assert.doesNotMatch(line, /attachmentAuth|headers|token|signIn/i, `${file}: ${line.trim()}`);
    }
  }
  // The page empties the token field and forgets the sign-in after one call.
  const page = read('client/components/import/import.js');
  assert.match(page, /field\('\.js-import-attachment-token'\)\.value = '';/);
  assert.match(page, /importTpl\.attachmentAuth = null;\n  return auth \? \{ attachmentAuth: auth \} : \{\};/);
  assert.doesNotMatch(page, /Session\.set\([^)]*attachment[A-Za-z]*Auth/i, 'not in the Session, which survives a hot code push');
  const jade = read('client/components/import/import.jade');
  assert.match(jade, /input\.js-import-attachment-token\(id='import-attachment-token' type='password' autocomplete='new-password'/);
});

test('the selection: attachments left out are not downloaded', () => {
  assert.match(read('models/kanboardCreator.js'), /if \(!Meteor\.isServer \|\| !this\.wantsAttachments \|\|/);
  const { pruneImportDocument } = require('../models/lib/importParts.js');
  const doc = { issues: [{ fields: { attachment: [{ content: 'https://x/1' }], summary: 's' } }] };
  pruneImportDocument(doc, ['comments']);
  assert.equal(doc.issues[0].fields.attachment, undefined);
  const kept = { issues: [{ fields: { attachment: [{ content: 'https://x/1' }] } }] };
  pruneImportDocument(kept, ['attachments']);
  assert.equal(kept.issues[0].fields.attachment.length, 1);
});

console.log(`# ${passed} passed`);
