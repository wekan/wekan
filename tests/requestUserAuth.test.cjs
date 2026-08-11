'use strict';

// "Profile pictures were lost" after upgrading a 6.x snap (#6583 follow-up):
//
//   "I can see Profile Pics from the user in the Admin/User Pannel if i open a
//    User. But on the boards i see only the 'missing Picture' Icon"
//   "initials are OK, but there is broken avatar image for those that have image"
//
// Run: node tests/requestUserAuth.test.cjs
//
// Nothing was lost. The avatar FILES migrate correctly, and the migrated
// Meteor-Files record even keeps the original CollectionFS `_id`
// (cfsRecordToMeteorFile), so the old URL still points at the right thing. What
// broke is the request for them.
//
// A 6.x install stores `profile.avatarUrl` as `/cfs/files/avatars/<id>`. That
// route serves the legacy CollectionFS bytes if they are still there, and
// otherwise redirects to `/cdn/storage/avatars/<id>` - which asked who was
// asking like this:
//
//     const userId = Meteor.userId();
//     if (!userId) { res.writeHead(401); ... }
//
// `Meteor.userId()` reads the current DDP invocation's environment. That exists
// inside a method or a publication and NOT in a WebApp handler, where it does not
// return "nobody" - it THROWS "Meteor.userId can only be invoked in method calls
// or publications". The handler's own try/catch then turned that into a 500, so
// the failure presented as a broken image rather than as broken authentication,
// and no avatar served through that route ever reached anybody.
//
// Initials still worked because they are rendered client-side from the username
// and never fetch anything, which is exactly the reported split.
//
// An HTTP request carries its identity in the request. server/lib/requestUser.js
// resolves it the way universalFileServer.js always has.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const helper = read('server/lib/requestUser.js');
const avatarServer = read('server/routes/avatarServer.js');
const legacy = read('server/routes/legacyAttachments.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// Declarations only - these files explain the old call at length.
const code = src => src.split('\n')
  .filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l))
  .join('\n');

test('no WebApp file route asks Meteor.userId() any more', () => {
  for (const [name, src] of [['avatarServer', avatarServer], ['legacyAttachments', legacy]]) {
    assert.ok(!/Meteor\.userId\(\)/.test(code(src)),
      `${name}: Meteor.userId() THROWS in a WebApp handler - it does not return ` +
      `null - and the handler's catch turns that into a 500`);
    assert.ok(/getUserIdFromRequest\(req\)/.test(code(src)),
      `${name}: the identity has to come from the request`);
    assert.ok(/await getUserIdFromRequest\(req\)/.test(code(src)),
      `${name}: it is async; an unawaited Promise is truthy and would authorise ` +
      `everybody`);
  }
});

test('the resolver never throws, whatever it is given', () => {
  // The callers wrap everything in try/catch and answer 500, so an exception
  // here would look exactly like the bug it replaces.
  const body = code(helper);
  const at = body.indexOf('export async function getUserIdFromRequest');
  const fn = body.slice(at);
  assert.ok(/try \{/.test(fn) && /catch \(error\)/.test(fn),
    'a caller deciding whether to serve a file wants an answer, not an exception');
  assert.ok(/return null;/.test(fn));
});

test('it reads the four places a request can carry a token', () => {
  const body = code(helper);
  for (const source of ['authorization', 'x-auth-token', 'authToken', 'meteor_login_token']) {
    assert.ok(body.includes(source),
      `${source} is one of the ways WeKan's own client sends it; missing one ` +
      `means avatars work in some contexts and not others, which is the bug`);
  }
  assert.ok(/Accounts\._hashLoginToken/.test(body),
    'the stored token is hashed, so the raw one has to be hashed to match');
});

test('Sandstorm, where there is no login token at all, still resolves', () => {
  const body = code(helper);
  assert.ok(/x-sandstorm-user-id/.test(body),
    'on Sandstorm the platform authorises the request and injects the user id; ' +
    'token lookup would always fail there and every image would 403');
  const at = body.indexOf('export async function getUserIdFromRequest');
  const fn = body.slice(at, at + 600);
  assert.ok(fn.indexOf('isSandstormRequest') < fn.indexOf('extractLoginToken'),
    'checked before the token path, which cannot succeed on Sandstorm');
});

test('a token too short to be one is not looked up', () => {
  assert.ok(/raw\.length < 10/.test(code(helper)),
    'a junk value should not become a database query on every image request');
});

// ── the path a migrated 6.x avatar actually takes ───────────────────────────

test('the legacy avatar URL still has somewhere to go', () => {
  assert.ok(/\/cfs\/files\/avatars\/:fileName/.test(avatarServer),
    "a 6.x profile.avatarUrl is /cfs/files/avatars/<id>; that route is what " +
    'makes an unmigrated URL work at all');
  assert.ok(/cdn\/storage\/avatars\//.test(avatarServer),
    'and it redirects to the current route when the legacy bytes are gone');
});

test('a visitor who is not signed in can still see a public board avatar', () => {
  // The client appends ?boardId= to every avatar URL "so public viewers can
  // access avatars on public boards" (userAvatar.js), and the route ignored it
  // and answered 401, so a public board showed the missing-picture icon to
  // everybody who was not logged in.
  const body = code(avatarServer);
  assert.ok(/avatarIsOnAPublicBoard/.test(body),
    'the ?boardId= the client sends has to be honoured somewhere');
  const at = body.indexOf('async function avatarIsOnAPublicBoard');
  const fn = body.slice(at, body.indexOf('\n}', at));
  assert.ok(/parseQuery\(req\)\.boardId/.test(fn), 'read from the query string');
  assert.ok(/board\.isPublic\(\)/.test(fn),
    'a private board must not open its avatars to anonymous callers');
  assert.ok(/board\.hasMember\(avatar\.userId\)/.test(fn),
    'without this, naming ANY public board would unlock ANY avatar on the ' +
    'instance - a public board publishes its own members, not everybody');
  assert.ok(/await avatarIsOnAPublicBoard/.test(body),
    'awaited, or the 401 branch is never taken and every avatar is public');
});

test('the legacy redirect keeps the query string', () => {
  // Every migrated 6.x avatar URL goes through this redirect, so dropping
  // ?boardId= here would 401 exactly the installs this fixes.
  const body = code(avatarServer);
  const at = body.indexOf('/cdn/storage/avatars/${fileName}');
  assert.ok(at !== -1);
  const around = body.slice(at - 200, at + 120);
  assert.ok(/req\.url \|\| ''\)\.split\('\?'\)\[1\]/.test(around),
    'the query has to be carried across the redirect');
  assert.ok(/\$\{query \? `\?\$\{query\}` : ''\}/.test(around),
    'and appended only when there is one, so a plain URL stays plain');
});

test('the migration keeps the id the old URL names', () => {
  // This is why the redirect can work at all: the Meteor-Files record created
  // from a CollectionFS filerecord reuses its _id.
  const migration = read('releases/migrate-mongodb-to-ferretdb.mjs');
  const at = migration.indexOf('function cfsRecordToMeteorFile');
  const body = migration.slice(at, at + 400);
  assert.ok(/_id:\s*doc\._id/.test(body),
    'if the migrated avatar got a fresh id, /cdn/storage/avatars/<old id> would ' +
    'find nothing and the pictures really would be gone');
});

console.log(`\n${passed} passed`);
