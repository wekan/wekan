const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const locales = {};
for (const language of ['ca_ES', 'tlh']) {
  const result = spawnSync(process.execPath, [fillScript, '--list', language], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '{}\n');
  locales[language] = JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${language}.i18n.json`), 'utf8'));
}
assert.equal(locales.ca_ES['select-none'], 'No en seleccionis cap');
assert.equal(locales.ca_ES.errors, "Missatges d'error");
assert.equal(locales.tlh['select-none'], 'pagh yIwIv');
assert.match(locales.tlh['repair-broken-cards-done-unfixable'], /__fixed__.*__unfixable__/);
assert.doesNotMatch(locales.tlh['problems-in-progress-help'], /Must be logged in|Loading, please wait/);
const klingonNewValues = [
  'map-to-existing-user-desc', 'map-to-existing-user-none', 'office-report-desc',
  'api-report-desc', 'recovery-report-desc', 'problems-in-progress-help',
  'repair-broken-cards-done-unfixable',
].map((key) => locales.tlh[key]).join('\n');
assert.doesNotMatch(klingonNewValues, /[\u0400-\u052f\u0600-\u06ff\u2e80-\u9fff]/);
for (const locale of Object.values(locales)) {
  assert.match(locale['office-report-desc'], /IPv4.*IPv6/);
  assert.match(locale['api-no-calls'], /REST API.*WITH_API=true/);
}
