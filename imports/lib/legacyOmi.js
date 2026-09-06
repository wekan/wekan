const MODERN_REQUEST_HEADER = 'x-wekan-progressive-client';
const CAPABILITY_SCRIPT_PATH = '/legacy-omi-capabilities.js';

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizedPath(requestUrl) {
  try {
    return new URL(requestUrl || '/', 'http://wekan.invalid').pathname || '/';
  } catch (error) {
    return '/';
  }
}

function isDocumentRequest(req) {
  if (!req || req.method !== 'GET') return false;
  if (req.headers && req.headers[MODERN_REQUEST_HEADER] === '1') return false;

  const path = normalizedPath(req.url);
  if (path === CAPABILITY_SCRIPT_PATH) return false;
  if (/^\/(?:api|users|sockjs|websocket|cdn|cfs|attachments|avatars)(?:\/|$)/.test(path)) {
    return false;
  }
  if (/^\/(?:_meteor|__cordova|favicon\.ico|robots\.txt)(?:\/|$)/.test(path)) return false;
  if (/\.[a-z0-9]{1,12}$/i.test(path)) return false;

  const accept = (req.headers && req.headers.accept) || '';
  return !accept || accept.includes('text/html') || accept.includes('*/*');
}

function pageHeading(path) {
  if (path === '/' || path === '/sign-in') return 'Sign in to WeKan';
  if (path === '/sign-up') return 'Create a WeKan account';
  return 'WeKan';
}

function legacyOmiAttachmentGifUrl(attachmentId) {
  return `/legacy-omi/attachments/${encodeURIComponent(String(attachmentId || ''))}.gif`;
}

function authContent(path) {
  if (path === '/' || path === '/sign-in') {
    return [
      '<form method="post" action="/sign-in">',
      '<input type="hidden" name="legacyOmi" value="1">',
      '<p><label for="username">Username or email</label><br>',
      '<input id="username" name="username" type="text" size="30"></p>',
      '<p><label for="password">Password</label><br>',
      '<input id="password" name="password" type="password" size="30"></p>',
      '<p><input type="submit" value="Sign in"></p>',
      '</form>',
      '<p><a href="/sign-up">Create an account</a></p>',
    ].join('\n');
  }
  if (path === '/sign-up') {
    return [
      '<form method="post" action="/sign-up">',
      '<input type="hidden" name="legacyOmi" value="1">',
      '<p><label for="username">Username</label><br>',
      '<input id="username" name="username" type="text" size="30"></p>',
      '<p><label for="email">Email</label><br>',
      '<input id="email" name="email" type="text" size="30"></p>',
      '<p><label for="password">Password</label><br>',
      '<input id="password" name="password" type="password" size="30"></p>',
      '<p><input type="submit" value="Create account"></p>',
      '</form>',
      '<p><a href="/sign-in">Sign in</a></p>',
    ].join('\n');
  }
  return [
    `<p>This is the HTML4 view of <strong>${escapeHtml(path)}</strong>.</p>`,
    '<p>Sign in to view private boards and use server-side controls.</p>',
    '<form method="get" action="/sign-in"><p><input type="submit" value="Sign in"></p></form>',
  ].join('\n');
}

function renderLegacyOmiPage(requestUrl) {
  const path = normalizedPath(requestUrl);
  const heading = pageHeading(path);
  return [
    '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">',
    '<html lang="en"><head>',
    '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">',
    `<title>${escapeHtml(heading)}</title>`,
    '<link rel="stylesheet" type="text/css" href="/legacy-omi.css">',
    `<script type="text/javascript" src="${CAPABILITY_SCRIPT_PATH}"></script>`,
    '</head><body>',
    '<div id="legacy-omi-page">',
    '<p><a href="/">WeKan</a></p>',
    `<h1>${escapeHtml(heading)}</h1>`,
    authContent(path),
    '<hr>',
    '<p>Legacy Omi HTML4 view. Navigation and changes work with server-side forms; JavaScript and cookies are not required.</p>',
    '</div>',
    '</body></html>',
  ].join('\n');
}

const capabilityScript = `(function () {
  function capable() {
    if (!window.Promise || !window.fetch || !document.addEventListener ||
        !window.JSON || !window.Event) return false;
    var item = document.createElement('div');
    var fired = false;
    if (!('draggable' in item)) return false;
    item.draggable = true;
    item.addEventListener('dragstart', function () { fired = true; }, false);
    try { item.dispatchEvent(new Event('dragstart')); } catch (ignore) { return false; }
    var inputPath = fired && (typeof window.DragEvent === 'function' ||
      typeof window.PointerEvent === 'function' || 'ontouchstart' in window);
    return Boolean(inputPath);
  }
  function upgrade() {
    if (!capable()) return;
    window.fetch(window.location.href, {
      method: 'GET', credentials: 'same-origin', cache: 'no-store',
      headers: { 'X-Wekan-Progressive-Client': '1', 'Accept': 'text/html' }
    }).then(function (response) {
      if (!response.ok) throw new Error('modern WeKan unavailable');
      return response.text();
    }).then(function (html) {
      document.open('text/html', 'replace'); document.write(html); document.close();
    }).catch(function () { /* Keep the already functional HTML4 page. */ });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', upgrade, false);
  else upgrade();
}());\n`;

module.exports = {
  CAPABILITY_SCRIPT_PATH,
  MODERN_REQUEST_HEADER,
  capabilityScript,
  escapeHtml,
  isDocumentRequest,
  legacyOmiAttachmentGifUrl,
  normalizedPath,
  renderLegacyOmiPage,
};
