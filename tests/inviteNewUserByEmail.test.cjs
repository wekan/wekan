'use strict';

// #6831: "Invite via Email" with the address of somebody who has no account
// added the site administrator to the board instead. Meteor 3's server
// Accounts.createUser is createUserAsync; without `await` the new id was a
// Promise, and ReactiveCache.getUser(Promise) - findOneAsync reads it as {} -
// answered with the FIRST user. The invitee's language and invitedBoards were
// written to that user too.
// Run: node tests/inviteNewUserByEmail.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { isThenable, assertNotPromiseSelector, guardSelectorMethods } = require('../models/lib/selectorGuard');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

let passed = 0;
async function test(name, fn) { await fn(); passed += 1; console.log('  ok -', name); }

(async () => {
  console.log('inviteNewUserByEmail:');

  await test('the reporter\'s case: the invitee is added, not the first user', async () => {
    // A users collection where the selector {} finds the first document, the
    // way findOneAsync treats a Promise.
    const users = [{ _id: 'admin', username: 'Admin-j', isAdmin: true }];
    const findOneAsync = async sel => (typeof sel === 'string'
      ? users.find(u => u._id === sel)
      : users.find(u => Object.keys(sel).every(k => u[k] === sel[k])));
    const createUser = async ({ username }) => { users.push({ _id: 'new1', username }); return 'new1'; };
    const cache = guardSelectorMethods({ async getUser(sel = {}) { return findOneAsync(sel); } });

    // Fixed: awaited.
    const id = await createUser({ username: 'newcomer' });
    assert.strictEqual((await cache.getUser(id)).username, 'newcomer');

    // Negative: the old, un-awaited call is refused rather than finding Admin-j.
    const promise = createUser({ username: 'newcomer2' });
    assert.strictEqual((await findOneAsync(promise)).username, 'Admin-j', 'without the guard: the first user');
    await assert.rejects(cache.getUser(promise), /a Promise was given as the id or selector/);
  });

  await test('the guard: only a thenable is refused', () => {
    for (const ok of ['id', { _id: 'id' }, {}, undefined, null, 0]) {
      assert.doesNotThrow(() => assertNotPromiseSelector(ok, 'x'));
    }
    assert.ok(isThenable(Promise.resolve(1)) && isThenable({ then() {} }));
    assert.throws(() => assertNotPromiseSelector(Promise.resolve('id'), 'x'), /missing await/);
  });

  await test('every server ReactiveCache getter is guarded', () => {
    const src = read('imports/reactiveCache.js');
    assert.match(src, /const \{ guardSelectorMethods \} = require\('\/models\/lib\/selectorGuard'\);/);
    const start = src.indexOf('const ReactiveCacheServer = {');
    const end = src.indexOf('\n};\n', start);
    assert.ok(start > 0 && end > start);
    assert.strictEqual(src.slice(end, end + 200).includes('guardSelectorMethods(ReactiveCacheServer);'), true);
    // guardSelectorMethods wraps get*: there are getters for it to wrap.
    assert.ok((src.slice(start, end).match(/\n  async get[A-Z]\w*\(/g) || []).length > 20);
  });

  await test('inviteUserToBoard awaits the account it creates, and checks it is that one', () => {
    const src = read('server/models/users.js');
    const invite = src.slice(src.indexOf('async inviteUserToBoard('));
    assert.match(invite, /const newUserId = await Accounts\.createUser\(\{ username, email \}\);/);
    assert.match(invite, /await Accounts\.sendEnrollmentEmail\(newUserId\);/);
    assert.match(invite, /if \(!user \|\| user\._id !== newUserId\) throw new Meteor\.Error\('error-user-notCreated'\);/);
  });

  await test('negative: no server file calls an async Accounts API without await', () => {
    // Meteor 3 made these async on the server; a bare call is a Promise used
    // as a value, the shape of #6831. Client files are not scanned: there
    // createUser takes a callback.
    const ASYNC = 'createUser|createUserAsync|sendEnrollmentEmail|sendResetPasswordEmail|sendVerificationEmail|setPassword|setPasswordAsync|addEmailAsync|replaceEmailAsync|setUsername|removeEmail|findUserByEmail|findUserByUsername';
    const files = execFileSync('git', ['ls-files', '*.js'], { cwd: root, encoding: 'utf8' }).split('\n')
      .filter(f => f && /^(server|models|imports|packages\/wekan-[^/]+\/server)\//.test(f) && !/(^|\/)client\//.test(f));
    // An arrow that returns the Promise (`() => Accounts.createUserAsync(...)`)
    // hands it on to an await, so it is not a bare call.
    const bare = new RegExp(`(?<!await |return |=> |\\.then\\()\\bAccounts\\.(${ASYNC})\\(`);
    const offenders = [];
    for (const f of files) {
      read(f).split('\n').forEach((line, i) => {
        if (/^\s*(\/\/|\*)/.test(line)) return;
        if (bare.test(line)) offenders.push(`${f}:${i + 1}: ${line.trim()}`);
      });
    }
    assert.deepStrictEqual(offenders, []);
    // The scan catches the v12.68 line.
    assert.ok(bare.test('      const newUserId = Accounts.createUser({ username, email });'));
    assert.ok(!bare.test('      const newUserId = await Accounts.createUser({ username, email });'));
  });

  console.log(`inviteNewUserByEmail: ${passed} passed`);
})().catch(e => { console.error(e); process.exit(1); });
