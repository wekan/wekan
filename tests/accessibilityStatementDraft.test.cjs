'use strict';

// WP-13 (docs/Compliance/README.md row 6.1, rows 6.3): the accessibility
// statement draft has every part [WAD] Art. 7(1) asks for, WeKan's axe scan
// runs the WCAG 2.2 AA rules, and focus that is hidden fails it.
// Run: node --test tests/accessibilityStatementDraft.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const { draftAccessibilityStatement } = require('../models/lib/accessibilityStatementDraft');

test('the draft has the compliance status, what is not accessible, feedback, enforcement and the date', () => {
  const draft = draftAccessibilityStatement(new Date(Date.UTC(2026, 10, 24)));
  for (const part of ['## Compliance status', '## Content that is not accessible', '## Feedback and contact',
    '## Enforcement procedure', '## Preparation of this statement', 'WCAG) 2.2, level AA', '2026-11-24']) {
    assert.ok(draft.includes(part), part);
  }
  assert.match(draft, /partially conformant/, 'it does not claim full conformance');
  assert.match(draft, /fill in/, 'it says what the operator still has to write');
});

test('negative: the draft only fills an empty text, never over what the operator wrote', () => {
  const js = read('client/components/settings/settingBody.js');
  assert.match(js, /if \(body && !body\.value\.trim\(\)\) \{\s*body\.value = require\('\/models\/lib\/accessibilityStatementDraft'\)\.draftAccessibilityStatement\(\);/);
  assert.match(read('client/components/settings/settingBody.jade'), /button\.js-accessibility-draft\(type="button"\)/);
});

test('the axe scan runs WCAG 2.2 AA, and checks that focus is never hidden', () => {
  const spec = read('tests/playwright/specs/45-axe-accessibility.e2e.js');
  assert.match(spec, /const TAGS = \['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'\];/);
  assert.match(spec, /keyboard focus is never hidden behind the header or a popup/);
  assert.match(spec, /toBeGreaterThan\(5\)/, 'and only counts when focus really moved');
  for (const url of ['/privacy', '/admin/problems/compliance', '/admin/people/audit-log']) assert.ok(spec.includes(`'${url}'`), url);
});

test('every control the 2.2 scan found too small is at least 24 x 24', () => {
  assert.match(read('client/components/cards/minicard.css'),
    /\.minicard \.minicard-collapse,\s*\.minicard \.minicard-details-menu-with-handle \{[^}]*min-width: 24px;\s*min-height: 24px;/);
});
