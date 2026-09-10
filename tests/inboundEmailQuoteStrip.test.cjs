'use strict';

// Plain-Node unit test (no Meteor) for #2414 reply-by-email's reply-quote
// stripping heuristic: server/lib/inboundEmailQuoteStrip.js.
// Run: node tests/inboundEmailQuoteStrip.test.cjs

const assert = require('assert');
const { stripQuotedReply } = require('../server/lib/inboundEmailQuoteStrip.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('cuts at "On ... wrote:" (Gmail/Apple Mail style)', () => {
  const body = 'Sounds good, will do.\n\nOn Tue, Sep 9, 2026 at 3:00 PM Alice <alice@example.com> wrote:\n> original message text\n> more quoted text';
  assert.strictEqual(stripQuotedReply(body), 'Sounds good, will do.');
});

test('cuts at a ">" quoted line', () => {
  const body = 'My reply text here.\n> quoted line one\n> quoted line two';
  assert.strictEqual(stripQuotedReply(body), 'My reply text here.');
});

test('cuts at "-----Original Message-----" (Outlook style)', () => {
  const body = 'Thanks, looks fine.\n-----Original Message-----\nFrom: bob@example.com\nSubject: Re: card';
  assert.strictEqual(stripQuotedReply(body), 'Thanks, looks fine.');
});

test('cuts at a "From:" header block (Outlook style)', () => {
  const body = 'Approved.\nFrom: carol@example.com\nSent: Tuesday';
  assert.strictEqual(stripQuotedReply(body), 'Approved.');
});

test('a body with no quote markers is kept, only trimmed', () => {
  const body = '  Just a plain reply, no quoting.  \n\n';
  assert.strictEqual(stripQuotedReply(body), 'Just a plain reply, no quoting.');
});

test('multi-line reply above the quote is fully kept', () => {
  const body = 'Line one.\nLine two.\nLine three.\n\nOn Mon wrote:\n> quoted';
  assert.strictEqual(stripQuotedReply(body), 'Line one.\nLine two.\nLine three.');
});

test('non-string input returns empty string, never throws', () => {
  assert.strictEqual(stripQuotedReply(null), '');
  assert.strictEqual(stripQuotedReply(undefined), '');
  assert.strictEqual(stripQuotedReply(42), '');
});

console.log(`inboundEmailQuoteStrip: ${passed} passed`);
