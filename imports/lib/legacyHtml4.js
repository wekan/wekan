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

const BOARD_THEME_COLORS = {
  belize: '#2980b9', nephritis: '#27ae60', pomegranate: '#c0392b',
  pumpkin: '#e67e22', wisteria: '#8e44ad', moderatepink: '#cd5a91',
  strongcyan: '#00aecc', limegreen: '#4bbf6b', midnight: '#2c3e50',
  dark: '#333333', relax: '#568ba2', corteza: '#568ba2', natural: '#6b8e23',
  modern: '#2980b9', moderndark: '#263238', exodark: '#1f2933',
  cleandark: '#263238', cleanlight: '#e8f3fa', clearblue: '#2980b9',
  cleargreen: '#27ae60', clearorange: '#e67e22', clearpink: '#cd5a91',
  clearpurple: '#8e44ad', clearred: '#c0392b', appleglasspastel: '#568ba2',
};

const ITEM_COLORS = {
  white: '#ffffff', green: '#3cb500', yellow: '#fad900', orange: '#ff9f19',
  red: '#eb4646', purple: '#a632db', blue: '#0079bf', sky: '#00c2e0',
  lime: '#51e898', pink: '#ff78cb', black: '#4d4d4d', silver: '#c0c0c0',
  peachpuff: '#ffdab9', crimson: '#dc143c', plum: '#dda0dd',
  darkgreen: '#006400', slateblue: '#6a5acd', magenta: '#ff00ff',
  gold: '#ffd700', navy: '#000080', gray: '#808080', saddlebrown: '#8b4513',
  paleturquoise: '#afeeee', mistyrose: '#ffe4e1', indigo: '#4b0082',
};

