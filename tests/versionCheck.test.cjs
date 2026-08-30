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
  assert.match(client, /It was not possible to check the version number\./,
    'offline, invalid and non-version replies produce a clear fixed message');
  assert.doesNotMatch(client, /versionCheckError\.set\(error/,
    'untrusted network error or response text is never rendered');

  console.log('versionCheck: all checks passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
