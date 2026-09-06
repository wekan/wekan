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
  assert.match(login, /<form method="post" action="\/users\/login">/);
  assert.match(login, /name="username"/);
  assert.match(login, /name="password"/);
  assert.match(login, /type="submit" value="Log In"/);
  assert.match(login, /src="\/legacy-html4\/login-logo\.gif" alt="WeKan"/);
  assert.match(login, /href="\/forgot-password">Forgot password/);
  assert.match(login, /href="\/sign-up">Create an Account/);

  const hostile = renderLegacyHtml4Page('/board/%3Cscript%3E');
  assert.doesNotMatch(hostile, /<strong><script>/);
});

test('sign-in POST uses the protected login route without cookies or URL tokens', () => {
  const route = fs.readFileSync(path.join(__dirname, '..', 'server',
    'apiAuthRoutes.js'), 'utf8');
  const sessions = fs.readFileSync(path.join(__dirname, '..', 'server', 'lib',
    'legacyHtml4Session.js'), 'utf8');
  assert.match(route, /legacyHtml4 = req\.body\?\.legacyHtml4 === '1'/);
  assert.match(route, /createLegacyHtml4Session\(result\.userId, req\)/);
  assert.match(route, /renderLegacyHtml4Page\('\/allboards'/);
  assert.match(route, /Location', '\/sign-in\?login=failed'/);
  assert.doesNotMatch(route, /setLoginTokenCookies/);
  assert.match(sessions, /crypto\.timingSafeEqual/);
  assert.match(sessions, /findOneAndUpdate/);
  assert.match(sessions, /\$inc: \{ counter: 1 \}/);
  assert.match(sessions, /expireAfterSeconds: 0/);
});

test('an authenticated HTML4 request does not draw the login form again', () => {
  const html = renderLegacyHtml4Page('/allboards', {
    authenticated: true,
    username: 'alice',
  });
  assert.match(html, /Logged in alice/);
  assert.doesNotMatch(html, /<form method="post" action="\/users\/login">/);

  const middleware = fs.readFileSync(path.join(__dirname, '..', 'server',
    'legacyHtml4.js'), 'utf8');
  assert.match(middleware, /consumeLegacyHtml4Session\(req, path\)/);
  assert.match(middleware, /authenticated: Boolean\(session\)/);
  assert.match(middleware, /tripCanary\('authz\.legacy-html4-session'/);
});

test('sign-in uses the HTML5 view branding, settings and translations', () => {
  const values = {
    'loginPopup-title': 'Kirjaudu sisään', username: 'Käyttäjänimi',
    email: 'Sähköposti', password: 'Salasana',
    'forgot-password': 'Unohtunut salasana',
    'signupPopup-title': 'Luo käyttäjätili',
    acceptance_of_our_legalNotice: 'Jatkamalla hyväksyt', legalNotice: 'käyttöehdot',
  };
  const html = renderLegacyHtml4Page('/sign-in', {
    productName: 'Example Kanban', language: 'fi',
    customLoginLogoLinkUrl: 'https://example.invalid/',
    textBelowCustomLoginLogo: 'Welcome to this service',
    legalNotice: 'https://example.invalid/legal',
    translate: key => values[key] || key,
  });
  assert.match(html, /<html lang="fi">/);
  assert.match(html, /<title>Example Kanban - Kirjaudu sisään<\/title>/);
  assert.match(html, /alt="Example Kanban"/);
  assert.match(html, />Käyttäjänimi \/ Sähköposti<\/label>/);
  assert.match(html, />Salasana<\/label>/);
  assert.match(html, /Welcome to this service/);
  assert.match(html, /Jatkamalla hyväksyt/);
  assert.match(html, />käyttöehdot<\/a>/);
});

test('sign-in refuses script URLs in shared branding settings', () => {
  const html = renderLegacyHtml4Page('/sign-in', {
    customLoginLogoLinkUrl: 'javascript:alert(1)',
    legalNotice: 'data:text/html,unsafe',
  });
  assert.doesNotMatch(html, /javascript:|data:text\/html/);
  assert.match(html, /src="\/legacy-html4\/login-logo\.gif"/);
});
