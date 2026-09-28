'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ruleEmailRecipients: recipients, confirmRuleEmailAcceptance: confirm } = require('../../server/lib/syncRuleEmailAcceptance');
const composerPath = process.env.WEKAN_TEST_MAILCOMPOSER;
test('Meteor native MailComposer resolves named, quoted, grouped and international recipients', { skip: !composerPath }, () => {
  const MailComposer = require(composerPath);
  const mail = { from: 'sender@example.org', subject: 'Subject', text: 'Body',
    to: '"Surname, Name" <First@example.org>, Team: second@example.org, third@example.org;, First@example.org, user@bücher.example' };
  const expected = ['First@example.org', 'second@example.org', 'third@example.org', 'user@xn--bcher-kva.example'];
  assert.deepEqual(recipients(mail, MailComposer), expected);
  assert.equal(confirm(expected, { accepted: expected }), true);
  assert.throws(() => confirm(expected, { accepted: expected.slice(1), rejected: [expected[0]] }), /delivery-unconfirmed/);
  assert.throws(() => recipients({ ...mail, to: 'Empty Group:;' }, MailComposer), /recipients-invalid/);
});
