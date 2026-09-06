const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const {
  capabilityScript,
  isDocumentRequest,
  legacyHtml4AttachmentGifUrl,
  renderLegacyHtml4Page,
} = require('../imports/lib/legacyHtml4');

function request(url, headers = {}) {
  return { method: 'GET', url, headers };
}

test('Legacy HTML4 uses only its descriptive feature name', () => {
  const repository = path.join(__dirname, '..');
  const formerName = ['O', 'mi'].join('');
  const forbidden = new RegExp(`\\b${formerName}\\b|legacy${formerName}|legacy-${formerName}`, 'i');
  const files = execFileSync('git', ['ls-files'], { cwd: repository, encoding: 'utf8' })
    .trim().split('\n')
    .filter(file => file && !file.startsWith('imports/i18n/data/'))
    .filter(file => /(?:^|\/)(?:[^/]+\.(?:js|cjs|mjs|json|md|jade|css|styl|sh|bat|yml|yaml|txt)|CHANGELOG)$/.test(file));
  for (const file of files) {
    const absolute = path.join(repository, file);
    if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) continue;
    assert.doesNotMatch(fs.readFileSync(absolute, 'utf8'), forbidden, file);
  }
});

test('all WeKan page URLs receive the HTML4 baseline', () => {
  for (const url of ['/', '/sign-in', '/sign-up', '/allboards/table',
    '/b/KfGA54csY72ir5H6p/taulu-1', '/b/x/board/card/y',
    '/admin/problems/security-report', '/my-cards']) {
    assert.equal(isDocumentRequest(request(url, { accept: 'text/html' })), true, url);
    const html = renderLegacyHtml4Page(url);
    assert.match(html, /^<!DOCTYPE HTML PUBLIC "-\/\/W3C\/\/DTD HTML 4\.01\/\/EN"/);
    assert.match(html, /Legacy HTML4 view because JavaScript drag and drop is not available/);
  }
});

test('Legacy HTML4 image URLs always select the server-side GIF representation', () => {
  assert.equal(legacyHtml4AttachmentGifUrl('abc 123'), '/legacy-html4/attachments/abc%20123.gif');
});

test('API, DDP, files and static resources are never intercepted', () => {
  for (const url of ['/api/boards', '/users/login', '/sockjs/info', '/websocket',
    '/cdn/storage/attachments/x', '/attachments/x', '/app.js', '/favicon.ico']) {
    assert.equal(isDocumentRequest(request(url, { accept: '*/*' })), false, url);
  }
});

test('the successful capability request reaches Meteor at the same URL', () => {
  assert.equal(isDocumentRequest(request('/b/x/board', {
    accept: 'text/html', 'x-wekan-progressive-client': '1',
  })), false);
  assert.match(capabilityScript, /window\.location\.href/);
  assert.match(capabilityScript, /X-Wekan-Progressive-Client/);
  assert.doesNotMatch(capabilityScript, /userAgent|navigator\.userAgent/i);
});

test('sign-in baseline is usable and dynamic paths are escaped', () => {
  const login = renderLegacyHtml4Page('/sign-in');
  assert.match(login, /<form method="post" action="\/sign-in">/);
  assert.match(login, /name="username"/);
  assert.match(login, /name="password"/);
  assert.match(login, /type="submit" value="Sign in"/);

  const hostile = renderLegacyHtml4Page('/board/%3Cscript%3E');
  assert.doesNotMatch(hostile, /<strong><script>/);
});
