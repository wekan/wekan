const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const locales = {};

for (const language of ['br', 'lt', 'yi']) {
  const result = spawnSync(process.execPath, [fillScript, '--list', language], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '{}\n');
  locales[language] = JSON.parse(
    fs.readFileSync(
      path.join(root, `imports/i18n/data/${language}.i18n.json`),
      'utf8',
    ),
  );
}

assert.equal(locales.br['select-none'], 'Na ziuz hini ebet');
assert.equal(locales.lt['select-none'], 'Nieko nepasirinkti');
assert.equal(locales.yi['select-none'], 'גאָרנישט אויסקלייבן');
assert.match(locales.yi['office-logins'], /^[\u0590-\u05ff]+$/);

for (const locale of Object.values(locales)) {
  assert.match(locale['office-report-desc'], /IPv4.*IPv6/);
  assert.match(locale['api-no-calls'], /REST API.*WITH_API=true/);
}
assert.match(
  locales.br['globalSearch-instructions-operator-number'],
  /__operator_number__:<number>.*<number>/,
);
