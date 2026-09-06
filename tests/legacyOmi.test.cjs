const test = require('node:test');
const assert = require('node:assert/strict');
const {
  capabilityScript,
  isDocumentRequest,
  legacyOmiAttachmentGifUrl,
  renderLegacyOmiPage,
} = require('../imports/lib/legacyOmi');

function request(url, headers = {}) {
  return { method: 'GET', url, headers };
}

test('all WeKan page URLs receive the HTML4 baseline', () => {
  for (const url of ['/', '/sign-in', '/sign-up', '/allboards/table',
    '/b/KfGA54csY72ir5H6p/taulu-1', '/b/x/board/card/y',
    '/admin/problems/security-report', '/my-cards']) {
    assert.equal(isDocumentRequest(request(url, { accept: 'text/html' })), true, url);
    const html = renderLegacyOmiPage(url);
    assert.match(html, /^<!DOCTYPE HTML PUBLIC "-\/\/W3C\/\/DTD HTML 4\.01\/\/EN"/);
    assert.match(html, /Legacy Omi HTML4 view/);
  }
});

test('Omi image URLs always select the server-side GIF representation', () => {
  assert.equal(legacyOmiAttachmentGifUrl('abc 123'), '/legacy-omi/attachments/abc%20123.gif');
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
  const login = renderLegacyOmiPage('/sign-in');
  assert.match(login, /<form method="post" action="\/sign-in">/);
  assert.match(login, /name="username"/);
  assert.match(login, /name="password"/);
  assert.match(login, /type="submit" value="Sign in"/);

  const hostile = renderLegacyOmiPage('/board/%3Cscript%3E');
  assert.doesNotMatch(hostile, /<strong><script>/);
});
