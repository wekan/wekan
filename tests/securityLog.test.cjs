'use strict';

// Unit + negative tests for the security/speed logger pure helpers
// (models/lib/securityLogFormat.js) and the category catalog
// (models/lib/securityCategories.js). See docs/Security/Remediation/WeKan.md.
// Runs under plain node (no Meteor/fs writes beyond a read-only statfs probe).

const assert = require('assert');
const fmt = require('../models/lib/securityLogFormat.js');
const cats = require('../models/lib/securityCategories.js');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// ── category catalog ────────────────────────────────────────────────────────
check('categoryFor maps a known key to its Bleed name', () => {
  const c = cats.categoryFor('ssrf.redirect');
  assert.strictEqual(c.category, 'ssrf');
  assert.strictEqual(c.bleed, 'RedirectBleed');
  assert.strictEqual(c.severity, 'high');
  assert.strictEqual(c.cwe, 'CWE-918');
});
check('categoryFor falls back to a generic entry for unknown keys', () => {
  const c = cats.categoryFor('does.not.exist');
  assert.strictEqual(c.category, 'unknown');
  assert.strictEqual(c.bleed, 'Generic');
});
check('every catalog entry has category+bleed+severity', () => {
  for (const [k, v] of Object.entries(cats.CATALOG)) {
    assert.ok(v.category && v.bleed && v.severity, `catalog ${k} incomplete`);
  }
});

// ── sanitizeDetail (negative/hostile inputs) ────────────────────────────────
check('sanitizeDetail collapses newlines/tabs to one line', () => {
  assert.strictEqual(fmt.sanitizeDetail('a\nb\tc\r\nd'), 'a b c d');
});
check('sanitizeDetail truncates an oversize detail', () => {
  const out = fmt.sanitizeDetail('x'.repeat(1000));
  assert.ok(out.length <= fmt.MAX_DETAIL, 'must be capped');
  assert.ok(out.endsWith('…'), 'truncation marker');
});
check('sanitizeDetail handles null/undefined', () => {
  assert.strictEqual(fmt.sanitizeDetail(null), '');
  assert.strictEqual(fmt.sanitizeDetail(undefined), '');
});

// ── formatLine / parseLine round-trip ───────────────────────────────────────
check('formatLine is a single tab-separated line in the documented order', () => {
  const line = fmt.formatLine({
    at: '2026-07-19T14:03:59.123Z', severity: 'high', category: 'ssrf', bleed: 'RedirectBleed',
    action: 'blocked', source: 'localizeAvatar', cwe: 'CWE-918', userId: 'abc', detail: 'redirect to 127.0.0.1 refused',
  });
  assert.ok(!line.includes('\n'));
  const c = line.split('\t');
  assert.strictEqual(c[0], '2026-07-19T14:03:59.123Z');
  assert.strictEqual(c[1], 'high');
  assert.strictEqual(c[2], 'ssrf');
  assert.strictEqual(c[3], 'RedirectBleed');
  assert.strictEqual(c[4], 'blocked');
  assert.strictEqual(c[7], 'user:abc');
});
check('parseLine round-trips a formatted line', () => {
  const evt = { at: '2026-07-19T14:03:59.123Z', severity: 'medium', category: 'xss', bleed: 'SourceBleed',
    action: 'sanitized', source: 'sourceLink', cwe: 'CWE-79', userId: 'u1', detail: 'dropped javascript: href' };
  const back = fmt.parseLine(fmt.formatLine(evt));
  assert.strictEqual(back.category, 'xss');
  assert.strictEqual(back.bleed, 'SourceBleed');
  assert.strictEqual(back.detail, 'dropped javascript: href');
});
check('parseLine returns null for a malformed line', () => {
  assert.strictEqual(fmt.parseLine('garbage without tabs'), null);
  assert.strictEqual(fmt.parseLine(''), null);
  assert.strictEqual(fmt.parseLine('a\tb\tc'), null);
});

// ── runDirFor (UTC dated path) ──────────────────────────────────────────────
check('runDirFor builds <root>/<sub>/YYYY-MM/DD/HH_MM_SS from UTC', () => {
  const d = new Date(Date.UTC(2026, 6, 19, 14, 3, 22)); // month 6 = July
  const p = fmt.runDirFor('security', d, '/data');
  assert.ok(p.endsWith('/files/security/2026-07/19/14_03_22'), p);
});
check('filesRoot respects the Snap /files convention', () => {
  assert.strictEqual(fmt.filesRoot('/var/snap/wekan/common/files'), '/var/snap/wekan/common/files');
  assert.strictEqual(fmt.filesRoot('/data'), require('path').join('/data', 'files'));
});

// ── tally + summary (counts per category / Bleed / severity) ────────────────
check('tallyAdd counts per category, Bleed and severity', () => {
  const t = {};
  fmt.tallyAdd(t, { category: 'ssrf', bleed: 'RedirectBleed', severity: 'high', action: 'blocked' });
  fmt.tallyAdd(t, { category: 'ssrf', bleed: 'LiveBleed', severity: 'high', action: 'blocked' });
  fmt.tallyAdd(t, { category: 'xss', bleed: 'SourceBleed', severity: 'medium', action: 'sanitized' });
  assert.strictEqual(t.total, 3);
  assert.strictEqual(t.byCategory.ssrf.total, 2);
  assert.strictEqual(t.byCategory.ssrf.byBleed.RedirectBleed, 1);
  assert.strictEqual(t.byCategory.ssrf.byBleed.LiveBleed, 1);
  assert.strictEqual(t.bySeverity.high, 2);
  assert.strictEqual(t.byAction.blocked, 2);
});
check('renderSummary shows totals, per-category Bleed breakdown and severities', () => {
  const t = {};
  fmt.tallyAdd(t, { category: 'ssrf', bleed: 'RedirectBleed', severity: 'high', action: 'blocked' });
  const s = fmt.renderSummary(t, { startedAt: 'A', updatedAt: 'B' });
  assert.ok(s.includes('Total events: 1'));
  assert.ok(s.includes('ssrf'));
  assert.ok(s.includes('RedirectBleed 1'));
  assert.ok(s.includes('By severity: critical 0, high 1'));
});

// ── hasEnoughDiskSpace (fail-open + boolean) ────────────────────────────────
check('hasEnoughDiskSpace returns a boolean and fail-opens on a bad path', () => {
  assert.strictEqual(typeof fmt.hasEnoughDiskSpace(__dirname, 1024), 'boolean');
  // an impossible requirement must be false on a real fs; a bogus path fail-opens true
  assert.strictEqual(fmt.hasEnoughDiskSpace('\0not-a-path', 1024), true);
});

console.log(`\nsecurityLog: ${passed} checks passed`);
