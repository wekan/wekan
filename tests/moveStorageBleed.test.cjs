'use strict';

// MoveStorageBleed (SnowBleed sub-finding 8, reported 2026-01-05 by Joshua
// Rogers of Aisle Research, fixed in WeKan v8.21 by commit c413a7e860): the
// Meteor methods moveAttachmentToStorage, validateAttachment and
// validateAttachmentAndMoveToStorage took an attachment id and a storage name
// from any caller, signed in or not, and moved that attachment between storage
// backends (or ran validation, which DELETES a file it finds invalid) - any
// client could shuffle or remove the files of any board, and name a storage
// destination of its choosing. Now every one requires a signed-in caller who
// can see the attachment's board, the two that move a file also require a
// site admin (it is the Admin Panel's storage migration), and the destination
// must be one of the known storage names. The methods live in
// models/attachments.server.js today.
//
// The test runs the real method bodies against stubs. The negative test walks
// the server tree: every Meteor method that hands a caller-supplied storage
// name to moveToStorage() refuses non-admins and unknown names first.
//
// The move refusals are not recorded in Admin Panel / Problems: that fix
// predates the Problems log and is unchanged. The 2026-10-27 audit found a
// sibling - validateAttachment, which deletes a file failing the current
// upload rules, was open to anybody who could see the board - now limited to
// who may change the file, and its refusal recorded (authz.attachment-validate).
// Run: node tests/moveStorageBleed.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const pending = [];
const test = (name, fn) => pending.push([name, fn]);

class MeteorError extends Error {
  constructor(error, reason) { super(reason || error); this.error = error; }
}

const src = read('models/attachments.server.js');
const slice = (from, to) => {
  const a = src.indexOf(from);
  const b = src.indexOf(to, a);
  assert.ok(a > 0 && b > a, `${from.trim()} is in models/attachments.server.js`);
  return src.slice(a, b);
};
const body = slice('  async moveAttachmentToStorage(fileObjId, storageDestination) {', '  async renameAttachment(')
  + slice('  async validateAttachment(fileObjId) {', '\n});\n');

const effects = [];
const boards = { priv: { _id: 'priv', isVisibleBy: user => !!user && ['member', 'admin', 'reader'].includes(user._id) } };
const users = { admin: { _id: 'admin', isAdmin: true }, member: { _id: 'member' }, reader: { _id: 'reader' }, outsider: { _id: 'outsider' }, siteAdmin: { _id: 'siteAdmin', isAdmin: true } };
const recorded = [];
let fileValid = true;
const methods = vm.runInNewContext(`({${body}})`, {
  check() {},
  // validateAttachment asks who may change the file: only 'member' (and the
  // site admins) may write the board; 'reader' only sees it.
  require: name => ({
    '/server/lib/linkedCardPermission': { canEditCardOrLinkedCard: async userId => userId === 'member' },
    '/server/lib/utils': { allowIsBoardMemberWithWriteAccess: userId => userId === 'member' },
    '/server/lib/securityLog': { record: evt => recorded.push(evt) },
  }[name]),
  Meteor: {
    Error: MeteorError,
    callAsync: async (name, ...args) => { effects.push(['call', name]); return methods[name].apply(current, args); },
    defer: fn => effects.push(['defer']),
    call: () => effects.push(['call']),
  },
  ReactiveCache: {
    getUser: async id => users[id] || null,
    getAttachment: async id => (id === 'file' ? { _id: 'file', meta: { boardId: 'priv' } } : null),
    getBoard: async id => boards[id] || null,
  },
  moveToStorage: (file, dest) => effects.push(['move', dest]),
  fileStoreStrategyFactory: {},
  getAttachmentUploadMaxBytes: async () => 1,
  isFileValid: async () => { effects.push(['validate']); return fileValid; },
  attachmentUploadMimeTypes: [], attachmentUploadExternalProgram: '',
  Attachments: { removeAsync: async () => effects.push(['remove']) },
});
let current;
const call = (userId, name, ...args) => { current = { userId }; effects.length = 0; return methods[name].apply(current, args); };

test('the attack: not signed in, or an outsider of the board - refused, the file untouched', async () => {
  for (const userId of [null, 'outsider']) {
    for (const [name, args] of [
      ['moveAttachmentToStorage', ['file', 'fs']],
      ['validateAttachment', ['file']],
      ['validateAttachmentAndMoveToStorage', ['file', 'fs']],
    ]) {
      await assert.rejects(call(userId, name, ...args), e => e.error === 'not-authorized', `${name} as ${userId}`);
      assert.deepStrictEqual(effects, [], `${name} as ${userId}: nothing done`);
    }
  }
});

test('the attack: a board member who is not a site admin cannot move a file', async () => {
  for (const name of ['moveAttachmentToStorage', 'validateAttachmentAndMoveToStorage']) {
    await assert.rejects(call('member', name, 'file', 'gridfs'), e => e.error === 'not-authorized', name);
    assert.deepStrictEqual(effects, []);
  }
});

test('the attack: a site admin who cannot see the board, or an unknown destination - refused', async () => {
  for (const name of ['moveAttachmentToStorage', 'validateAttachmentAndMoveToStorage']) {
    await assert.rejects(call('siteAdmin', name, 'file', 'gridfs'), e => e.error === 'not-authorized', name);
    for (const dest of ['../../etc', 'ftp', '', 'GRIDFS']) {
      await assert.rejects(call('admin', name, 'file', dest), e => e.error === 'invalid-storage-destination', `${name} to ${dest}`);
      assert.deepStrictEqual(effects, []);
    }
  }
});

