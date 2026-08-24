'use strict';
const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const node = process.execPath;
const fill = path.join(ROOT, 'releases/translations/fill-translations.mjs');
const languages = ['es-AR', 'es-CL', 'es-CO', 'es-LA', 'es-MX', 'es-PE',
  'es-PY', 'es', 'es_CO'];
for (const language of languages) {
  assert.deepStrictEqual(JSON.parse(childProcess.execFileSync(node,
    [fill, '--list', language], { cwd: ROOT, encoding: 'utf8' })), {});
  const translated = JSON.parse(fs.readFileSync(path.join(ROOT,
    'imports/i18n/data', `${language}.i18n.json`), 'utf8'));
  assert.strictEqual(translated.officeReportTitle, 'Oficinas');
  assert.match(translated['api-report-desc'], /puntos finales|frecuencia/);
  assert.match(translated['api-no-calls'], /WITH_API=true/);
  assert.strictEqual(translated.error, 'Mensaje de error');
}
console.log('upcomingSpanishTranslationFill: 45 tests passed');
