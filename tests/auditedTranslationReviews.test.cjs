'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
(async () => {
  const { repairProgress } = await import('../releases/translations/audit-progress.mjs');
  const reviews = JSON.parse(fs.readFileSync(path.join(root, 'releases/translations/audited-reviews.json'), 'utf8'));
  const result = repairProgress();
  const auditKeys = new Set(result.rows.map(row => `${row.locale}:${row.key}`));
  const seen = new Set();
  for (const review of reviews) {
    const identity = `${review.locale}:${review.key}`;
    assert.ok(auditKeys.has(identity), identity);
    assert.ok(!seen.has(identity), `duplicate review ${identity}`);
    seen.add(identity);
    assert.ok(review.reason.trim(), 'each unchanged acceptance has an explicit explanation');
    const data = JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${review.locale}.i18n.json`), 'utf8'));
    assert.equal(data[review.key], review.value, identity);
    assert.equal(result.rows.find(row => `${row.locale}:${row.key}` === identity).status, 'reviewedUnchanged');
  }
  assert.equal(result.pendingByLocale.da, undefined, 'all Danish findings are corrected or individually accepted');
  assert.equal(reviews.find(row => row.locale === 'da' && row.key === 'DDP_transport').value, 'DDP-transport (DDP_TRANSPORT)', 'valid Danish technical vocabulary remains untouched');
  console.log(`auditedTranslationReviews: ${reviews.length} explicit unchanged acceptances verified; Danish queue complete`);
})().catch(error => { console.error(error); process.exitCode = 1; });
