'use strict';

// The Recovery pane's rule email text said "This report does not retry or
// cancel delivery" long after Review, Resend, Mark as sent and Drop were added
// (2026-09-30). Corrected in every language on 2026-11-24: each says to open an
// attempt with Review, and names that locale's own Review button.
// Run: node --test tests/ruleEmailRecoveryDescription.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const dir = path.join(__dirname, '..', 'imports/i18n/data');
const K = 'rule-email-recovery-description';
const read = f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
const en = read('en.i18n.json');

test('English says what the pane does', () => {
  assert.match(en[K], /Open one with Review to resend it, mark it as sent or drop it\./);
  assert.doesNotMatch(en[K], /does not retry or cancel/, 'negative: the old sentence is gone');
});

test('every locale names its own Review button, and none keeps the old sentence', () => {
  const bad = [];
  for (const f of fs.readdirSync(dir).filter(n => n.endsWith('.i18n.json'))) {
    const d = read(f);
    if (!d[K]) continue;
    if (/does not retry or cancel/.test(d[K])) bad.push(`${f}: old English sentence`);
    // A label's own final stop (Tibetan's shad) is dropped inside a sentence.
    const review = (d['rule-email-recovery-review'] || '').replace(/[།.。]+$/u, '');
    if (review && !d[K].includes(review)) bad.push(`${f}: does not name "${review}"`);
  }
  assert.deepEqual(bad, []);
});
