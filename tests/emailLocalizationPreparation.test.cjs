'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../server/lib/emailLocalization.js'), 'utf8')
  .replace(/^import .*;\n/gm, '').replace('export default EmailLocalization;', 'globalThis.localization = EmailLocalization;');
function fixture() {
  const events = [], sent = [];
  const context = { structuredClone, require: name => { assert.equal(name, './ruleEmailAttachments'); return require('../server/lib/ruleEmailAttachments'); }, Accounts: { emailTemplates: { from: 'default@example.org' } },
    ReactiveCache: { getUser: async id => { events.push(`user:${id}`); return { getLanguage: () => 'fi' }; } },
    TAPi18n: { getLanguage: () => 'en', ensureLanguageLoaded: async lang => { events.push(`load:${lang}`); },
      __: (key, params, lang) => { events.push(`translate:${key}`); return `${lang}:${key}:${params.name || ''}`; } },
    Email: { sendAsync: async mail => { sent.push(mail); return 'transport-result'; } } };
  vm.createContext(context); vm.runInContext(source, context);
  return { ...context, events, sent };
}
const options = { to: 'person@example.org', subject: 'email-subject', text: 'email-body', params: { name: 'Person' },
  userId: 'recipient', replyTo: 'reply@example.org', html: '<p>Body</p>' };
test('preparation resolves language and freezes translated transport content without sending', async () => {
  const f = fixture(), mail = await f.localization.prepareEmail(options);
  assert.deepEqual(JSON.parse(JSON.stringify(mail)), { to: options.to, from: 'default@example.org',
    subject: 'fi:email-subject:Person', text: 'fi:email-body:Person', html: options.html, replyTo: options.replyTo });
  assert.deepEqual(f.events, ['user:recipient', 'load:fi', 'translate:email-subject', 'translate:email-body']);
  assert.equal(f.sent.length, 0);
  // The already prepared message is unaffected by later locale/template changes.
  f.TAPi18n.__ = () => 'changed'; f.Accounts.emailTemplates.from = 'changed@example.org';
  assert.equal(mail.subject, 'fi:email-subject:Person');
  assert.equal(mail.from, 'default@example.org');
});
test('explicit locale and sender win; literal body and optional reply header retain semantics', async () => {
  const f = fixture();
  const mail = await f.localization.prepareEmail({ ...options, language: 'sv', from: 'sender@example.org', text: 'Literal body', replyTo: undefined });
  assert.equal(mail.text, 'Literal body'); assert.equal(mail.from, 'sender@example.org');
  assert.equal(Object.hasOwn(mail, 'replyTo'), false);
  assert.deepEqual(f.events, ['load:sv', 'translate:email-subject']);
});
test('missing recipient falls back to site language', async () => {
  const f = fixture(); f.ReactiveCache.getUser = async () => null;
  const mail = await f.localization.prepareEmail(options);
  assert.equal(mail.subject, 'en:email-subject:Person');
});
test('sendEmail uses the same prepared content and awaits the transport receipt', async () => {
  const f = fixture(), expected = await f.localization.prepareEmail(options);
  let release, entered, done = false;
  const started = new Promise(resolve => { entered = resolve; });
  f.Email.sendAsync = async mail => { assert.deepEqual(mail, expected); entered(); return new Promise(resolve => { release = resolve; }); };
  const execution = f.localization.sendEmail(options).then(result => { done = true; return result; });
  await started;
  assert.equal(done, false); release('receipt');
  assert.equal(await execution, 'receipt');
});
test('locale loading failure prevents translation and any send', async () => {
  const f = fixture(), error = new Error('language load failed');
  f.TAPi18n.ensureLanguageLoaded = async () => { throw error; };
  await assert.rejects(f.localization.sendEmail(options), value => value === error);
  assert.equal(f.events.some(event => event.startsWith('translate:')), false);
  assert.equal(f.sent.length, 0);
});
test('transport failure remains visible to the rule caller', async () => {
  const f = fixture(), error = new Error('send failed');
  f.Email.sendAsync = async () => { throw error; };
  await assert.rejects(f.localization.sendEmail(options), value => value === error);
});

test('plain text preparation omits absent HTML before BSON serialization', async () => {
  const f = fixture();
  const mail = await f.localization.prepareEmail({ ...options, html: undefined });
  assert.equal(Object.hasOwn(mail, 'html'), false);
  const { EJSON } = require('bson');
  assert.equal(Object.hasOwn(EJSON.parse(EJSON.stringify(mail)), 'html'), false);
});

test('attachment snapshots survive preparation and reach the transport unchanged', async () => {
  const f = fixture();
  const attachments = [{ filename: 'file.bin', contentType: 'application/octet-stream', encoding: 'base64', content: 'AP8=' }];
  const mail = await f.localization.prepareEmail({ ...options, attachments });
  attachments[0].content = 'YQ==';
  assert.equal(mail.attachments[0].content, 'AP8=');
  await f.localization.sendEmail({ ...options, attachments });
  assert.deepEqual(f.sent[0].attachments, attachments);
  await assert.rejects(f.localization.sendEmail({ ...options, attachments: [{ path: '/private/file' }] }), /invalid/);
  assert.equal(f.sent.length, 1);
});
