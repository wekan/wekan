'use strict';

// The installed imapflow and mailparser, run the way server/lib/imapInbound.js
// runs them, against the fake IMAP server the Meteor runtime test uses
// (server/lib/tests/fakeImapServer.js) - so a dependency update that changes
// what WeKan's poller calls fails here, in seconds, before a real mailbox.
// imapflow went 2.1.2 -> 2.8.0 and mailparser 3.9.31 -> 3.12.2 in one step.
// Run: node tests/imapflowMailparserRuntime.test.cjs

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');

const ROOT = path.join(__dirname, '..');
const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');

let passed = 0;
async function test(name, fn) { await fn(); passed += 1; console.log('  ok -', name); }

const MESSAGE = [
  'From: "Ann Example" <ann@example.test>',
  'To: cards@example.test',
  'Subject: A card from email',
  'Message-ID: <one@example.test>',
  'Content-Type: text/plain; charset=utf-8',
  '',
  'The card description.',
  '',
].join('\n');

(async () => {
  // fakeImapServer.js is an ES module in a CommonJS package: load a copy as .mjs.
  const dir = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'wekan-imap-'));
  const copy = path.join(dir, 'fakeImapServer.mjs');
  fs.copyFileSync(path.join(ROOT, 'server/lib/tests/fakeImapServer.js'), copy);
  const { startFakeImapServer } = await import(pathToFileURL(copy).href);
  const imap = await startFakeImapServer({ user: 'cards@example.test', password: 'right-password' });
  const client = (password) => new ImapFlow({
    host: '127.0.0.1', port: imap.port, secure: false,
    auth: { user: 'cards@example.test', pass: password }, logger: false,
  });
  try {
    imap.deliver(MESSAGE);
    imap.deliver(MESSAGE.replace('<one@', '<two@').replace('A card from email', 'Second card'));

    await test('the poller reads unseen mail, parses it, and marks it read', async () => {
      const c = client('right-password');
      await c.connect();
      try {
        const lock = await c.getMailboxLock('INBOX');
        try {
          assert.strictEqual(String(c.mailbox.uidValidity), '7');
          const uids = (await c.search({ seen: false }, { uid: true })).sort((a, b) => a - b);
          assert.deepStrictEqual(uids, [1, 2]);
          const msg = await c.fetchOne(String(uids[0]), { source: true, size: true }, { uid: true });
          assert.ok(Buffer.isBuffer(msg.source) && msg.size > 0);
          const parsed = await simpleParser(msg.source, { skipImageLinks: true, skipTextLinks: true });
          assert.strictEqual(parsed.subject, 'A card from email');
          assert.strictEqual(parsed.from.value[0].address, 'ann@example.test');
          assert.strictEqual(parsed.from.value[0].name, 'Ann Example');
          assert.strictEqual(parsed.messageId, '<one@example.test>');
          assert.match(parsed.text, /The card description\./);
          await c.messageFlagsAdd(String(uids[0]), ['\\Seen'], { uid: true });
          assert.deepStrictEqual(await c.search({ seen: false }, { uid: true }), [2]);
          // The next poll asks from the last UID on.
          assert.deepStrictEqual((await c.search({ uid: '2:*' }, { uid: true })), [2]);
        } finally {
          lock.release();
        }
      } finally {
        await c.logout().catch(() => {});
      }
    });

    await test('a wrong password is refused, and the error says so (negative)', async () => {
      const c = client('wrong-password');
      await assert.rejects(c.connect(), err => /auth|login|fail/i.test(`${err.message} ${err.responseText || ''} ${err.authenticationFailed}`));
    });

    await test('a display name that only looks like an address does not become one (negative)', async () => {
      // mailparser 3.9.40: "never turn a decoded display name into an address".
      const parsed = await simpleParser(Buffer.from([
        'From: =?utf-8?Q?attacker=40evil.test?= <ann@example.test>',
        'Subject: x', '', 'body', '',
      ].join('\r\n')));
      assert.deepStrictEqual(parsed.from.value.map(v => v.address), ['ann@example.test']);
    });
  } finally {
    await imap.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
  console.log(`\n${passed} passed`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
