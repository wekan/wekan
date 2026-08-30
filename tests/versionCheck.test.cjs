'use strict';

// Unit and source-wiring coverage for Admin Panel / Settings / Version's
// on-demand GitHub release check. Run: node tests/versionCheck.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

(async () => {
  const root = path.resolve(__dirname, '..');
  const { compareVersions, validGitHubRelease, versionParts } =
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

  const good = {
    tag_name: 'v11.30',
    html_url: 'https://github.com/wekan/wekan/releases/tag/v11.30',
    draft: false,
    prerelease: false,
  };
  assert.deepStrictEqual(validGitHubRelease('wekan/wekan', good), {
    tag: 'v11.30',
    url: good.html_url,
  });
  assert.strictEqual(validGitHubRelease('wekan/wekan', { ...good, draft: true }), null);
  assert.strictEqual(validGitHubRelease('wekan/wekan', { ...good, prerelease: true }), null);
  assert.strictEqual(validGitHubRelease('wekan/wekan', {
    ...good,
    html_url: 'https://attacker.example/releases/tag/v11.30',
  }), null);
  assert.strictEqual(validGitHubRelease('wekan/wekan', {
    ...good,
    tag_name: 'not-a-version',
  }), null);
  assert.strictEqual(validGitHubRelease('wekan/wekan', {
    ...good,
    tag_name: 'v11.30<script>alert(1)</script>',
  }), null, 'markup cannot enter the displayed release tag');
  assert.strictEqual(validGitHubRelease('wekan/wekan', {
    ...good,
    html_url: `${good.html_url}/unexpected`,
  }), null, 'the release URL must exactly match the sanitized tag');

  assert.match(server, /currentUser\?\.isAdmin/,
    'the release method is restricted to Global Admins');
  assert.match(server, /\['wekan\/wekan', 'wekan\/FerretDB'\]/,
    'only the two fixed WeKan repositories are queried');
  assert.match(server, /api\.github\.com\/repos\/\$\{repository\}\/releases\/latest/);
  assert.match(server, /AbortSignal\.timeout\(10000\)/,
    'a failed upstream cannot leave the Admin pane waiting forever');
  assert.doesNotMatch(client, /fetch\(/,
    'the browser does not call GitHub directly and expose CORS details');

  const buttonAt = jade.indexOf('button.js-check-newest-versions');
  const currentVersionAt = jade.indexOf("th WeKan ® {{_ 'info'}}");
  assert.ok(buttonAt >= 0 && buttonAt < currentVersionAt,
    'the check button is at the top, above the current WeKan version');
  assert.match(jade, /target="_blank" rel="noopener noreferrer"/,
    'release links opened in a new tab cannot control the WeKan tab');
  assert.match(jade, /\) \{\{tag\}\}/,
    'the newest version is rendered as escaped text');
  assert.doesNotMatch(jade, /\{\{\{\s*tag\s*\}\}\}/,
    'the newest version is never rendered as raw HTML');
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
