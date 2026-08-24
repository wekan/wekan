const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const languages = ['az-AZ', 'az-LA', 'az', 'hr', 'pl-PL', 'pl', 'sk'];
const locales = {};
for (const language of languages) {
  const result = spawnSync(process.execPath, [fillScript, '--list', language], {
    cwd: root, encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '{}\n');
  locales[language] = JSON.parse(fs.readFileSync(
    path.join(root, `imports/i18n/data/${language}.i18n.json`), 'utf8',
  ));
}
for (const language of ['az-AZ', 'az-LA', 'az']) {
  assert.equal(locales[language]['select-none'], 'Heç birini seçmə');
}
assert.equal(locales.hr['select-none'], 'Ne odaberi ništa');
for (const language of ['pl-PL', 'pl']) {
  assert.equal(locales[language]['office-logins'], 'Logowania');
}
assert.equal(locales.sk.checklist, 'Kontrolný zoznam');
assert.match(locales.sk.DDP_transport, /DDP.*DDP_TRANSPORT/);
for (const locale of Object.values(locales)) {
  assert.match(locale['office-report-desc'], /IPv4.*IPv6/);
  assert.match(locale['api-no-calls'], /REST API.*WITH_API=true/);
}
