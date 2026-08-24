const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const languages = ['et-EE', 'ro-RO', 'ro', 'wa-RR'];
const locales = {};
for (const language of languages) {
  const result = spawnSync(process.execPath, [fillScript, '--list', language], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '{}\n');
  locales[language] = JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${language}.i18n.json`), 'utf8'));
}
assert.equal(locales['et-EE']['select-none'], 'Ära vali midagi');
for (const language of ['ro-RO', 'ro']) assert.equal(locales[language]['office-logins'], 'Autentificări');
assert.equal(locales['wa-RR'].ticket, 'Tiket');
assert.match(locales['wa-RR']['globalSearch-instructions-operator-number'], /__operator_number__:<number>.*<number>/);
assert.match(locales['et-EE'].DDP_transport, /DDP.*DDP_TRANSPORT/);
for (const locale of Object.values(locales)) {
  assert.match(locale['office-report-desc'], /IPv4.*IPv6/);
  assert.match(locale['api-no-calls'], /REST API.*WITH_API=true/);
}
