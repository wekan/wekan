'use strict';

// Admin Panel / Problems / Security showed FileNameBleed, "uploaded a filename
// carrying an exploit pattern; URL-encoded name", for a user who had only
// opened a board of 2019 photos with Cyrillic names: reading each one repaired
// its stored percent-encoded name, and "URL-encoded name" tripped the canary.
// URL-encoding is not an exploit, and a repair while reading is not an upload.
// This loads the real server/lib/filenameSanitizeLog.js with its server-only
// dependencies stubbed.
// Run: node tests/filenameCanaryReasons.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const tripped = [];
const recorded = [];
const stubs = {
  '/server/lib/fileContext': { resolveFileContext: async () => ({}), formatFileContext: () => '' },
  '/server/lib/canary': { tripCanary: (key, evt) => tripped.push({ key, detail: evt.detail }) },
  '/server/lib/securityLog': { record: evt => recorded.push(evt) },
};
const mod = { exports: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'server/lib/filenameSanitizeLog.js'), 'utf8'), {
  module: mod, exports: mod.exports, require: name => stubs[name] || require(name), console,
});
const { canaryForReasons, logFilenameSanitized, DANGEROUS_REASON } = mod.exports;
// uploadFileName imports a Meteor absolute path; map it so this runs under Node.
const Module = require('node:module');
const origResolve = Module._resolveFilename;
Module._resolveFilename = function(request, ...rest) {
  if (request === '/imports/lib/fileNameDisplay') return path.join(ROOT, 'imports', 'lib', 'fileNameDisplay.js');
  return origResolve.call(this, request, ...rest);
};
const { sanitizationReasons } = require(path.join(ROOT, 'models/lib/uploadFileName.js'));

let passed = 0;
async function test(name, fn) { tripped.length = 0; recorded.length = 0; await fn(); passed += 1; console.log('  ok -', name); }

(async () => {
  await test('a percent-encoded Cyrillic name is not an exploit', () => {
    const reasons = sanitizationReasons('%D0%A0%D0%BE%D0%B7%D0%BE%D0%B2%D1%8B%D0%B9_%D0%91%D1%83%D0%BA%D0%B5%D1%82_96306-1.jpg', 'image/jpeg', 'Розовый_Букет_96306-1.jpg');
    assert.deepEqual(reasons, ['URL-encoded name']);
    assert.equal(DANGEROUS_REASON.test('URL-encoded name'), false);
    canaryForReasons(reasons, { userId: 'u1' }, 'attachmentUpload');
    assert.deepEqual(tripped, []);
  });

  await test('negative: an exploit hidden by URL-encoding still trips it, from the decoded name', () => {
    const reasons = sanitizationReasons('%2E%2E%2F%2E%2E%2Fetc%2Fpasswd', 'text/plain', 'etc_passwd.txt');
    assert.ok(reasons.includes('URL-encoded name'));
    assert.ok(reasons.includes('path traversal'), `named from the decoded name: ${reasons.join(', ')}`);
    canaryForReasons(reasons, { userId: 'u1' }, 'attachmentUpload');
    assert.equal(tripped.length, 1);
    assert.equal(tripped[0].key, 'sanitize.path-traversal');
    assert.doesNotMatch(tripped[0].detail, /URL-encoded/);
    // and an encoded null byte
    const nul = sanitizationReasons('report%00.pdf.exe', 'application/pdf', 'report.pdf');
    assert.ok(nul.includes('null byte'), nul.join(', '));
    assert.ok(nul.some(r => DANGEROUS_REASON.test(r)));
  });

  await test('negative: markup in a name uploaded now still trips it', () => {
    canaryForReasons(['exploit: html/script'], { userId: 'u1' }, 'attachmentUpload');
    assert.equal(tripped.length, 1);
    assert.equal(tripped[0].key, 'sanitize.dangerous-filename');
  });

  await test('a name repaired while the file is READ never trips the upload canary', async () => {
    await logFilenameSanitized({ fileObj: { userId: 'uploader-2019', name: 'x.jpg' }, source: 'fileRead',
      reasons: ['exploit: html/script', 'URL-encoded name'], from: '%3Cb%3E.jpg', to: 'b.jpg' });
    assert.deepEqual(tripped, []);
    assert.equal(recorded.length, 1, 'the repair itself is still recorded');
    assert.equal(recorded[0].source, 'fileRead');
  });

  console.log(`filenameCanaryReasons: ${passed} tests passed`);
})().catch(err => { console.error(err); process.exit(1); });
