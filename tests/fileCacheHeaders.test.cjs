'use strict';

// Guard: CacheBleed (GHSA-w3qg-pf27-g68r). A stored file - attachment, avatar,
// thumbnail - is served only after an access check on the caller's credential,
// so no response that carries one may be stored by a shared cache.
// Run: node tests/fileCacheHeaders.test.cjs
//
// The report: the attachment routes answered `Cache-Control: public,
// max-age=31536000` with no Vary. A caching proxy in front of WeKan stored a
// board member's copy and handed it, for a year, to anyone who asked for the
// same URL with no credentials - including the member after they were removed
// from the board. Three places in universalFileServer.js said it; the avatar
// routes said it twice more, and Meteor-Files' own /cdn/storage route sent its
// default, `public, max-age=31536000, s-maxage=31536000`, a sixth way.
//
// The test drives the helper, then checks every place a file is served uses
// it, and the negative test searches the whole tree for the SHAPE of the fault
// - a public Cache-Control value, a FilesCollection left on Meteor-Files'
// public default, an ETag-sending route without the helper - so it cannot come
// back in a seventh place.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const {
  PRIVATE_FILE_CACHE_CONTROL, PRIVATE_FILE_VARY, mergeVary, setPrivateFileCacheHeaders, privateFileCacheHeaders,
} = require('../models/lib/fileCacheHeaders');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const directives = value => value.split(',').map(d => d.trim().toLowerCase());
function fakeResponse(initial = {}) {
  const headers = { ...initial };
  return {
    headers,
    setHeader(name, value) { headers[name.toLowerCase()] = value; },
    getHeader(name) { return headers[name.toLowerCase()]; },
  };
}

// RFC 9111 3 and 5.2.2: what a SHARED cache may do with a response to a
// request that carried a credential. The reporter's PoC asked exactly this of
// http-cache-semantics; the rules it applied are these.
function sharedCacheMayStore(cacheControl, requestHadAuthorization) {
  const d = directives(cacheControl);
  if (d.includes('private') || d.includes('no-store')) return false;
  if (requestHadAuthorization) {
    return d.includes('public') || d.includes('must-revalidate') || d.some(x => x.startsWith('s-maxage'));
  }
  return true;
}
const mayReuseWithoutAsking = cacheControl => {
  const d = directives(cacheControl);
  return !d.includes('no-cache') && !d.includes('no-store');
};

test('the policy keeps a file out of shared caches and revalidates it every time', () => {
  assert.strictEqual(PRIVATE_FILE_CACHE_CONTROL, 'private, no-cache');
  const d = directives(PRIVATE_FILE_CACHE_CONTROL);
  assert.ok(!d.includes('public') && !d.some(x => x.startsWith('s-maxage')));
  assert.deepStrictEqual(PRIVATE_FILE_VARY, ['Cookie', 'Authorization', 'X-Auth-Token']);
});

test('the reporter\'s attack: the old header was stored and reused, the new one is not', () => {
  const old = 'public, max-age=31536000';
  // A member's request by cookie, and by Authorization.
  assert.strictEqual(sharedCacheMayStore(old, false), true);
  assert.strictEqual(sharedCacheMayStore(old, true), true);
  assert.strictEqual(mayReuseWithoutAsking(old), true);
  const meteorFilesDefault = 'public, max-age=31536000, s-maxage=31536000';
  assert.strictEqual(sharedCacheMayStore(meteorFilesDefault, true), true);
  // Now: never stored by a shared cache, never reused without the access check.
  assert.strictEqual(sharedCacheMayStore(PRIVATE_FILE_CACHE_CONTROL, false), false);
  assert.strictEqual(sharedCacheMayStore(PRIVATE_FILE_CACHE_CONTROL, true), false);
  assert.strictEqual(mayReuseWithoutAsking(PRIVATE_FILE_CACHE_CONTROL), false);
});

test('setPrivateFileCacheHeaders sets both headers and keeps an existing Vary', () => {
  const res = fakeResponse({ vary: 'Origin, cookie' });
  setPrivateFileCacheHeaders(res);
  assert.strictEqual(res.headers['cache-control'], 'private, no-cache');
  assert.strictEqual(res.headers.vary, 'Origin, cookie, Authorization, X-Auth-Token');
  const bare = fakeResponse();
  setPrivateFileCacheHeaders(bare);
  assert.strictEqual(bare.headers.vary, 'Cookie, Authorization, X-Auth-Token');
  // Twice is the same as once.
  setPrivateFileCacheHeaders(bare);
  assert.strictEqual(bare.headers.vary, 'Cookie, Authorization, X-Auth-Token');
  assert.deepStrictEqual(privateFileCacheHeaders(),
    { 'Cache-Control': 'private, no-cache', Vary: 'Cookie, Authorization, X-Auth-Token' });
});

test('mergeVary keeps * and ignores case and blanks (negative)', () => {
  assert.strictEqual(mergeVary('*'), '*');
  assert.strictEqual(mergeVary(' , AUTHORIZATION '), 'AUTHORIZATION, Cookie, X-Auth-Token');
  assert.strictEqual(mergeVary(undefined), 'Cookie, Authorization, X-Auth-Token');
});

