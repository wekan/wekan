const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const languages = ['ast-ES', 'cy', 'cy-GB', 'uz-AR', 'uz-LA', 'uz-UZ', 'uz'];
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
assert.equal(locales['ast-ES']['select-none'], 'Nun seleicionar nengún');
for (const language of ['cy', 'cy-GB']) {
  assert.equal(locales[language]['select-none'], 'Dewis dim');
}
for (const language of ['uz-AR', 'uz-LA', 'uz-UZ', 'uz']) {
  assert.equal(locales[language]['select-none'], 'Hech birini tanlamaslik');
}
for (const locale of Object.values(locales)) {
  assert.match(locale['office-report-desc'], /IPv4.*IPv6/);
  assert.match(locale['api-no-calls'], /REST API.*WITH_API=true/);
}