// 2026-10-27 regression audit, sibling: validateAttachment deletes a file
// that fails the CURRENT upload rules, and seeing the board was enough - so
// any viewer, of a public board too, could delete its attachments.
test('the attack: a reader of the board cannot validate - and so delete - a file; recorded', async () => {
  fileValid = false;
  recorded.length = 0;
  await assert.rejects(call('reader', 'validateAttachment', 'file'), e => e.error === 'not-authorized');
  assert.deepStrictEqual(effects, [], 'nothing validated, nothing removed');
  assert.strictEqual(recorded.length, 1);
  assert.strictEqual(recorded[0].key, 'authz.attachment-validate');
  assert.strictEqual(recorded[0].action, 'blocked');
  fileValid = true;
});

test('negative: an admin of the board moves files, a member validates them', async () => {
  fileValid = true;
  await call('admin', 'moveAttachmentToStorage', 'file', 'gridfs');
  assert.deepStrictEqual(effects, [['move', 'gridfs']]);
  await call('admin', 'validateAttachmentAndMoveToStorage', 'file', 's3');
  assert.deepStrictEqual(effects, [['call', 'validateAttachment'], ['validate'], ['defer']]);
  await call('member', 'validateAttachment', 'file');
  assert.deepStrictEqual(effects, [['validate']]);
  fileValid = false;
  await call('member', 'validateAttachment', 'file');
  assert.deepStrictEqual(effects, [['validate'], ['remove']], 'an invalid file is removed');
});

// Negative, whole tree: wherever a Meteor method passes a storage name it was
// GIVEN to moveToStorage(), the method refuses non-admins and unknown names
// first. Destinations the server picks itself (the default storage setting, a
// file's own recorded storage) are not caller input and are not matched here.
test('negative: no method moves a file to a caller-named storage unchecked', () => {
  const skip = new Set(['node_modules', '_build', '.build', '.tools', '.git', 'tests', '.meteor', 'client']);
  const walk = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(entry => {
    if (skip.has(entry.name)) return [];
    const rel = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(rel) : /\.(c|m)?js$/.test(entry.name) ? [rel] : [];
  });
  let methodCallers = 0;
  for (const file of ['server', 'models', 'packages', 'imports'].flatMap(walk)) {
    const text = read(file);
    if (!/Meteor\.methods\(/.test(text)) continue;
    for (const head of text.matchAll(/\n  async (\w+)\(([^)]*)\) \{/g)) {
      const params = head[2].split(',').map(p => p.trim().replace(/\s*=.*$/, '')).filter(Boolean);
      const next = text.indexOf('\n  },', head.index);
      const fn = text.slice(head.index, next < 0 ? text.length : next);
      for (const m of fn.matchAll(/moveToStorage\(\s*\w+,\s*(\w+)/g)) {
        if (!params.includes(m[1])) continue;
        methodCallers += 1;
        const at = m.index;
        assert.ok(/\.isAdmin\b/.test(fn.slice(0, at)), `${file} ${head[1]}: site admin required before the move`);
        assert.ok(new RegExp(`(?:allowedDestinations|ALLOWED_DESTINATIONS)\\.includes\\(${m[1]}\\)`).test(fn.slice(0, at)),
          `${file} ${head[1]}: ${m[1]} checked against the known storage names`);
      }
    }
  }
  assert.ok(methodCallers >= 1, 'found moveAttachmentToStorage');
});

test('validate-and-move moves the file itself after it returns, not through a method with no user', () => {
  const src = read('models/attachments.server.js');
  const at = src.indexOf('async validateAttachmentAndMoveToStorage(');
  assert.ok(at > 0);
  const fn = src.slice(at, src.indexOf('\n  },', at));
  assert.match(fn, /Meteor\.defer\(\(\) => Promise\.resolve\(moveToStorage\(fileObjAfter, storageDestination, fileStoreStrategyFactory\)\)/);
  assert.doesNotMatch(fn, /Meteor\.call(?:Async)?\('moveAttachmentToStorage'/,
    'Meteor.defer has no method invocation, so the login check refused the move every time');
});

test('negative: no deferred or timed callback in server/ or models/ calls a Meteor method', () => {
  // A method called from Meteor.defer or a timer runs with no userId, so one
  // that checks its caller refuses every time, silently.
  const offenders = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.') || entry.name === '_build') continue;
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(rel); continue; }
      if (!/\.(js|cjs|mjs)$/.test(entry.name)) continue;
      const src = read(rel);
      for (const m of src.matchAll(/Meteor\.(?:defer|setTimeout)\(/g)) {
        if (/Meteor\.call(?:Async)?\(/.test(src.slice(m.index, m.index + 160))) offenders.push(rel);
      }
    }
  };
  ['server', 'models'].forEach(walk);
  assert.deepStrictEqual(offenders, []);
});

let finished = false;
// A test whose promise never settles would otherwise end the run silently.
process.on('beforeExit', () => { if (!finished) { console.error('moveStorageBleed: a test never settled'); process.exit(1); } });
(async () => {
  console.log('moveStorageBleed:');
  for (const [name, fn] of pending) {
    await fn();
    console.log('  ok -', name);
  }
  console.log(`\nmoveStorageBleed: ${pending.length} tests passed`);
  finished = true;
})().catch(e => { console.error(e); process.exit(1); });