test('every place that serves a stored file uses the helper', () => {
  const universal = read('server/routes/universalFileServer.js');
  const body = name => {
    const at = universal.indexOf(`function ${name}(`);
    assert.ok(at >= 0, `${name} exists`);
    return universal.slice(at, universal.indexOf('\n  }\n', at));
  };
  assert.match(body('setFileHeaders'), /setPrivateFileCacheHeaders\(res\);/);
  // A 304 stands for the 200 and must not be stored more widely than it.
  assert.match(body('handleConditionalRequest'), /setPrivateFileCacheHeaders\(res\);[\s\S]*res\.writeHead\(304\)/);
  const thumbnail = body('sendThumbnail');
  assert.match(thumbnail, /writeHead\(304, \{ ETag: etag, \.\.\.privateFileCacheHeaders\(\) \}\)/);
  assert.match(thumbnail, /writeHead\(200, \{[\s\S]*\.\.\.privateFileCacheHeaders\(\),/);
  // Both ?download=1 branches: /cdn/storage/attachments and /cfs/files/attachments.
  const downloads = [...universal.matchAll(/if \(isDownloadRequested\(req\)\) \{\s*\/\/[^\n]*\n\s*setPrivateFileCacheHeaders\(res\);/g)];
  assert.strictEqual(downloads.length, 2, 'both download branches set the private policy');

  const avatars = read('server/routes/avatarServer.js');
  assert.strictEqual((avatars.match(/setPrivateFileCacheHeaders\(res\);/g) || []).length, 2);

  assert.match(read('models/lib/httpStream.js'),
    /require\('\.\/fileCacheHeaders'\)\.setPrivateFileCacheHeaders\(http\.response\);/);
});

// Every source file of the app, never the generated _build/ or .build/ copies.
function sourceFiles() {
  // Generated bundles (_build/, _build-local-test/, .build/) hold a rewritten
  // copy of every source file and of its dependencies; skip them all.
  const skip = new Set(['node_modules', 'tests', 'packages', 'public']);
  const out = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(entry.name) || entry.name.startsWith('_build') || entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(c|m)?js$/.test(entry.name)) out.push(full);
    }
  };
  walk(ROOT);
  return out;
}

test('nowhere does the app send a public Cache-Control (negative)', () => {
  const files = sourceFiles();
  assert.ok(files.length > 500, `expected the app sources, found ${files.length}`);
  const offenders = [];
  const shapes = [
    /Cache-Control['"`]?\s*[,:]\s*['"`][^'"`]*\bpublic\b/i,
    /cacheControl\s*:\s*['"`][^'"`]*\bpublic\b/,
  ];
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    if (shapes.some(shape => shape.test(text))) offenders.push(path.relative(ROOT, file));
  }
  assert.deepStrictEqual(offenders, [],
    'a public Cache-Control lets a shared cache serve the response without the access check');
});

test('no FilesCollection is left on Meteor-Files\' public default (negative)', () => {
  const collections = [];
  for (const file of sourceFiles()) {
    const text = fs.readFileSync(file, 'utf8');
    for (const m of text.matchAll(/new FilesCollection\(\{/g)) {
      collections.push(path.relative(ROOT, file));
      const config = text.slice(m.index, text.indexOf('\n});', m.index));
      assert.match(config, /cacheControl: require\('\/models\/lib\/fileCacheHeaders'\)\.PRIVATE_FILE_CACHE_CONTROL,/,
        `${path.relative(ROOT, file)}: Meteor-Files defaults to a public one-year cache`);
    }
  }
  assert.deepStrictEqual(collections.sort(), ['models/attachments.js', 'models/avatars.js']);
});

test('every route that sends an ETag sends the private policy with it (negative)', () => {
  // An ETag is how a file route marks a cacheable body; each of them must
  // also say who may cache it.
  for (const file of sourceFiles()) {
    const text = fs.readFileSync(file, 'utf8');
    if (!/setHeader\('ETag'|\bETag:\s/.test(text)) continue;
    assert.match(text, /setPrivateFileCacheHeaders|privateFileCacheHeaders/,
      `${path.relative(ROOT, file)} sends an ETag without the private cache policy`);
  }
});


// CacheBleed siblings (2026-10-02): API answers - exports, base64 attachment
// downloads - carried no cache policy at all, and the legacy attachments route
// served files with none and answered every method.
test('every API answer is no-store, and the legacy route serves files privately', () => {
  const gate = read('server/apiMiddleware.js');
  assert.match(gate, /if \(api\) res\.setHeader\('Cache-Control', 'no-store'\);/);
  assert.ok(gate.indexOf("if (api) res.setHeader('Cache-Control', 'no-store');") < gate.indexOf('return next();'));
  const legacy = read('server/routes/legacyAttachments.js');
  assert.match(legacy, /if \(req\.method !== 'GET' && req\.method !== 'HEAD'\) return next\(\);/);
  assert.match(legacy, /setPrivateFileCacheHeaders\(res\);/);
});

console.log(`\nfileCacheHeaders: ${passed} tests passed`);
