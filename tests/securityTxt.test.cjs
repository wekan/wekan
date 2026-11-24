'use strict';

// WP-9 (docs/Compliance/README.md): /.well-known/security.txt from the
// security contact ([RFC9116]), the support period in SECURITY.md, and a
// CycloneDX SBOM on every release, linked from Admin Panel / Settings /
// Version.
// Run: node --test tests/securityTxt.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const S = require('../models/lib/securityTxt');

const NOW = Date.UTC(2026, 10, 24, 12, 0, 0);

test('security.txt has a Contact per address and an Expires less than a year ahead', () => {
  const txt = S.securityTxt({ securityContact: 'security@example.com, https://example.com/report', rootUrl: 'https://kanban.example.com/', now: NOW });
  const lines = txt.trim().split('\n');
  assert.deepEqual(lines.filter(l => l.startsWith('Contact: ')), [
    'Contact: mailto:security@example.com', 'Contact: https://example.com/report',
  ]);
  const expires = lines.find(l => l.startsWith('Expires: ')).slice(9);
  assert.match(expires, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/, 'RFC 3339, as RFC 9116 2.5.5 asks');
  const ahead = Date.parse(expires) - NOW;
  assert.ok(ahead > 0 && ahead < 365 * 24 * 3600 * 1000, 'in the future, and less than a year');
  assert.ok(lines.includes('Canonical: https://kanban.example.com/.well-known/security.txt'));
  assert.ok(txt.endsWith('\n'));
});

test('negative: no contact, no file; and nothing but a mail address or https URI becomes a Contact', () => {
  assert.equal(S.securityTxt({ securityContact: '' }), null);
  assert.equal(S.securityTxt({}), null);
  assert.equal(S.securityTxt({ securityContact: 'javascript:alert(1) http://plain.example data:x' }), null);
  assert.equal(S.contactUri('http://not-https.example'), '', 'RFC 9116 wants https for a web contact');
  const txt = S.securityTxt({ securityContact: 'a@example.com\nContact: mailto:evil@example.com', rootUrl: 'http://x', now: NOW });
  assert.deepEqual(txt.split('\n').filter(l => l.startsWith('Contact')), ['Contact: mailto:a@example.com', 'Contact: mailto:evil@example.com'],
    'a value cannot add a field of its own: "Contact:" alone is no URI');
  assert.ok(!/Canonical/.test(txt), 'no Canonical for a site that is not https');
});

test('the route: served at /.well-known/security.txt and /security.txt, 404 without a contact', () => {
  const route = read('server/routes/securityTxt.js');
  assert.match(route, /WebApp\.handlers\.use\('\/\.well-known\/security\.txt', serveSecurityTxt\);/);
  assert.match(route, /WebApp\.handlers\.use\('\/security\.txt', serveSecurityTxt\);/);
  assert.match(route, /if \(!body\) \{\s*res\.writeHead\(404/);
  assert.match(route, /'Content-Type': 'text\/plain; charset=utf-8'/);
  assert.match(read('server/imports.js'), /import '\/server\/routes\/securityTxt';/);
});

test('the SBOM: a release job writes it from package-lock.json and attaches it; the Version pane links it', () => {
  const wf = read('.github/workflows/release-all.yml');
  const job = wf.slice(wf.indexOf('\n  sbom:\n'), wf.indexOf('\n  update-ondra-gantt-repos:'));
  assert.ok(job.length > 100, 'the sbom job exists');
  assert.match(job, /needs: \[prepare, release\]/);
  assert.match(job, /npm sbom --sbom-format cyclonedx --package-lock-only --omit dev/, 'npm\'s own, from the lock file');
  assert.match(job, /gh release upload "v\$\{VERSION\}" "wekan-\$\{VERSION\}-sbom\.cdx\.json" --clobber/);
  assert.equal(S.sbomUrl('v13.30.0'), 'https://github.com/wekan/wekan/releases/download/v13.30/wekan-13.30-sbom.cdx.json');
  assert.equal(S.sbomUrl('13.30'), 'https://github.com/wekan/wekan/releases/download/v13.30/wekan-13.30-sbom.cdx.json');
  assert.equal(S.sbomUrl('v13.30.1-dev'), '', 'no link for a build that is not a release');
  assert.match(read('client/components/settings/informationBody.jade'), /a\(href="\{\{sbomUrl\}\}"/);
});

test('SECURITY.md states the support period, and the operator guide exists', () => {
  const sec = read('SECURITY.md');
  assert.match(sec, /## Support period/);
  assert.match(sec, /newest WeKan release, and only there/);
  const guide = read('docs/Security/Compliance/README.md');
  for (const part of ['Encryption at rest', 'Break-glass access', 'Processors, DPA and BAA', 'GDPR', 'HIPAA', 'NIS2', 'ISO 27001', 'SOC 2']) {
    assert.ok(guide.includes(part), part);
  }
});
