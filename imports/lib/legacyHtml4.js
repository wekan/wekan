const MODERN_REQUEST_HEADER = 'x-wekan-progressive-client';
const CAPABILITY_SCRIPT_PATH = '/legacy-html4-capabilities.js';

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeHttpUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
  } catch (error) {
    return '';
  }
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

function translated(options, key, fallback) {
  if (typeof options.translate !== 'function') return fallback;
  const value = options.translate(key);
  return value && value !== key ? value : fallback;
}

function pageHeading(path, options) {
  if (path === '/' || path === '/sign-in') {
    return translated(options, 'loginPopup-title', 'Log In');
  }
  if (path === '/sign-up') {
    return translated(options, 'signupPopup-title', 'Create an Account');
  }
  const routeTitles = [
    [/^\/allboards(?:\/|$)/, 'all-boards', 'All Boards'],
    [/^\/public(?:\/|$)/, 'public', 'Public'],
    [/^\/my-cards(?:\/|$)/, 'my-cards', 'My Cards'],
    [/^\/search(?:\/|$)/, 'search', 'Search'],
    [/^\/admin(?:\/|$)/, 'admin-panel', 'Admin Panel'],
    [/^\/b(?:\/|$)/, 'board', 'Board'],
  ];
  const match = routeTitles.find(([pattern]) => pattern.test(path));
  return match ? translated(options, match[1], match[2]) : options.productName;
}

function legacyHtml4AttachmentGifUrl(attachmentId) {
  return `/legacy-html4/attachments/${encodeURIComponent(String(attachmentId || ''))}.gif`;
}

function sessionHiddenFields(fields) {
  if (!fields) return '';
  return [
    ['legacySession', fields.legacySession],
    ['authAction', fields.authAction],
    ['authCounter', fields.authCounter],
    ['authHash', fields.authHash],
  ].map(([name, value]) => `<input type="hidden" name="${name}" value="${escapeHtml(value)}">`).join('\n');
}

function authContent(path, options) {
  const t = (key, fallback) => translated(options, key, fallback);
  if (options.authenticated) {
    const identity = options.username ? ` ${escapeHtml(options.username)}` : '';
    return [
      `<p>${escapeHtml(t('logged-in', 'Logged in'))}${identity}.</p>`,
      `<form method="post" action="/allboards">${sessionHiddenFields(options.sessionFields)}<p><input type="submit" value="${escapeHtml(t('all-boards', 'All Boards'))}"></p></form>`,
      path === '/' || path === '/sign-in' ? ''
        : `<p><strong>${escapeHtml(pageHeading(path, options))}</strong>: ${escapeHtml(path)}</p>`,
    ].join('\n');
  }
  if (path === '/' || path === '/sign-in') {
    return [
      '<form method="post" action="/users/login">',
      '<input type="hidden" name="legacyHtml4" value="1">',
      `<p><label for="username">${escapeHtml(`${t('username', 'Username')} / ${t('email', 'Email')}`)}</label><br>`,
      '<input id="username" name="username" type="text" size="30"></p>',
      `<p><label for="password">${escapeHtml(t('password', 'Password'))}</label><br>`,
      '<input id="password" name="password" type="password" size="30"></p>',
      `<p><input type="submit" value="${escapeHtml(t('loginPopup-title', 'Log In'))}"></p>`,
      '</form>',
      options.loginFailed ? `<p role="alert">${escapeHtml(t('error-incorrect-user', 'Incorrect username, email address or password.'))}</p>` : '',
      options.disableForgotPassword ? '' : `<p><a href="/forgot-password">${escapeHtml(t('forgot-password', 'Forgot password'))}</a></p>`,
      options.disableRegistration ? '' : `<p><a href="/sign-up">${escapeHtml(t('signupPopup-title', 'Create an Account'))}</a></p>`,
    ].join('\n');
  }
  if (path === '/sign-up') {
    return [
      '<form method="post" action="/sign-up">',
      '<input type="hidden" name="legacyHtml4" value="1">',
      `<p><label for="username">${escapeHtml(t('username', 'Username'))}</label><br>`,
      '<input id="username" name="username" type="text" size="30"></p>',
      `<p><label for="email">${escapeHtml(t('email', 'Email'))}</label><br>`,
      '<input id="email" name="email" type="text" size="30"></p>',
      `<p><label for="password">${escapeHtml(t('password', 'Password'))}</label><br>`,
      '<input id="password" name="password" type="password" size="30"></p>',
      `<p><input type="submit" value="${escapeHtml(t('register', 'Register'))}"></p>`,
      '</form>',
      `<p><a href="/sign-in">${escapeHtml(t('already-account', 'Already have an account? Sign in'))}</a></p>`,
    ].join('\n');
  }
  return [
    `<p><strong>${escapeHtml(pageHeading(path, options))}</strong>: ${escapeHtml(path)}</p>`,
    `<form method="get" action="/sign-in"><p><input type="submit" value="${escapeHtml(t('loginPopup-title', 'Log In'))}"></p></form>`,
  ].join('\n');
}

function renderLegacyHtml4Page(requestUrl, pageOptions = {}) {
  const options = {
    productName: pageOptions.productName || 'WeKan',
    language: pageOptions.language || 'en',
    ...pageOptions,
  };
  const path = normalizedPath(requestUrl);
  const heading = pageHeading(path, options);
  const logoLink = safeHttpUrl(options.customLoginLogoLinkUrl);
  const logo = options.hideLogo ? '' : [
    logoLink ? `<a href="${escapeHtml(logoLink)}">` : '',
    `<img src="/legacy-html4/login-logo.gif" alt="${escapeHtml(options.productName)}" width="300">`,
    logoLink ? '</a>' : '',
  ].join('');
  const belowLogo = options.textBelowCustomLoginLogo
    ? `<hr><p>${escapeHtml(options.textBelowCustomLoginLogo)}</p><hr>` : '';
  const legalUrl = safeHttpUrl(options.legalNotice);
  const legal = legalUrl
    ? `<p>${escapeHtml(translated(options, 'acceptance_of_our_legalNotice', 'By continuing, you accept our'))} <a href="${escapeHtml(legalUrl)}">${escapeHtml(translated(options, 'legalNotice', 'legal notice'))}</a>.</p>` : '';
  return [
    '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">',
    `<html lang="${escapeHtml(options.language)}"><head>`,
    '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">',
    `<title>${escapeHtml(options.productName)} - ${escapeHtml(heading)}</title>`,
    '<link rel="stylesheet" type="text/css" href="/legacy-html4.css">',
    `<script type="text/javascript" src="${CAPABILITY_SCRIPT_PATH}"></script>`,
    '</head><body>',
    '<div id="legacy-html4-page">',
    `<p><a href="/">${escapeHtml(options.productName)}</a></p>`,
    logo,
    belowLogo,
    `<h1>${escapeHtml(heading)}</h1>`,
    authContent(path, options),
    legal,
    '<hr>',
    '<p>Legacy HTML4 view because JavaScript drag and drop is not available.</p>',
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
  legacyHtml4AttachmentGifUrl,
  normalizedPath,
  renderLegacyHtml4Page,
};