function safeColor(value, boardTheme = false) {
  if (/^#[0-9a-fA-F]{6}$/.test(String(value || ''))) return String(value).toLowerCase();
  return (boardTheme ? BOARD_THEME_COLORS : ITEM_COLORS)[String(value || '')] || '';
}

function textColor(background) {
  const color = safeColor(background) || background;
  if (!/^#[0-9a-f]{6}$/i.test(color)) return '#000000';
  const red = parseInt(color.slice(1, 3), 16);
  const green = parseInt(color.slice(3, 5), 16);
  const blue = parseInt(color.slice(5, 7), 16);
  const linear = channel => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  };
  const luminance = 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
  return luminance > 0.179 ? '#000000' : '#ffffff';
}

function postForm(action, label, fields, extraFields = {}) {
  const hidden = Object.entries(extraFields).map(([name, value]) =>
    `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`).join('');
  return `<form class="legacy-action" method="post" action="${escapeHtml(action)}">${sessionHiddenFields(fields)}${hidden}<input type="submit" value="${escapeHtml(label)}"></form>`;
}

function tableRow(cells, options = {}) {
  const background = safeColor(options.color, options.boardTheme);
  const style = background
    ? ` style="background-color:${background};color:${textColor(background)}"` : '';
  return `<tr${style}>${cells.map((cell, index) => index === 0 && options.rowHeader !== false
    ? `<th scope="row">${cell}</th>` : `<td>${cell}</td>`).join('')}</tr>`;
}

function authRows(path, options) {
  const t = (key, fallback) => translated(options, key, fallback);
  if (options.authenticated) {
    const identity = options.username ? ` ${escapeHtml(options.username)}` : '';
    return [tableRow([
      `${escapeHtml(t('username', 'Username'))}:${identity}`,
      postForm('/allboards', t('all-boards', 'All Boards'), options.actionFields?.('/allboards') || options.sessionFields),
    ])];
  }
  if (path === '/' || path === '/sign-in') {
    return [
      `<tr><td colspan="2"><form method="post" action="/users/login"><fieldset><legend>${escapeHtml(t('loginPopup-title', 'Log In'))}</legend><input type="hidden" name="legacyHtml4" value="1">`,
      `<p><label for="username">${escapeHtml(`${t('username', 'Username')} / ${t('email', 'Email')}`)}</label><br><input id="username" name="username" type="text" size="30"></p>`,
      `<p><label for="password">${escapeHtml(t('password', 'Password'))}</label><br><input id="password" name="password" type="password" size="30"></p>`,
      `<p><input type="submit" value="${escapeHtml(t('loginPopup-title', 'Log In'))}"></p></fieldset></form></td></tr>`,
      options.loginFailed ? tableRow([`<span role="alert">${escapeHtml(t('invalid-credentials', 'Incorrect username, email address or password.'))}</span>`, '']) : '',
      tableRow([
        options.disableForgotPassword ? '' : `<a href="/forgot-password">${escapeHtml(t('forgot-password', 'Forgot password'))}</a>`,
        options.disableRegistration ? '' : `<a href="/sign-up">${escapeHtml(t('signupPopup-title', 'Create an Account'))}</a>`,
      ]),
    ];
  }
  if (path === '/sign-up') {
    return [
      `<tr><td colspan="2"><form method="post" action="/users/register"><fieldset><legend>${escapeHtml(t('signupPopup-title', 'Create an Account'))}</legend><input type="hidden" name="legacyHtml4" value="1">`,
      `<p><label for="username">${escapeHtml(t('username', 'Username'))}</label><br><input id="username" name="username" type="text" size="30"></p>`,
      `<p><label for="email">${escapeHtml(t('email', 'Email'))}</label><br><input id="email" name="email" type="text" size="30"></p>`,
      `<p><label for="password">${escapeHtml(t('password', 'Password'))}</label><br><input id="password" name="password" type="password" size="30"></p>`,
      `<p><input type="submit" value="${escapeHtml(t('register', 'Register'))}"></p></fieldset></form></td></tr>`,
      options.registrationFailed ? tableRow([`<span role="alert">${escapeHtml(t('account-creation-failed', 'Account creation failed.'))}</span>`, '']) : '',
      tableRow([`<a href="/sign-in">${escapeHtml(t('already-account', 'Already have an account? Sign in'))}</a>`, '']),
    ];
  }
  return [tableRow([
    `${escapeHtml(pageHeading(path, options))}: ${escapeHtml(path)}`,
    `<a href="/sign-in">${escapeHtml(t('loginPopup-title', 'Log In'))}</a>`,
  ])];
}

function contentRows(path, options) {
  if (!options.page) return authRows(path, options);
  const rows = [];
  if (options.authenticated) {
    rows.push(tableRow([
      `${escapeHtml(translated(options, 'username', 'Username'))}: ${escapeHtml(options.username || '')}`,
      ['/allboards', '/my-cards', '/global-search'].map(target => postForm(
        target, pageHeading(target, options), options.actionFields(target),
      )).join(' '),
    ]));
  } else {
    rows.push(tableRow([escapeHtml(options.productName), '<a href="/sign-in">Log In</a>']));
  }
  for (const row of options.page.rows || []) {
    const renderCell = cell => {
      if (Array.isArray(cell)) return cell.map(renderCell).join(' ');
      if (cell && typeof cell === 'object' && cell.action) {
        return postForm(cell.action, cell.label, options.actionFields(cell.action), cell.fields);
      }
      if (cell && typeof cell === 'object' && cell.href) {
        return `<a href="${escapeHtml(cell.href)}">${escapeHtml(cell.label)}</a>`;
      }
      return escapeHtml(cell);
    };
    const cells = (row.cells || []).map(renderCell);
    rows.push(tableRow(cells, { color: row.color, boardTheme: row.boardTheme }));
  }
  if (!(options.page.rows || []).length) {
    rows.push(tableRow([escapeHtml(options.page.empty || translated(options, 'no-results', 'No results')), '']));
  }
  return rows;
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
    `<p class="skip-link"><a href="#content">${escapeHtml(translated(options, 'skip-to-content', 'Skip to main content'))}</a></p>`,
    '<div id="legacy-html4-page">',
    `<p><a href="/">${escapeHtml(options.productName)}</a></p>`,
    logo,
    belowLogo,
    `<h1 id="content">${escapeHtml(options.page?.heading || heading)}</h1>`,
    `<table class="legacy-content" summary="${escapeHtml(options.page?.heading || heading)}">`,
    `<caption>${escapeHtml(options.page?.caption || options.page?.heading || heading)}</caption>`,
    `<thead><tr>${(options.page?.columns || ['', '']).map(column => `<th scope="col">${escapeHtml(column)}</th>`).join('')}</tr></thead>`,
    `<tbody>${contentRows(path, options).join('\n')}</tbody>`,
    '</table>',
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
  safeColor,
};
