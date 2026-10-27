'use strict';

// Regression coverage for AvatarMimeBleed (GHSA-4mjm-vj9f-p629), MimeStorageBleed
// (GHSA-rv5g-5p4g-3v89: storage-strategy response policy and filesystem
// upload validation; its markup sniff is in tests/mimeStorageBleed.test.cjs),
// LegacyAttachBleed (GHSA-xcxp-hx9w-q5q9)
// and SwimlaneBleed (GHSA-2x89-6mq2-834r: ensureDefaultSwimlane required only
// read membership; it now needs board write access and records refusals).
//
// LegacyAttachBleed: the CollectionFS-compatible attachment route sandboxed SVG
// files only, and served stored HTML, XML and JavaScript types active. Every
// browser-executable type - by stored MIME, by `+xml` suffix, or by file name -
// now gets the one opaque, sandboxed download policy of fileResponseSafety.js.

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

test('LegacyAttachBleed: script aliases, XSLT and every +xml type are sandboxed too', () => {
  for (const type of [
    'application/x-javascript', 'application/ecmascript', 'text/ecmascript',
    'text/xsl', 'application/rss+xml', 'application/atom+xml',
    'application/vnd.example+xml; charset=utf-8', 'IMAGE/SVG+XML',
  ]) {
    const policy = fileResponsePolicy(type);
    assert.equal(policy.contentType, 'application/octet-stream', type);
    assert.equal(policy.forceDownload, true, type);
    assert.match(policy.headers['Content-Security-Policy'], /sandbox/, type);
  }
  // Negative: ordinary documents and images keep their type.
  for (const type of ['application/pdf', 'text/plain', 'image/jpeg', 'application/zip']) {
    assert.equal(fileResponsePolicy(type).forceDownload, false, type);
  }
});

test('negative: no file route decides the policy by an SVG-only name check (LegacyAttachBleed)', () => {
  // The original fault: protection keyed on `.svg` alone. Every caller of the
  // shared policy passes the full browser-executable name check instead.
  const callers = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      if (['node_modules', 'tests', '.tools'].includes(entry.name) || entry.name.startsWith('_build') || entry.name.startsWith('.')) continue;
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(rel);
      else if (entry.name.endsWith('.js') && /fileResponsePolicy\(/.test(read(rel)) && rel !== path.join('models', 'lib', 'fileResponseSafety.js')) callers.push(rel);
    }
  };
  for (const dir of ['server', 'models', 'imports', 'packages']) if (fs.existsSync(path.join(root, dir))) walk(dir);
  assert.ok(callers.length >= 3, callers.join(', '));
  for (const rel of callers) {
    const src = read(rel);
    assert.doesNotMatch(src, /fileResponsePolicy\([^)]*isSvg/, `${rel}: an SVG-only name check`);
    for (const m of src.matchAll(/fileResponsePolicy\(([^()]*(?:\([^()]*\))?[^()]*)\)/g)) {
      const args = m[1].split(',').map(a => a.trim());
      if (args.length > 1) assert.match(args[1], /^fileNameIsBrowserExecutable\(/, `${rel}: ${m[0]}`);
    }
  }
  assert.match(read('server/routes/legacyAttachments.js'),
    /fileResponsePolicy\(attachment\.type, fileNameIsBrowserExecutable\(attachment\.name\)\)/);
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
