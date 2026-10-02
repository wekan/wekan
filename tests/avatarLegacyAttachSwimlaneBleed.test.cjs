'use strict';

// Regression coverage for AvatarMimeBleed, LegacyAttachBleed and SwimlaneBleed.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const {
  fileNameIsBrowserExecutable,
  fileResponsePolicy,
} = require('../models/lib/fileResponseSafety');

test('browser-executable stored MIME types are sandboxed opaque downloads', () => {
  for (const type of [
    'text/html',
    'application/xhtml+xml',
    'image/svg+xml',
    'text/xml',
    'application/xml',
    'application/javascript',
    'text/javascript; charset=utf-8',
  ]) {
    const policy = fileResponsePolicy(type);
    assert.equal(policy.contentType, 'application/octet-stream', type);
    assert.equal(policy.forceDownload, true, type);
    assert.equal(policy.headers['X-Content-Type-Options'], 'nosniff', type);
    assert.match(policy.headers['Content-Security-Policy'], /sandbox/);
    assert.equal(policy.headers['X-Frame-Options'], 'DENY');
  }

  const image = fileResponsePolicy('IMAGE/PNG');
  assert.equal(image.contentType, 'image/png');
  assert.equal(image.forceDownload, false);
  assert.equal(image.headers['X-Content-Type-Options'], 'nosniff');
});

test('browser-executable filenames are downloads even when stored MIME is spoofed', () => {
  for (const name of [
    'payload.html',
    'payload.HTM',
    'payload.xhtml',
    'payload.svg',
    'payload.xml',
    'payload.js',
    'payload.mjs',
  ]) {
    assert.equal(fileNameIsBrowserExecutable(name), true, name);
    const policy = fileResponsePolicy('image/png', fileNameIsBrowserExecutable(name));
    assert.equal(policy.contentType, 'application/octet-stream', name);
    assert.equal(policy.forceDownload, true, name);
    assert.equal(policy.headers['X-Content-Type-Options'], 'nosniff', name);
    assert.match(policy.headers['Content-Security-Policy'], /sandbox/, name);
  }
  assert.equal(fileNameIsBrowserExecutable('photo.png'), false);
});

test('every Meteor-Files storage strategy uses the shared response backstop', () => {
  const strategies = read('models/lib/fileStoreStrategy.js');
  const stream = read('models/lib/httpStream.js');
  const server = read('models/attachments.server.js');

  for (const className of [
    'FileStoreStrategyGridFs',
    'FileStoreStrategyFilesystem',
    'FileStoreStrategyCloud',
  ]) {
    const start = strategies.indexOf(`class ${className}`);
    assert.notEqual(start, -1, className);
    const next = strategies.indexOf('\nexport class ', start + 1);
    const body = strategies.slice(start, next === -1 ? undefined : next);
    assert.match(body, /httpStreamOutput\(/, `${className} must intercept downloads`);
    assert.match(
      body,
      /(?:ret\s*=\s*true[\s\S]*return ret|return true)/,
      `${className} must stop Meteor-Files fallback serving`,
    );
  }

  assert.match(stream, /fileResponsePolicy\(/);
  assert.match(stream, /setHeader\('Content-Type', policy\.contentType\)/);
  assert.match(stream, /getContentDisposition\(name, policy\.forceDownload \? 'true'/);
  assert.match(server, /Validate EVERY upload/);
  assert.doesNotMatch(
    server,
    /if \(storageDestination !== STORAGE_NAME_FILESYSTEM\) \{[\s\S]{0,500}isFileValid/,
    'filesystem validation must not sit inside the migration-only branch',
  );
});

test('negative: stored avatar and legacy attachment types never reach Content-Type directly', () => {
  const routes = [
    read('server/routes/avatarServer.js'),
    read('server/routes/legacyAttachments.js'),
  ];
  for (const source of routes) {
    assert.match(source, /fileResponsePolicy/);
    assert.doesNotMatch(source, /setHeader\(['"]Content-Type['"],\s*(?:avatar|legacy|attachment)\.type/);
  }

  const routeDir = path.join(root, 'server', 'routes');
  for (const name of fs.readdirSync(routeDir).filter(name => name.endsWith('.js'))) {
    const source = fs.readFileSync(path.join(routeDir, name), 'utf8');
    assert.doesNotMatch(
      source,
      /setHeader\(['"]Content-Type['"],\s*[\w.]+\.type\b/,
      `${name} must not trust a stored MIME type directly`,
    );
  }
});

test('default swimlane creation requires write access and records rejected attempts', () => {
  const source = read('server/models/swimlanes.js');
  const method = source.slice(
    source.indexOf('async ensureDefaultSwimlane'),
    source.indexOf('\n  },\n});'),
  );
  assert.match(method, /allowIsBoardMemberWithWriteAccess\(this\.userId, board\)/);
  assert.match(method, /key: 'authz\.swimlane-create'/);
  assert.match(method, /action: 'blocked'/);
  assert.match(method, /catch \(e\) \{ \/\* logging must never break the guard \*\/ \}/);
  assert.ok(method.indexOf('allowIsBoardMemberWithWriteAccess') < method.indexOf('Swimlanes.insertAsync'));
});

test('negative: no swimlane-creating method authorizes with read membership or public visibility', () => {
  const source = read('server/models/swimlanes.js');
  const method = source.slice(
    source.indexOf('async ensureDefaultSwimlane'),
    source.indexOf('\n  },\n});'),
  );
  assert.doesNotMatch(method, /\.isMember\??\.|\.isPublic\??\./);
});

// AvatarMimeBleed, prefix-route sibling (2026-10-02). The avatar routes that
// answer first (server/routes/universalFileServer.js) echoed any stored type
// that missed an exact-match dangerous list - 'text/html; charset=utf-8' did -
// and served it inline with no CSP, and an avatar's owner could $set `type`
// from the client. Only known raster image types are inline now, and clients
// may change only a file's name.
test('avatar prefix routes serve only known image types inline (AvatarMimeBleed)', () => {
  const fs = require('node:fs');
  const universal = fs.readFileSync('server/routes/universalFileServer.js', 'utf8');
  assert.match(universal, /const INLINE_AVATAR_TYPES = new Set\(\['image\/png', 'image\/jpeg', 'image\/jpg', 'image\/gif', 'image\/webp', 'image\/avif', 'image\/bmp'\]\);/);
  assert.match(universal, /\} else if \(INLINE_AVATAR_TYPES\.has\(typeLower\.split\(';'\)\[0\]\.trim\(\)\)\) \{/);
  assert.doesNotMatch(universal, /res\.setHeader\('Content-Type', typeLower \|\| 'image\/jpeg'\)/, 'the stored type is never echoed');
  for (const file of ['server/permissions/avatars.js', 'server/permissions/attachments.js']) {
    const src = fs.readFileSync(file, 'utf8');
    assert.match(src, /(ALLOWED_UPDATE_FIELDS|allowedFields) = \['name'\];/, `${file}: clients change only the name`);
  }
});
