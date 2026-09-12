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
  const placeholderTemplate = fs.readFileSync(path.join(root, 'client/components/rules/actions/checklistActions.jade'), 'utf8');
  assert.match(placeholderTemplate, /input\(id="checklist-items",type=text,placeholder="{{_'r-items-list'}}"\)/);
  for (const review of reviews.filter(row => row.key === 'r-items-list' && row.locale !== 'sk')) {
    assert.deepEqual(review.value.split(',').map(value => value.trim().replace(/ /g, '')), ['item1', 'item2', 'item3']);
    assert.match(review.reason, /placeholder demonstrates/);
  }
  assert.equal(reviews.find(row => row.locale === 'sk' && row.key === 'r-items-list').value, 'položka1,položka2,položka3', 'valid Slovak example vocabulary remains unchanged');
  for (const locale of ['de', 'de-AT', 'de-CH', 'de_DE', 'sk', 'fr', 'fr-BE', 'fr-CA', 'fr-CH', 'fr-FR', 'cs', 'cs-CZ', 'hu', 'it', 'es', 'es-LA', 'pt', 'pt-BR', 'pt-PT', 'pt_PT', 'nl', 'nl-NL', 'nb', 'sv', 'vl-SS']) {
    assert.equal(result.pendingByLocale[locale], undefined, `${locale}: review queue resolved`);
  }
  console.log(`auditedTranslationReviews: ${reviews.length} explicit unchanged acceptances verified; Danish queue complete`);
})().catch(error => { console.error(error); process.exitCode = 1; });
