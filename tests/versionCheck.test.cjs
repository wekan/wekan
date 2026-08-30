'use strict';

// Unit and source-wiring coverage for Admin Panel / Settings / Version's
// on-demand wekan.fi manifest check. Run: node tests/versionCheck.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

(async () => {
  const root = path.resolve(__dirname, '..');
  const { compareVersions, parseVersionManifest, versionParts } =
    await import('../models/lib/versionCheck.js');
  const server = fs.readFileSync(path.join(root, 'server/statistics.js'), 'utf8');
  const client = fs.readFileSync(
    path.join(root, 'client/components/settings/informationBody.js'), 'utf8');
  const jade = fs.readFileSync(
    path.join(root, 'client/components/settings/informationBody.jade'), 'utf8');
  const en = JSON.parse(fs.readFileSync(
    path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));

  assert.deepStrictEqual(versionParts('v11.30'), [11, 30, 0]);
  assert.deepStrictEqual(versionParts('1.64.0'), [1, 64, 0]);
  assert.deepStrictEqual(versionParts('v1.64.0-wekan.2'), [1, 64, 0]);
  assert.strictEqual(versionParts('v11.30 unexpected'), null);
  assert.strictEqual(compareVersions('11.9', 'v11.30'), -1);
  assert.strictEqual(compareVersions('v11.30.0', '11.30'), 0);
  assert.strictEqual(compareVersions('12.0', 'v11.30'), 1);
  assert.strictEqual(compareVersions('—', 'v11.30'), null);

  const good = [
    'WeKan 11.30',
    'FerretDB 1.64.0',
    'Meteor 3.5.2-beta.0',
    'Node 24.20.0',
    'NPM 11.12.1',
  ].join('\n');
  assert.deepStrictEqual(parseVersionManifest(`${good}\r\n`), {
    text: good,
    versions: {
      wekan: '11.30', ferretdb: '1.64.0', meteor: '3.5.2-beta.0',
      node: '24.20.0', npm: '11.12.1',
    },
  });
  assert.strictEqual(parseVersionManifest(good.replace('FerretDB', 'MongoDB')), null);
  assert.strictEqual(parseVersionManifest(`${good}\nUnexpected 1.0`), null);
  assert.strictEqual(parseVersionManifest(good.replace('11.30', '<b>11.30</b>')), null,
    'markup cannot enter the displayed manifest');
  assert.strictEqual(parseVersionManifest(good.replace('24.20.0', 'not-a-version')), null);
  assert.strictEqual(parseVersionManifest('x'.repeat(1025)), null,
    'an unexpectedly large response is rejected');

  assert.match(server, /currentUser\?\.isAdmin/,
    'the release method is restricted to Global Admins');
  assert.match(server, /fetch\('https:\/\/wekan\.fi\/version\.txt'/,
    'the server reads the one published version manifest');
  assert.doesNotMatch(server, /api\.github\.com/,
    'the Admin request no longer makes separate GitHub API calls');
  assert.match(server, /AbortSignal\.timeout\(10000\)/,
    'a failed upstream cannot leave the Admin pane waiting forever');
  assert.doesNotMatch(client, /fetch\(/,
    'the browser does not call wekan.fi directly or expose CORS details');

  const buttonAt = jade.indexOf('button.js-check-newest-versions');
  const currentVersionAt = jade.indexOf("th WeKan ® {{_ 'info'}}");
  assert.ok(buttonAt >= 0 && buttonAt < currentVersionAt,
    'the check button is at the top, above the current WeKan version');
  assert.match(jade, /pre\.version-check-results \{\{versionManifestText\}\}/,
    'the five-line manifest is shown as escaped plain text below the button');
  assert.doesNotMatch(jade, /\{\{\{\s*versionManifestText\s*\}\}\}/,
    'the manifest is never rendered as raw HTML');
  assert.match(client, /Meteor\.call\('checkNewestVersions'/);
  assert.match(client, /TAPi18n\.__\('version-check-failed'\)/,
    'offline, invalid and non-version replies produce a translated fixed message');
  assert.doesNotMatch(client, /versionCheckError\.set\(error/,
    'untrusted network error or response text is never rendered');

  assert.strictEqual(en['check-version'], 'Check Version');
  assert.strictEqual(
    en['version-check-failed'],
    'It was not possible to check the version number.',
  );
  const localeDir = path.join(root, 'imports/i18n/data');
  for (const file of fs.readdirSync(localeDir).filter(name => name.endsWith('.i18n.json'))) {
    const locale = JSON.parse(fs.readFileSync(path.join(localeDir, file), 'utf8'));
    const keys = Object.keys(locale);
    assert.strictEqual(keys.indexOf('check-version'), keys.indexOf('info') + 1,
      `${file}: check-version follows info in English key order`);
    assert.strictEqual(keys.indexOf('version-check-failed'), keys.indexOf('info') + 2,
      `${file}: version-check-failed follows check-version`);
  }
  const translatedSamples = {
    de: ['Version prüfen', 'Die Versionsnummer konnte nicht geprüft werden.'],
    es: ['Comprobar versión', 'No fue posible comprobar el número de versión.'],
    fi: ['Tarkista versio', 'Versionumeroa ei voitu tarkistaa.'],
    fr: ['Vérifier la version', 'Impossible de vérifier le numéro de version.'],
    zh: ['检查版本', '无法检查版本号。'],
  };
  for (const [code, expected] of Object.entries(translatedSamples)) {
    const locale = JSON.parse(fs.readFileSync(
      path.join(localeDir, `${code}.i18n.json`), 'utf8'));
    assert.deepStrictEqual(
      [locale['check-version'], locale['version-check-failed']],
      expected,
      `${code}: the new UI and failure strings are translated`,
    );
  }

  console.log('versionCheck: all checks passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
