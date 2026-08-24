const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const locales = {};
for (const language of ['sl', 'sl_SI', 'vo']) {
  const result = spawnSync(process.execPath, [fillScript, '--list', language], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '{}\n');
  locales[language] = JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${language}.i18n.json`), 'utf8'));
}
for (const language of ['sl', 'sl_SI']) {
  assert.equal(locales[language]['select-none'], 'Ne izberi ničesar');
  assert.equal(locales[language]['office-logins'], 'Prijave');
}
assert.match(locales.vo['repair-broken-cards-done-unfixable'], /__fixed__.*__unfixable__/);
assert.match(locales.vo['globalSearch-instructions-operator-number'], /__operator_number__:<number>.*<number>/);
assert.doesNotMatch(locales.vo['problems-in-progress-help'], /Must be logged in|Loading, please wait/);
for (const locale of Object.values(locales)) {
  assert.match(locale['office-report-desc'], /IPv4.*IPv6/);
  assert.match(locale['api-no-calls'], /REST API.*WITH_API=true/);
}
