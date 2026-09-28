'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ruleEmailRecipients: recipients, confirmRuleEmailAcceptance: confirm } = require('../server/lib/syncRuleEmailAcceptance');
const composer = to => class { constructor(mail) { assert.equal(mail.subject, 'subject'); } compile() { return { getEnvelope: () => ({ to }) }; } };
test('the native envelope is deduplicated without conflating local-part case', () => {
  assert.deepEqual(recipients({ subject: 'subject' }, composer(['A@example.org', 'b@example.org', 'A@example.org', 'a@example.org'])),
    ['A@example.org', 'a@example.org', 'b@example.org']);
});
test('missing or malformed envelope recipients cannot pass preparation', () => {
  for (const value of [undefined, [], [null], [''], ['x\ny'], Array(1001).fill('a@example.org')]) {
    assert.throws(() => recipients({ subject: 'subject' }, composer(value)), /recipients-invalid/);
  }
  assert.throws(() => recipients({}, undefined), /composer-required/);
});
test('all intended recipients must be accepted with no rejections or unexpected addresses', () => {
  const expected = ['a@example.org', 'b@example.org'];
  assert.equal(confirm(expected, { accepted: ['b@example.org', { address: 'a@example.org' }], rejected: [] }), true);
  for (const result of [undefined, true, {}, { accepted: [] }, { accepted: ['a@example.org'] },
    { accepted: expected, rejected: ['b@example.org'] }, { accepted: [...expected, 'other@example.org'] },
    { accepted: [null, ...expected] }, { accepted: expected, rejected: 'invalid' }]) {
    assert.throws(() => confirm(expected, result), /delivery-unconfirmed/);
  }
  assert.throws(() => confirm(['A@example.org'], { accepted: ['a@example.org'] }), /delivery-unconfirmed/);
});
test('empty or duplicate expected recipients never become an acknowledgement', () => {
  for (const value of [[], null, [''], ['a', 'a']]) {
    assert.throws(() => confirm(value, { accepted: ['a'] }), /recipients-invalid/);
  }
});
