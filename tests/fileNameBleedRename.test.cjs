'use strict';

// Guard: FileNameBleed (2023), regressed. The fix refused markup in an
// attachment's new name on the server; "Try to fix build errors" (2023-02-21)
// deleted that check, leaving only the client's - so a direct
// renameAttachment call stored `<img src=x onerror=...>.png`. Display paths
// escape names today, so it did not execute; the server refuses it again, and
// stores every other name cleaned, as an upload's is.
// Run: node tests/fileNameBleedRename.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
// The modules use Meteor's absolute paths; resolve them from the repository.
const Module = require('node:module');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (/^\/(imports|models)\//.test(request)) return resolve.call(this, path.join(ROOT, `${request}.js`), ...rest);
  return resolve.call(this, request, ...rest);
};

test('the reported name is an exploit by the shared rule', () => {
  const { filenameLooksLikeExploit } = require('../models/lib/uploadFileName');
  for (const name of ['<img src=x onerror=alert(1)>.png', '<script>x</script>.txt', '../../etc/passwd', 'a\u0000.png']) {
    assert.equal(filenameLooksLikeExploit(name), true, name);
  }
  assert.equal(filenameLooksLikeExploit('Quarterly report (final).pdf'), false);
});

test('renameAttachment refuses it and records the attempt, then stores a cleaned name', () => {
  const src = read('models/attachments.server.js');
  const at = src.indexOf('async renameAttachment(');
  const body = src.slice(at, src.indexOf('\n  },', at));
  const authz = body.indexOf("requireBoardMutation(currentUserId, board, 'renameAttachment', Meteor);");
  const guard = body.indexOf('if (filenameLooksLikeExploit(newName)) {');
  const write = body.indexOf('rename(fileObj, cleanName, fileStoreStrategyFactory);');
  assert.ok(authz > 0 && guard > authz && write > guard, 'access, then the name, then the write');
  assert.match(body, /key: 'file\.name', action: 'blocked', source: 'renameAttachment'/);
  assert.match(body, /const cleanName = cleanFileName\(newName\);/);
  assert.doesNotMatch(body, /rename\(fileObj, newName,/);
});

test('negative: no server code renames a stored file to an unchecked name', () => {
  const walk = dir => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap(e => {
    if (e.name === 'tests' || e.name.startsWith('_build') || e.name === 'node_modules') return [];
    const rel = `${dir}/${e.name}`;
    return e.isDirectory() ? walk(rel) : (rel.endsWith('.js') ? [rel] : []);
  });
  const offenders = [];
  for (const file of ['models', 'server'].flatMap(walk)) {
    const src = read(file);
    for (const m of src.matchAll(/[^.\w]rename\((\w+), (\w+), /g)) {
      // A name from the upload cleaner (correctedNameForStoredFile, used by the
      // admin-only extension migration) is a cleaned name too.
      const cleaned = ['cleanName', 'correctedName'].includes(m[2]) ||
        (m[2] === 'name' && /const \{ name, changed, detectedMime \} = await correctedNameForStoredFile\(/.test(src));
      if (!cleaned) offenders.push(`${file}: rename(${m[1]}, ${m[2]}, ...)`);
    }
  }
  assert.deepEqual(offenders, []);
});
