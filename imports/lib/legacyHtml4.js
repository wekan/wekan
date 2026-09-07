const MODERN_REQUEST_HEADER = 'x-wekan-progressive-client';
const CAPABILITY_SCRIPT_PATH = '/legacy-html4-capabilities.js';
const { uiControlLabel } = require('./uiComponentLibrary');
const { safeDocumentTableHtml } = require('../../models/lib/documentPreviewTable');

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
  if (/^\/(?:api|users|sockjs|websocket|cdn|cfs|avatars)(?:\/|$)/.test(path)
    || /^\/attachments\//.test(path)) {
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
  if (path === '/forgot-password') {
    return translated(options, 'forgot-password', 'Forgot password');
  }
  if (/^\/(?:reset-password|enroll-account)\//.test(path)) {
    return translated(options, 'changePasswordPopup-title', 'Change Password');
  }
  if (/^\/verify-email\//.test(path)) return translated(options, 'email', 'Email');
  if (path === '/send-again') return translated(options, 'email-sent', 'Email sent');
  if (path === '/account/profile') return translated(options, 'edit-profile', 'Edit Profile');
  if (path === '/account/language') {
    return translated(options, 'changeLanguagePopup-title', 'Change Language');
  }
  if (path === '/account/password') {
    return translated(options, 'changePasswordPopup-title', 'Change Password');
  }
  if (path === '/account/settings') {
    return translated(options, 'changeSettingsPopup-title', 'Change Settings');
  }
  if (path === '/account/color') return translated(options, 'change-color', 'Change Color');
  if (path === '/account/font') return translated(options, 'change-font', 'Change Font');
  if (path === '/account/avatar') return translated(options, 'change-avatar', 'Change Avatar');
  if (path === '/account/invite') return translated(options, 'invite-people', 'Invite People');
  if (path === '/account/logout') return translated(options, 'log-out', 'Log Out');
  const routeTitles = [
    [/^\/allboards(?:\/|$)/, 'all-boards', 'All Boards'],
    [/^\/public(?:\/|$)/, 'public', 'Public'],
    [/^\/my-cards(?:\/|$)/, 'my-cards', 'My Cards'],
    [/^\/due-cards(?:\/|$)/, 'dueCards-title', 'Due Cards'],
    [/^\/global-search(?:\/|$)/, 'globalSearch-title', 'Search All Boards'],
    [/^\/broken-cards(?:\/|$)/, 'broken-cards', 'Broken Cards'],
    [/^\/bookmarks(?:\/|$)/, 'bookmarksPopup-title', 'Starred boards'],
    [/^\/import(?:\/|$)/, 'import', 'Import'],
    [/^\/support(?:\/|$)/, 'support', 'Support'],
    [/^\/accessibility(?:\/|$)/, 'accessibility', 'Accessibility'],
    [/^\/shortcuts(?:\/|$)/, 'keyboard-shortcuts', 'Keyboard shortcuts'],
    [/^\/admin\/settings(?:\/|$)/, 'settings', 'Settings'],
    [/^\/admin\/people(?:\/|$)/, 'people', 'People'],
    [/^\/admin\/attachments(?:\/|$)/, 'attachments', 'Attachments'],
    [/^\/admin\/problems(?:\/|$)/, 'problems', 'Problems'],
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
    ...(fields.authPurpose ? [['authPurpose', fields.authPurpose]] : []),
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

function postForm(action, label, fields, extraFields = {}, icon = 'caret-right', target = '') {
  const hidden = Object.entries(extraFields).map(([name, value]) =>
    `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`).join('');
  const targetAttribute = target === '_blank' ? ' target="_blank"' : '';
  return `<form class="legacy-action" method="post" action="${escapeHtml(action)}"${targetAttribute}>${sessionHiddenFields(fields)}${hidden}<input type="submit" value="${escapeHtml(uiControlLabel(icon, label))}"></form>`;
}

function tableRow(cells, options = {}) {
  const background = safeColor(options.color, options.boardTheme);
  const style = background
    ? ` style="background-color:${background};color:${textColor(background)}"` : '';
  const backgroundAttribute = background ? ` bgcolor="${background}"` : '';
  const colored = cell => background ? `<font color="${textColor(background)}">${cell}</font>` : cell;
  return `<tr${backgroundAttribute}${style}>${cells.map((cell, index) => {
    if (index === 0 && options.rowHeader !== false) return `<th scope="row">${colored(cell)}</th>`;
    const colspan = index === cells.length - 1 && Number.isSafeInteger(options.colspanLast)
      && options.colspanLast > 1 ? ` colspan="${options.colspanLast}"` : '';
    return `<td${colspan}>${colored(cell)}</td>`;
  }).join('')}</tr>`;
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
      options.loginFailed ? tableRow([`<strong>${escapeHtml(t('invalid-credentials', 'Incorrect username, email address or password.'))}</strong>`, '']) : '',
      tableRow([
        options.disableForgotPassword ? '' : `<a href="/forgot-password">${escapeHtml(t('forgot-password', 'Forgot password'))}</a>`,
        options.disableRegistration ? '' : `<a href="/sign-up">${escapeHtml(t('signupPopup-title', 'Create an Account'))}</a>`,
      ]),
    ];
  }
  if (path === '/forgot-password') {
    return [
      `<tr><td colspan="2"><form method="post" action="/users/forgot-password"><fieldset><legend>${escapeHtml(t('forgot-password', 'Forgot password'))}</legend><input type="hidden" name="legacyHtml4" value="1">`,
      `<p><label for="email">${escapeHtml(t('email', 'Email'))}</label><br><input id="email" name="email" type="text" size="30"></p>`,
      `<p><input type="submit" value="${escapeHtml(t('forgot-password', 'Forgot password'))}"></p></fieldset></form></td></tr>`,
      options.recoveryRequested ? tableRow([
        `<strong>${escapeHtml(t('email-sent', 'Email sent'))}</strong>`, '',
      ]) : '',
      tableRow([`<a href="/sign-in">${escapeHtml(t('back', 'Back'))}</a>`, '']),
    ];
  }
  const passwordTokenMatch = /^\/(reset-password|enroll-account)\/([^/]+)$/.exec(path);
  if (passwordTokenMatch) {
    const token = passwordTokenMatch[2];
    const operation = passwordTokenMatch[1] === 'enroll-account' ? 'enroll' : 'reset';
    return [
      `<tr><td colspan="2"><form method="post" action="/users/reset-password"><fieldset><legend>${escapeHtml(t('changePasswordPopup-title', 'Change Password'))}</legend><input type="hidden" name="legacyHtml4" value="1"><input type="hidden" name="tokenKind" value="${operation}"><input type="hidden" name="token" value="${escapeHtml(token)}">`,
      `<p><label for="password">${escapeHtml(t('password', 'Password'))}</label><br><input id="password" name="password" type="password" size="30"></p>`,
      `<p><label for="password-again">${escapeHtml(t('password-again', 'Password again'))}</label><br><input id="password-again" name="passwordAgain" type="password" size="30"></p>`,
      `<p><input type="submit" value="${escapeHtml(t('changePasswordPopup-title', 'Change Password'))}"></p></fieldset></form></td></tr>`,
      options.tokenFailed ? tableRow([
        `<strong>${escapeHtml(t('error', 'Error'))}</strong>`, '',
      ]) : '',
      tableRow([`<a href="/sign-in">${escapeHtml(t('back', 'Back'))}</a>`, '']),
    ];
  }
  const verifyTokenMatch = /^\/verify-email\/([^/]+)$/.exec(path);
  if (verifyTokenMatch) {
    return [
      tableRow([escapeHtml(t('email', 'Email')), postForm('/users/verify-email',
        t('email', 'Email'), null, { legacyHtml4: '1', token: verifyTokenMatch[1] })]),
      options.tokenFailed ? tableRow([
        `<strong>${escapeHtml(t('error', 'Error'))}</strong>`, '',
      ]) : '',
      tableRow([`<a href="/sign-in">${escapeHtml(t('back', 'Back'))}</a>`, '']),
    ];
  }
  if (path === '/send-again') {
    return [
      `<tr><td colspan="2"><form method="post" action="/users/send-verification"><fieldset><legend>${escapeHtml(t('email', 'Email'))}</legend><input type="hidden" name="legacyHtml4" value="1">`,
      `<p><label for="email">${escapeHtml(t('email', 'Email'))}</label><br><input id="email" name="email" type="text" size="30"></p>`,
      `<p><input type="submit" value="${escapeHtml(t('email-sent', 'Email sent'))}"></p></fieldset></form></td></tr>`,
      options.verificationRequested ? tableRow([
        `<strong>${escapeHtml(t('email-sent', 'Email sent'))}</strong>`, '',
      ]) : '',
      tableRow([`<a href="/sign-in">${escapeHtml(t('back', 'Back'))}</a>`, '']),
    ];
  }
  if (path === '/sign-up') {
    return [
      `<tr><td colspan="2"><form method="post" action="/users/register"><fieldset><legend>${escapeHtml(t('signupPopup-title', 'Create an Account'))}</legend><input type="hidden" name="legacyHtml4" value="1">`,
      `<p><label for="username">${escapeHtml(t('username', 'Username'))}</label><br><input id="username" name="username" type="text" size="30"></p>`,
      `<p><label for="email">${escapeHtml(t('email', 'Email'))}</label><br><input id="email" name="email" type="text" size="30"></p>`,
      `<p><label for="password">${escapeHtml(t('password', 'Password'))}</label><br><input id="password" name="password" type="password" size="30"></p>`,
      `<p><input type="submit" value="${escapeHtml(t('register', 'Register'))}"></p></fieldset></form></td></tr>`,
      options.registrationFailed ? tableRow([`<strong>${escapeHtml(t('account-creation-failed', 'Account creation failed.'))}</strong>`, '']) : '',
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
  const columnCount = Math.max(2, (options.page.columns || []).length);
  if (options.authenticated) {
    rows.push(tableRow([
      `${escapeHtml(translated(options, 'username', 'Username'))}: ${escapeHtml(options.username || '')}`,
      ['/allboards', '/my-cards', '/due-cards', '/global-search', '/broken-cards', '/bookmarks',
        '/account/profile', '/account/password', '/account/settings', '/account/language',
        '/account/color', '/account/font', '/account/avatar',
        '/account/invite', '/account/logout',
        '/import', '/support', '/accessibility', '/shortcuts']
        .concat(options.isAdmin
          ? ['/admin/settings/version', '/admin/people/people',
            '/admin/attachments/backup', '/admin/problems/summary'] : []).map(target => postForm(
        target, pageHeading(target, options), options.actionFields(target),
      )).join(' '),
    ], { colspanLast: columnCount - 1 }));
  } else {
    rows.push(tableRow([escapeHtml(options.productName), '<a href="/sign-in">Log In</a>'],
      { colspanLast: columnCount - 1 }));
  }
  for (const row of options.page.rows || []) {
    const renderCell = cell => {
      if (Array.isArray(cell)) return cell.map(renderCell).join(' ');
      if (cell && typeof cell === 'object' && cell.component === 'document-page') {
        const safeTable = safeDocumentTableHtml(cell.html);
        const content = safeTable || `<pre>${escapeHtml(cell.text || '')}</pre>`;
        const images = (cell.images || []).map(item =>
          `<p><img src="${escapeHtml(item.dataUrl)}" alt="${escapeHtml(cell.name || '')}" width="640"></p>`).join('');
        const actions = (cell.actions || []).map(renderCell).join(' ');
        return `<div class="legacy-document-page"><p>${escapeHtml(cell.name || '')}: ${escapeHtml(cell.number)} / ${escapeHtml(cell.pageCount)}</p>${actions}${images}${content}</div>`;
      }
      if (cell && typeof cell === 'object' && cell.component === 'search') {
        const id = 'legacy-search-query';
        const extra = Object.entries(cell.fields || {}).map(([name, value]) =>
          `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`).join('');
        return `<form method="post" action="${escapeHtml(cell.action)}">${sessionHiddenFields(options.actionFields(cell.action))}${extra}<label for="${id}">${escapeHtml(cell.label)}</label> <input id="${id}" name="q" type="text" size="30" value="${escapeHtml(cell.value || '')}"> <input type="submit" value="${escapeHtml(uiControlLabel('caret-right', cell.label))}"></form>`;
      }
      if (cell && typeof cell === 'object' && cell.component === 'text') {
        const id = `legacy-${String(cell.id || cell.name || 'text').replace(/[^a-z0-9_-]/gi, '')}`;
        const extra = Object.entries(cell.fields || {}).map(([name, value]) =>
          `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`).join('');
        const maximum = Number.isSafeInteger(cell.maxlength) && cell.maxlength > 0
          ? cell.maxlength : 1000;
        return `<form method="post" action="${escapeHtml(cell.action)}">${sessionHiddenFields(options.actionFields(cell.action))}${extra}<p><label for="${escapeHtml(id)}">${escapeHtml(cell.label)}</label><br><input id="${escapeHtml(id)}" name="${escapeHtml(cell.name)}" type="text" maxlength="${maximum}" size="40" value="${escapeHtml(cell.value || '')}"></p><p><input type="submit" value="${escapeHtml(uiControlLabel('caret-right', cell.submitLabel || cell.label))}"></p></form>`;
      }
      if (cell && typeof cell === 'object' && cell.component === 'fieldset') {
        const suffix = String(cell.id || cell.fields?.locationId || 'fields')
          .replace(/[^a-z0-9_-]/gi, '');
        const extra = Object.entries(cell.fields || {}).map(([name, value]) =>
          `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`).join('');
        const inputs = (cell.inputs || []).map((input, index) => {
          const name = String(input.name || 'field');
          const id = `legacy-${name.replace(/[^a-z0-9_-]/gi, '')}-${suffix}-${index}`;
          const description = input.description
            ? `<br><small>${escapeHtml(input.description)}</small>` : '';
          if (input.type === 'select') {
            const options = (input.options || []).map(option => {
              const value = String(option.value ?? '');
              const selected = value === String(input.value ?? '') ? ' selected' : '';
              return `<option value="${escapeHtml(value)}"${selected}>${escapeHtml(option.label)}</option>`;
            }).join('');
            return `<p><label for="${escapeHtml(id)}">${escapeHtml(input.label)}</label><br><select id="${escapeHtml(id)}" name="${escapeHtml(name)}">${options}</select>${description}</p>`;
          }
          if (input.type === 'checkbox') {
            const checked = input.checked ? ' checked' : '';
            return `<p><label><input name="${escapeHtml(name)}" type="checkbox" value="${escapeHtml(input.value ?? '1')}"${checked}> ${escapeHtml(input.label)}</label>${description}</p>`;
          }
          const maximum = Number.isSafeInteger(input.maxlength) && input.maxlength > 0
            ? input.maxlength : 1000;
          if (input.type === 'textarea') {
            const rows = Number.isSafeInteger(input.rows) && input.rows > 0 ? input.rows : 12;
            const cols = Number.isSafeInteger(input.cols) && input.cols > 0 ? input.cols : 80;
            return `<p><label for="${escapeHtml(id)}">${escapeHtml(input.label)}</label><br><textarea id="${escapeHtml(id)}" name="${escapeHtml(name)}" maxlength="${maximum}" rows="${rows}" cols="${cols}">${escapeHtml(input.value || '')}</textarea>${description}</p>`;
          }
          const type = ['email', 'password', 'text'].includes(input.type)
            ? input.type : 'text';
          const autocomplete = input.autocomplete
            ? ` autocomplete="${escapeHtml(input.autocomplete)}"` : '';
          const required = input.required ? ' required' : '';
          return `<p><label for="${escapeHtml(id)}">${escapeHtml(input.label)}</label><br><input id="${escapeHtml(id)}" name="${escapeHtml(name)}" type="${type}" maxlength="${maximum}" size="40" value="${escapeHtml(input.value || '')}"${autocomplete}${required}>${description}</p>`;
        }).join('');
        const submits = Array.isArray(cell.submitActions) && cell.submitActions.length
          ? cell.submitActions.map(submit => `<button type="submit" name="${escapeHtml(submit.name || 'legacyOperation')}" value="${escapeHtml(submit.value || '')}">${escapeHtml(uiControlLabel(submit.icon || 'caret-right', submit.label || cell.legend))}</button>`).join(' ')
          : `<input type="submit" value="${escapeHtml(uiControlLabel('caret-right', cell.submitLabel || cell.legend))}">`;
        return `<form method="post" action="${escapeHtml(cell.action)}">${sessionHiddenFields(options.actionFields(cell.action))}${extra}<fieldset><legend>${escapeHtml(cell.legend)}</legend>${inputs}<p>${submits}</p></fieldset></form>`;
      }
      if (cell && typeof cell === 'object' && cell.component === 'select') {
        const id = `legacy-${String(cell.name || 'select').replace(/[^a-z0-9_-]/gi, '')}`;
        const extra = Object.entries(cell.fields || {}).map(([name, value]) =>
          `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`).join('');
        const renderedOptions = (cell.options || []).map(option => {
          const value = String(option.value ?? '');
          const selected = value === String(cell.value ?? '') ? ' selected' : '';
          return `<option value="${escapeHtml(value)}"${selected}>${escapeHtml(option.label)}</option>`;
        }).join('');
        return `<form method="post" action="${escapeHtml(cell.action)}">${sessionHiddenFields(options.actionFields(cell.action))}${extra}<p><label for="${escapeHtml(id)}">${escapeHtml(cell.label)}</label><br><select id="${escapeHtml(id)}" name="${escapeHtml(cell.name)}">${renderedOptions}</select></p><p><input type="submit" value="${escapeHtml(uiControlLabel('caret-right', cell.submitLabel || cell.label))}"></p></form>`;
      }
      if (cell && typeof cell === 'object' && cell.component === 'card-destination') {
        const suffix = String(cell.fields?.itemId || cell.fields?.checklistId || '')
          .replace(/[^a-z0-9_-]/gi, '');
        const titleId = `legacy-${String(cell.titleName || 'cardTitle')
          .replace(/[^a-z0-9_-]/gi, '')}-${suffix}`;
        const destinationId = `legacy-${String(cell.destinationName || 'cardDestination')
          .replace(/[^a-z0-9_-]/gi, '')}-${suffix}`;
        const positionId = `legacy-${String(cell.positionName || 'position')
          .replace(/[^a-z0-9_-]/gi, '')}-${suffix}`;
        const extra = Object.entries(cell.fields || {}).map(([name, value]) =>
          `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`).join('');
        const selectOptions = (values, selectedValue) => (values || []).map(option => {
          const value = String(option.value ?? '');
          const selected = value === String(selectedValue ?? '') ? ' selected' : '';
          return `<option value="${escapeHtml(value)}"${selected}>${escapeHtml(option.label)}</option>`;
        }).join('');
        return `<form method="post" action="${escapeHtml(cell.action)}">${sessionHiddenFields(options.actionFields(cell.action))}${extra}<p><label for="${escapeHtml(titleId)}">${escapeHtml(cell.titleLabel)}</label><br><input id="${escapeHtml(titleId)}" name="${escapeHtml(cell.titleName)}" type="text" maxlength="1000" size="40" value="${escapeHtml(cell.titleValue || '')}"></p><p><label for="${escapeHtml(destinationId)}">${escapeHtml(cell.destinationLabel)}</label><br><select id="${escapeHtml(destinationId)}" name="${escapeHtml(cell.destinationName)}">${selectOptions(cell.destinations, cell.destinationValue)}</select></p><p><label for="${escapeHtml(positionId)}">${escapeHtml(cell.positionLabel)}</label><br><select id="${escapeHtml(positionId)}" name="${escapeHtml(cell.positionName)}">${selectOptions(cell.positions, cell.positionValue)}</select></p><p><input type="submit" value="${escapeHtml(uiControlLabel('caret-right', cell.submitLabel || cell.destinationLabel))}"></p></form>`;
      }
      if (cell && typeof cell === 'object' && cell.component === 'board-create') {
        const suffix = String(cell.fields?.boardType || 'board').replace(/[^a-z0-9_-]/gi, '');
        const titleId = `legacy-board-title-${suffix}`;
        const permissionId = `legacy-board-permission-${suffix}`;
        const extra = Object.entries(cell.fields || {}).map(([name, value]) =>
          `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`).join('');
        const permissions = (cell.permissions || []).map(option =>
          `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`).join('');
        return `<form method="post" action="${escapeHtml(cell.action)}">${sessionHiddenFields(options.actionFields(cell.action))}${extra}<fieldset><legend>${escapeHtml(cell.submitLabel)}</legend><p><label for="${escapeHtml(titleId)}">${escapeHtml(cell.titleLabel)}</label><br><input id="${escapeHtml(titleId)}" name="boardTitle" type="text" maxlength="1000" size="40" required></p><p><label for="${escapeHtml(permissionId)}">${escapeHtml(cell.permissionLabel)}</label><br><select id="${escapeHtml(permissionId)}" name="boardPermission">${permissions}</select></p><p><input type="submit" value="${escapeHtml(uiControlLabel('add', cell.submitLabel))}"></p></fieldset></form>`;
      }
      if (cell && typeof cell === 'object' && cell.component === 'textarea') {
        const id = `legacy-${String(cell.id || cell.name || 'text').replace(/[^a-z0-9_-]/gi, '')}`;
        const extra = Object.entries(cell.fields || {}).map(([name, value]) =>
          `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`).join('');
        return `<form method="post" action="${escapeHtml(cell.action)}">${sessionHiddenFields(options.actionFields(cell.action))}${extra}<p><label for="${escapeHtml(id)}">${escapeHtml(cell.label)}</label><br><textarea id="${escapeHtml(id)}" name="${escapeHtml(cell.name)}" rows="20" cols="80">${escapeHtml(cell.value || '')}</textarea></p><p><input type="submit" value="${escapeHtml(uiControlLabel('caret-right', cell.submitLabel || cell.label))}"></p></form>`;
      }
      if (cell && typeof cell === 'object' && cell.component === 'textarea-group') {
        const suffix = String(cell.id || 'textareas').replace(/[^a-z0-9_-]/gi, '');
        const extra = Object.entries(cell.fields || {}).map(([name, value]) =>
          `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`).join('');
        const textareas = (cell.textareas || []).map((textarea, index) => {
          const id = `legacy-${suffix}-${index}`;
          const maximum = Number.isSafeInteger(textarea.maxlength) && textarea.maxlength > 0
            ? ` maxlength="${textarea.maxlength}"` : '';
          return `<p><label for="${escapeHtml(id)}">${escapeHtml(textarea.label)}</label><br><textarea id="${escapeHtml(id)}" name="${escapeHtml(textarea.name)}" rows="${textarea.rows || 10}" cols="80"${maximum}>${escapeHtml(textarea.value || '')}</textarea></p>`;
        }).join('');
        return `<form method="post" action="${escapeHtml(cell.action)}">${sessionHiddenFields(options.actionFields(cell.action))}${extra}<fieldset><legend>${escapeHtml(cell.legend)}</legend>${textareas}<p><input type="submit" value="${escapeHtml(uiControlLabel('caret-right', cell.submitLabel || cell.legend))}"></p></fieldset></form>`;
      }
      if (cell && typeof cell === 'object' && cell.component === 'file') {
        const id = `legacy-${String(cell.name || 'file').replace(/[^a-z0-9_-]/gi, '')}`;
        const extra = Object.entries(cell.fields || {}).map(([name, value]) =>
          `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`).join('');
        const accept = cell.accept ? ` accept="${escapeHtml(cell.accept)}"` : '';
        const sections = (cell.sections || []).map((section, index) => {
          const sectionId = `${id}-section-${index}`;
          return `<p><input id="${escapeHtml(sectionId)}" name="importField" type="checkbox" value="${escapeHtml(section.value)}"${section.selected === false ? '' : ' checked'}><label for="${escapeHtml(sectionId)}">${escapeHtml(section.label)}</label></p>`;
        }).join('');
        return `<form method="post" action="${escapeHtml(cell.action)}" enctype="multipart/form-data">${sessionHiddenFields(options.actionFields(cell.action))}${extra}<fieldset><legend>${escapeHtml(cell.label)}</legend>${sections}<p><label for="${escapeHtml(id)}">${escapeHtml(cell.label)}</label><br><input id="${escapeHtml(id)}" name="${escapeHtml(cell.name)}" type="file"${accept}></p><p><input type="submit" value="${escapeHtml(uiControlLabel('caret-right', cell.submitLabel || cell.label))}"></p></fieldset></form>`;
      }
      if (cell && typeof cell === 'object' && cell.component === 'export') {
        const suffix = String(cell.fields?.checklistId || cell.fields?.cardId || '')
          .replace(/[^a-z0-9_-]/gi, '');
        const formatId = `legacy-export-format-${suffix}`;
        const extra = Object.entries(cell.fields || {}).map(([name, value]) =>
          `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`).join('');
        const formats = (cell.formats || []).map(format =>
          `<option value="${escapeHtml(format.value)}">${escapeHtml(format.label)}</option>`).join('');
        const sections = (cell.sections || []).map((section, index) => {
          const id = `legacy-export-section-${suffix}-${index}`;
          return `<p><input id="${escapeHtml(id)}" name="exportFields" type="checkbox" value="${escapeHtml(section.value)}"${section.selected === false ? '' : ' checked'}><label for="${escapeHtml(id)}">${escapeHtml(section.label)}</label></p>`;
        }).join('');
        return `<form method="post" action="${escapeHtml(cell.action)}">${sessionHiddenFields(options.actionFields(cell.action, `download:${suffix}`))}${extra}<fieldset><legend>${escapeHtml(cell.label)}</legend>${sections}<p><label for="${escapeHtml(formatId)}">${escapeHtml(cell.label)}</label><br><select id="${escapeHtml(formatId)}" name="exportFormat">${formats}</select></p><p><input type="submit" value="${escapeHtml(uiControlLabel('caret-right', cell.submitLabel || cell.label))}"></p></fieldset></form>`;
      }
      if (cell && typeof cell === 'object' && cell.component === 'attachment') {
        const details = [cell.type, Number.isFinite(cell.size) ? `${cell.size} bytes` : '']
          .filter(Boolean).join(', ');
        const actions = (cell.actions || []).map(action => postForm(
          action.action,
          action.label,
          options.actionFields(action.action, action.authPurpose),
          action.fields,
          action.icon,
          action.target,
        )).join(' ');
        return `<strong>${escapeHtml(cell.name || '')}</strong>${details ? ` (${escapeHtml(details)})` : ''}${actions ? `<p>${actions}</p>` : ''}`;
      }
      if (cell && typeof cell === 'object' && cell.component === 'image') {
        const width = Number.isSafeInteger(cell.width) && cell.width > 0
          ? Math.min(cell.width, 1000) : 160;
        return `<img src="${escapeHtml(cell.src || '')}" alt="${escapeHtml(cell.alt || '')}" width="${width}">`;
      }
      if (cell && typeof cell === 'object' && cell.action) {
        return postForm(cell.action, cell.label,
          options.actionFields(cell.action, cell.authPurpose), cell.fields, cell.icon, cell.target);
      }
      if (cell && typeof cell === 'object' && cell.href) {
        return `<a href="${escapeHtml(cell.href)}">${escapeHtml(uiControlLabel(cell.icon, cell.label))}</a>`;
      }
      return escapeHtml(cell);
    };
    const cells = (row.cells || []).map(renderCell);
    rows.push(tableRow(cells, { color: row.color, boardTheme: row.boardTheme,
      rowHeader: row.rowHeader, colspanLast: row.colspanLast }));
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
    '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">',
    `<html lang="${escapeHtml(options.language)}"><head>`,
    '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">',
    `<title>${escapeHtml(options.productName)} - ${escapeHtml(heading)}</title>`,
    '<link rel="stylesheet" type="text/css" href="/legacy-html4.css">',
    options.validatedCustomHeadTags || '',
    `<script type="text/javascript" src="${CAPABILITY_SCRIPT_PATH}"></script>`,
    '</head><body>',
    `<p class="skip-link"><a href="#content">${escapeHtml(translated(options, 'skip-to-content', 'Skip to main content'))}</a></p>`,
    '<div id="legacy-html4-page">',
    `<p><a href="/">${escapeHtml(options.productName)}</a></p>`,
    logo,
    belowLogo,
    `<h1 id="content">${escapeHtml(options.page?.heading || heading)}</h1>`,
    `<table class="legacy-content" summary="${escapeHtml(options.page?.heading || heading)}" border="1" cellpadding="4" cellspacing="0" width="100%">`,
    `<caption>${escapeHtml(options.page?.caption || options.page?.heading || heading)}</caption>`,
    `<thead><tr bgcolor="#2980b9">${(options.page?.columns || ['', '']).map(column => `<th scope="col"><font color="#ffffff">${escapeHtml(column)}</font></th>`).join('')}</tr></thead>`,
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
