'use strict';

// Four security advisories against Attachments/Avatars (ostrio:files 3.0.1),
// reported against v11.14, fixed here. Static wiring tests (no Meteor runtime,
// no live upload/DDP round trip) that pin the source-level fix for each.
// Run: node tests/attachmentAvatarSecurityAdvisories.test.cjs
//
// 1. "Avatars Collection Lacks `protected` Callback", Hall of Fame name
//    PortraitBleed (High, CWE-862/284) - Avatars had no `protected` hook, so
//    ostrio:files' own download route served every avatar to anyone. Fixed:
//    models/avatars.server.js defines Avatars.protected, mirroring
//    Attachments.protected.
// 2. "serveLegacyAvatar Serves Legacy CollectionFS Avatars Without Any
//    Authentication", Hall of Fame name RelicAvatarBleed (High, CWE-862) -
//    both call sites streamed a legacy avatar with no auth check. Fixed:
//    server/routes/avatarServer.js gates both behind
//    isLegacyAvatarAuthorized (requires a signed-in caller).
// 3. "Unauthenticated Arbitrary File Write via Path Traversal in Attachment
//    Upload namingFunction", Hall of Fame name UploadPathBleed (Critical,
//    CWE-22/434/306) - fileId was used verbatim as the on-disk file name and
//    sanitize() was an identity function. Fixed: models/attachments.js
//    restores a whitelist sanitize() and validates the fileId
//    namingFunction returns.
// 4. "Unauthenticated DDP Methods _FilesCollectionRemove_attachments/
//    _FilesCollectionRemove_avatars Allow Instance-Wide Deletion", Hall of
//    Fame name WipeBleed (Critical, CWE-862) - ostrio:files' own remove
//    method bypasses Attachments.allow/Avatars.allow entirely and is gated
//    only by allowClientCode + an optional onBeforeRemove, which Attachments
//    never defined and Avatars' unconditionally returned true. Fixed: both
//    now require this.userId and
//    per-file write access (or, for avatars, ownership/site-admin).

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const attachmentsJs = read('models/attachments.js');
const avatarsServerJs = read('models/avatars.server.js');
const attachmentsPermissions = read('server/permissions/attachments.js');
const avatarServerRoute = read('server/routes/avatarServer.js');
const attachmentsServerJs = read('models/attachments.server.js');
const securityCategories = read('models/lib/securityCategories.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('attachmentAvatarSecurityAdvisories:');

// ── 1. Avatars.protected ────────────────────────────────────────────────────

test('Avatars.protected exists and mirrors Attachments.protected', () => {
  assert.ok(/Avatars\.protected = async function \(fileObj\)/.test(avatarsServerJs),
    'Avatars.protected is defined');
  const at = avatarsServerJs.indexOf('Avatars.protected = async function');
  const body = avatarsServerJs.slice(at, avatarsServerJs.indexOf('\n};', at));
  assert.ok(/if \(this\.userId\)/.test(body), 'an authenticated caller is checked');
  assert.ok(/return true;/.test(body), 'and allowed');
  assert.ok(/permission: 'public'/.test(body) && /'members\.userId': owner/.test(body),
    'an anonymous caller is allowed only when the owner is on a public board');
});

test('the Attachments precedent this mirrors still exists (negative-ish sanity check)', () => {
  assert.ok(/Attachments\.protected = async function \(fileObj\)/.test(attachmentsServerJs),
    'Attachments.protected already existed - Avatars was the gap');
});

// ── 2. serveLegacyAvatar authentication ─────────────────────────────────────

test('serveLegacyAvatar is gated by isLegacyAvatarAuthorized in both routes', () => {
  assert.ok(/async function isLegacyAvatarAuthorized\(req\)/.test(avatarServerRoute),
    'the helper exists');
  const helperAt = avatarServerRoute.indexOf('async function isLegacyAvatarAuthorized');
  const helperBody = avatarServerRoute.slice(helperAt, avatarServerRoute.indexOf('\n}', helperAt));
  assert.ok(/getUserIdFromRequest\(req\)/.test(helperBody), 'it resolves the caller');
  assert.ok(/return !!userId;/.test(helperBody), 'and requires one - no anonymous bypass');

  // /cdn/storage/avatars/:fileName - legacy fallback branch
  const cdnAt = avatarServerRoute.indexOf("'/cdn/storage/avatars/:fileName'");
  const cdnBlock = avatarServerRoute.slice(cdnAt, avatarServerRoute.indexOf("'/cfs/files/avatars/:fileName'"));
  const legacyCallAt = cdnBlock.indexOf('serveLegacyAvatar(fileId, req, res)');
  const before = cdnBlock.slice(0, legacyCallAt);
  assert.ok(/isLegacyAvatarAuthorized\(req\)/.test(before.slice(before.lastIndexOf('if (!avatar)'))),
    '/cdn/storage/avatars checks authorization before the legacy fallback');

  // /cfs/files/avatars/:fileName - the route with NO auth check at all before
  const cfsAt = avatarServerRoute.indexOf("'/cfs/files/avatars/:fileName'");
  const cfsBlock = avatarServerRoute.slice(cfsAt);
  const cfsLegacyAt = cfsBlock.indexOf('serveLegacyAvatar(fileId, req, res)');
  const cfsBefore = cfsBlock.slice(0, cfsLegacyAt);
  assert.ok(/isLegacyAvatarAuthorized\(req\)/.test(cfsBefore),
    '/cfs/files/avatars checks authorization before its (only) legacy call');
});

test('the /cfs route still redirects unauthenticated non-legacy requests (negative)', () => {
  // The fix must not turn the whole route into an auth wall: an anonymous
  // visitor requesting an already-migrated avatar must still get the
  // redirect (which is itself authorized on the /cdn/storage/avatars side).
  const cfsAt = avatarServerRoute.indexOf("'/cfs/files/avatars/:fileName'");
  const cfsBlock = avatarServerRoute.slice(cfsAt);
  assert.ok(/writeHead\(301/.test(cfsBlock), 'the redirect fallback is still there');
  assert.ok(!/^\s*if \(!\(await isLegacyAvatarAuthorized\(req\)\)\) \{\s*\n\s*res\.writeHead\(401/m.test(cfsBlock),
    'unauthenticated requests are not hard-401\'d before the redirect can run');
});

// ── 3. Path traversal via namingFunction/sanitize ───────────────────────────

test('sanitize() is a real whitelist, not the identity function it was', () => {
  const at = attachmentsJs.indexOf('sanitize(str, max, replacement) {');
  const body = attachmentsJs.slice(at, attachmentsJs.indexOf('\n  },', at));
  assert.ok(!/return str;\s*\n\s*\},?\s*$/.test(body), 'no longer returns the input unchanged');
  assert.ok(/replace\(\/\[\^a-zA-Z0-9_\.\\-\]\/g/.test(body),
    'strips everything but alphanumerics, underscore, dot and hyphen');
  // Path traversal sequences must not survive.
  // eslint-disable-next-line no-new-func
  const sanitize = new Function('str', 'replacement',
    `return (str || '').replace(/[^a-zA-Z0-9_.-]/g, replacement || '_');`);
  const sanitized = sanitize('../../../../tmp/pwn');
  assert.ok(!sanitized.includes('/'), 'no path separators remain');
  assert.ok(!sanitized.includes('\\'), 'no backslash path separators remain');
  // Dots survive the whitelist (they are legitimate in a filename), but with
  // every '/' gone "../" can no longer walk up a directory.
  assert.strictEqual(sanitized, '.._.._.._.._tmp_pwn');
});

test('namingFunction validates fileId and regenerates a safe one when it fails', () => {
  const at = attachmentsJs.indexOf('namingFunction(opts) {');
  const body = attachmentsJs.slice(at, attachmentsJs.indexOf('\n  },', at));
  assert.ok(/if \(!fileId \|\| !\/\^\[a-zA-Z0-9_-\]\{1,40\}\$\/\.test\(fileId\)\)/.test(body),
    'fileId is validated against a safe pattern before use');
  assert.ok(/fileId = Random\.id\(\);/.test(body), 'and replaced with a fresh id when invalid');
  assert.ok(/const ret = fileId;/.test(body), 'the (now-validated) fileId is what gets returned');
  // The traversal string from the advisory's PoC must fail the pattern.
  assert.ok(!/^[a-zA-Z0-9_-]{1,40}$/.test('../../../../tmp/wekan-pwn'),
    'sanity: the PoC fileId does not match the safe pattern (would be regenerated)');
});

test('Random is imported for the fallback id (negative: no ad-hoc Math.random id reused as fileId)', () => {
  assert.ok(/import \{ Random \} from 'meteor\/random';/.test(attachmentsJs));
});

// ── 4. Unauthenticated DDP remove ───────────────────────────────────────────

test('Attachments.onBeforeRemove requires an authenticated caller with write access', () => {
  assert.ok(/Attachments\.onBeforeRemove = async function \(cursor\)/.test(attachmentsPermissions),
    'the hook is defined - it did not exist before');
  const at = attachmentsPermissions.indexOf('Attachments.onBeforeRemove = async function');
  const body = attachmentsPermissions.slice(at, attachmentsPermissions.indexOf('\n};', at));
  assert.ok(/const userId = this\.userId;/.test(body), 'reads the DDP method\'s own userId');
  assert.ok(/if \(!userId\) \{[\s\S]{0,400}return false;/.test(body),
    'an anonymous caller (no userId) is refused');
  assert.ok(/if \(!files\.length\) \{\s*\n\s*return false;/.test(body),
    'an empty/non-matching selector is refused, not treated as nothing to check');
  assert.ok(/canEditAttachmentCard\(userId, fileObj\)/.test(body),
    'every matched file is checked against the caller\'s write access');
});

test('Avatars.onBeforeRemove no longer unconditionally returns true (negative)', () => {
  const at = avatarsServerJs.indexOf('Avatars.onBeforeRemove = async function');
  const body = avatarsServerJs.slice(at, avatarsServerJs.indexOf('\nAvatars.onAfterRemove', at));
  assert.ok(!/^\s*return true;\s*$/m.test(body.split('\n').slice(0, 3).join('\n')),
    'the function body does not open by unconditionally returning true');
  assert.ok(/const userId = this\.userId;/.test(body), 'reads the caller\'s userId');
  assert.ok(/if \(!userId\) \{[\s\S]{0,400}return false;/.test(body),
    'an anonymous caller is refused');
  assert.ok(/callerIsAdmin/.test(body) && /fileObj\.userId !== userId/.test(body),
    'a non-admin caller may only remove their OWN avatar');
});

test('both onBeforeRemove hooks log a blocked attempt (Admin Panel / Problems)', () => {
  assert.ok(securityCategories.includes("'authz.file-remove':"),
    'the catalog has a key for this guard');
  assert.ok(/bleed: 'WipeBleed'/.test(securityCategories) && /severity: 'critical'/.test(
    securityCategories.slice(securityCategories.indexOf("'authz.file-remove':"),
      securityCategories.indexOf("'authz.file-remove':") + 120)),
    'named and rated critical, matching the advisory');
  for (const [file, source] of [
    [attachmentsPermissions, '_FilesCollectionRemove_attachments'],
    [avatarsServerJs, '_FilesCollectionRemove_avatars'],
  ]) {
    assert.ok(file.includes("key: 'authz.file-remove'") && file.includes(source),
      `${source} is logged through the shared security log`);
  }
});

test('the two High advisories also log a blocked attempt, under their own keys (not PathBleed)', () => {
  for (const key of ['authz.upload-path', 'authz.avatar-protected', 'authz.legacy-avatar']) {
    assert.ok(securityCategories.includes(`'${key}':`), `the catalog has a key for ${key}`);
  }
  // The upload path-traversal guard used to reuse the pre-existing PathBleed
  // key (a DIFFERENT, already-published advisory, GHSA-4mxf-m8pq-xc9p) - it
  // has its own name now so the two incidents are not conflated on the
  // public Hall of Fame page.
  assert.ok(!attachmentsJs.includes("key: 'authz.file-path'"),
    'the upload guard no longer reuses the unrelated PathBleed key');
  assert.ok(attachmentsJs.includes("key: 'authz.upload-path'"),
    'it logs under its own UploadPathBleed key instead');
  assert.ok(avatarsServerJs.includes("key: 'authz.avatar-protected'"),
    'Avatars.protected logs a denied anonymous download');
  assert.ok(avatarServerRoute.includes("key: 'authz.legacy-avatar'"),
    'the legacy-avatar 401 branch logs the attempt');
});

test('every security log call is wrapped so logging can never break the guard (negative)', () => {
  for (const src of [attachmentsJs, attachmentsPermissions, avatarsServerJs, avatarServerRoute]) {
    const calls = src.split("require('/server/lib/securityLog').record(").length - 1;
    if (calls === 0) continue;
    const tryCount = (src.match(/try \{\s*\n\s*require\('\/server\/lib\/securityLog'\)\.record\(/g) || []).length;
    assert.strictEqual(tryCount, calls, 'every record() call in this file is inside its own try block');
  }
});

console.log(`\nattachmentAvatarSecurityAdvisories: ${passed} tests passed`);
