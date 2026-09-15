'use strict';
const assert = require('node:assert/strict');
(async () => {
  const { parseAudit, repairProgress, classifyAuditRow, updateAuditSummary } = await import('../releases/translations/audit-progress.mjs');
  const sample = '### Wrong language — current local values\n| lv.i18n.json | Latvian | example |  &#95;&#95;card&#95;&#95; &amp; x&#124;y<br>next  | Not available — not queried | Check. |';
  const [row] = parseAudit(sample);
  assert.equal(row.local, ' __card__ & x|y\nnext ');
  assert.equal(row.originalPull, false);
  assert.equal(classifyAuditRow(row, 'old', undefined, undefined), 'pending', 'untracked edits do not certify a repair');
  assert.equal(classifyAuditRow(row, 'new', { after: 'new' }, undefined), 'corrected');
  assert.equal(classifyAuditRow(row, 'new', { after: 'obsolete' }, undefined), 'pending', 'a future translation needs review');
  assert.equal(classifyAuditRow(row, 'accepted', undefined, { value: 'accepted' }), 'reviewedUnchanged');
  assert.equal(classifyAuditRow({ ...row, originalPull: true }, row.local), 'restoredPrePull');
  assert.throws(() => parseAudit(sample + '\n' + sample.split('\n')[1]), /Duplicate audit key/);
  const result = repairProgress();
  const { summary } = result;
  const fs = require('node:fs');
  const path = require('node:path');
  const english = JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data/en.i18n.json'), 'utf8'));
  const tokens = value => (value.match(/__[A-Za-z0-9]+(?:_[A-Za-z0-9]+)*__|%(?:\d+\$)?[A-Za-z]|%\{[^}]+\}/g) || []).sort();
  for (const restored of result.rows.filter(row => row.status === 'restoredPrePull')) {
    assert.deepEqual(tokens(restored.current), tokens(english[restored.key]), `${restored.locale}:${restored.key}: restored placeholders match source`);
    assert.equal(classifyAuditRow(restored, restored.current), 'restoredPrePull', 'placeholder validity alone does not certify the language');
  }
  assert.notDeepEqual(tokens('__translated__ %s'), tokens('__card__ %s'), 'renamed placeholders are detectable');
  assert.notDeepEqual(tokens('__card__'), tokens('__card__ %s'), 'removed placeholders are detectable');
  const report = fs.readFileSync(path.join(__dirname, '../docs/Features/Translations/Audit.md'), 'utf8');
  const pendingTable = Object.fromEntries([...report.matchAll(
    /^\| ([\w-]+) — [^|]+ \| (\d+) \|$/gm,
  )].map(([, locale, count]) => [locale, Number(count)]));
  assert.deepEqual(pendingTable, result.pendingByLocale,
    'summary locale counts reflect current repairs, rather than historic counts');
  assert.equal(Object.values(pendingTable).reduce((total, count) => total + count, 0),
    summary.pending, 'locale counts reconcile with the full pending queue');
  const updated = updateAuditSummary(report, summary, 12345, '2026-09-13');
  assert.ok(updated.includes('contain **12,345** exact'));
  assert.ok(updated.includes(`| Pending review or repair | ${summary.pending.toLocaleString('en-US')} |`));
  assert.equal(updateAuditSummary(updated, summary, 12345, '2026-09-13'), updated, 'refresh is idempotent');
  assert.ok(updated.includes(report.match(/Latest translation fix:.*$/m)[0]), 'refresh preserves reviewed fix details and commit hash');
  assert.throws(() => updateAuditSummary('', summary, 0, '2026-09-13'), /Missing summary row/);
  const staleReport = report.replace('| --- | ---: |\n\nRemaining review',
    '| --- | ---: |\n| zgh — Standard Moroccan Tamazight | 999 |\n\nRemaining review');
  const refreshed = updateAuditSummary(staleReport, summary, 12345, '2026-09-13', result);
  assert.doesNotMatch(refreshed, /\| zgh —/, 'resolved locales disappear from the table');
  assert.equal(updateAuditSummary(refreshed, summary, 12345, '2026-09-13', result), refreshed);
  const changed = {
    ...result,
    pendingByLocale: { zgh: 1, lv: 2 },
    rows: [...result.rows,
      { locale: 'zgh', language: 'Standard Moroccan Tamazight' },
      { locale: 'lv', language: 'Latvian' }],
  };
  const changedSummary = { ...summary, pending: 3 };
  const withNewLocale = updateAuditSummary(report, changedSummary, 12345, '2026-09-13', changed);
  assert.match(withNewLocale, /\| lv — Latvian \| 2 \|/);
  const withoutLocale = { ...changed, pendingByLocale: { lv: 2 } };
  const removed = updateAuditSummary(withNewLocale, { ...summary, pending: 2 },
    12345, '2026-09-13', withoutLocale);
  assert.doesNotMatch(removed, /\| zgh —/);
  assert.throws(() => updateAuditSummary(report, summary, 0, '2026-09-13', changed), /do not reconcile/);
  assert.throws(() => updateAuditSummary(report.replace('| Pending locale | Findings |', ''),
    summary, 0, '2026-09-13', result), /Missing pending locale table/);
  assert.ok(refreshed.includes(report.match(/Latest translation fix:.*$/m)[0]),
    'full refresh preserves dated translation fix evidence');

  assert.equal(summary.auditedKeys, 20081, 'all original pull and full-local audit rows remain accounted for');
  assert.equal(summary.auditedKeys, summary.corrected + summary.restoredPrePull + summary.reviewedUnchanged + summary.pending);
  assert.equal(result.pendingByLocale.bs, undefined, 'every flagged Bosnian key has been repaired');
  assert.equal(result.pendingByLocale.hr, undefined, 'every flagged Croatian key has been repaired');
  for (const locale of ['sl', 'sl_SI']) assert.equal(result.pendingByLocale[locale], undefined, 'every flagged Slovenian key has been repaired or reviewed');
  assert.equal(result.pendingByLocale.lv, undefined, 'every audited Latvian key was repaired');
  assert.ok(result.rows.filter(row => row.locale === 'lv').every(row => row.status === 'corrected'));
  assert.equal(summary.pending, result.rows.filter(row => row.status === 'pending').length, 'remaining work is derived from values rather than a completion claim');
  console.log(`translationAuditProgress: ${summary.auditedKeys} audit rows classified with exact values; uncertain work retained; Latvian queue complete`);
})().catch(error => { console.error(error); process.exitCode = 1; });
