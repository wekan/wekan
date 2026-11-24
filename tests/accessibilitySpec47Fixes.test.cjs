'use strict';

// The WCAG 2.2 AA faults tests/playwright/specs/47-accessibility-everywhere.e2e.js
// found in the Admin Panel panes, the board popups and under reduced motion,
// pinned in the sources. The browser spec scans what renders; this reads the
// templates and the CSS, where it can also say "and in no other select".
//
// Run: node tests/accessibilitySpec47Fixes.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
const SETTINGS = 'client/components/settings';
const settingsJade = fs.readdirSync(path.join(root, SETTINGS))
  .filter(name => name.endsWith('.jade')).map(name => `${SETTINGS}/${name}`);

function luminance(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = [...h].map(c => c + c).join('');
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
// The background the Admin Panel panes are drawn on in the default theme, as
// axe measured it.
const ADMIN_BG = '#dedede';

// The declarations of the FIRST rule whose selector list is exactly `selector`.
function ruleBody(css, selector) {
  const at = css.indexOf(`${selector} {`);
  assert.ok(at >= 0, `rule ${selector} exists`);
  return css.slice(at, css.indexOf('}', at));
}

// The template line that holds `token` (a jade class or id, e.g. "#s3-endpoint"
// or ".js-backup-time") on an input, textarea or select.
function controlLines(file, token) {
  const esc = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^\\s*(input|textarea|select)\\S*${esc}(?![\\w-])`);
  return read(file).split('\n').filter(line => re.test(line));
}

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// ── 1.3.1 / 4.1.2: every control has a name ─────────────────────────────────

// Each control axe found unnamed, and the existing key of the text shown beside
// it. The key must exist, so the name is translated like the visible label.
const NAMED = {
  [`${SETTINGS}/settingBody.jade`]: {
    '#custom-help-link-url': 'custom-help-link-url',
    '#legalNoticevalue': 'custom-legal-notice-link-url',
    '#automatic-linked-url-schemes': 'automatic-linked-url-schemes',
    '#custom-login-logo-image-url': 'custom-login-logo-image-url',
    '#custom-login-logo-link-url': 'custom-login-logo-link-url',
    '#text-below-custom-login-logo': 'text-below-custom-login-logo',
    '#custom-top-left-corner-logo-image-url': 'custom-top-left-corner-logo-image-url',
    '#custom-top-left-corner-logo-link-url': 'custom-top-left-corner-logo-link-url',
    '#custom-top-left-corner-logo-height': 'custom-top-left-corner-logo-height',
    '#spinnerName': 'wait-spinner',
    '#oidcBtnTextvalue': 'oidc-button-text',
    '#oauth-providers-login-style': 'oauth-providers-login-style',
    '#email-template-invite-subject': 'email-templates-invite-subject',
    '#email-template-invite-body': 'email-templates-invite-body',
    '#email-template-activity-subject': 'email-templates-activity-subject',
    '#email-template-activity-body': 'email-templates-activity-body',
    '#mailDomainNamevalue': 'email-domain-allowed-to-invite',
  },
  [`${SETTINGS}/attachments.jade`]: {
    '.js-default-save-storage': 'default-save-storage',
    '#filesystem-path': 'writable-path',
    '#attachments-path': 'attachments-path',
    '#avatars-path': 'avatars-path',
    '#s3-endpoint': 's3-endpoint',
    '#s3-region': 's3-region',
    '#s3-bucket': 's3-bucket',
    '#s3-access-key': 's3-access-key',
    '#azure-account-name': 'azure-account-name',
    '#azure-bucket': 'azure-container',
    '#gcs-project-id': 'gcs-project-id',
    '#gcs-bucket': 'gcs-bucket',
    '#gcs-key-filename': 'gcs-key-filename',
    '#webdav-endpoint': 'webdav-endpoint',
    '#webdav-username': 'username',
    '#webdav-folder': 'webdav-folder',
    '.js-backup-storage': 'backup-storage',
    '.js-backup-frequency': 'backup-frequency',
    '.js-backup-time': 'backup-time',
    '.js-cb-target': 'continuous-backup-target',
    '.js-cb-engine': 'continuous-backup-engine',
    '.js-cb-upload': 'continuous-backup-upload',
    '.js-cb-uploadPrefix': 'continuous-backup-upload-prefix',
    '.js-cb-sqliteIntervalSeconds': 'continuous-backup-sqlite-interval',
    '.js-cb-fileScanSeconds': 'continuous-backup-file-scan',
    '.js-cb-baseEveryHours': 'continuous-backup-base-every',
    '.js-cb-keepDays': 'continuous-backup-keep-days',
    '.js-move-scope': 'move-scope',
    '.js-move-source-storage': 'move-source',
    '.js-move-dest-storage': 'move-destination',
  },
  [`${SETTINGS}/connectionMethod.jade`]: {
    '.select-authentication': 'authentication-method',
  },
  'client/components/sidebar/sidebar.jade': {
    '.js-outgoing-webhooks-type': 'type',
  },
};

test('every control axe found unnamed carries the key of its visible label', () => {
  for (const [file, controls] of Object.entries(NAMED)) {
    for (const [token, key] of Object.entries(controls)) {
      const lines = controlLines(file, token);
      assert.ok(lines.length > 0, `${file}: a control ${token}`);
      for (const line of lines) {
        assert.ok(line.includes(`aria-label="{{_ '${key}'}}"`),
          `${file}: ${token} is named by '${key}': ${line.trim()}`);
      }
      assert.ok(Object.hasOwn(en, key), `'${key}' is an existing key in en.i18n.json`);
    }
  }
});

test('the four transfer limits name their mode, size and unit controls', () => {
  const src = read(`${SETTINGS}/attachments.jade`);
  for (const field of ['attachmentsUploadMaxBytes', 'attachmentsDownloadMaxBytes', 'apiUploadMaxBytes', 'apiDownloadMaxBytes']) {
    for (const cls of ['js-attachment-limit-mode', 'js-attachment-limit-unit']) {
      const line = src.split('\n').find(l => l.includes(`.${cls}(data-field="${field}"`));
      assert.ok(line && /aria-label="\{\{_ '[\w-]+-limit-label'\}\}/.test(line), `${cls} ${field} is named`);
    }
  }
  assert.equal((src.match(/-limit-value\([^\n]*aria-label=/g) || []).length, 4, 'every size input is named');
});

test('the product name is named by its group title, so the string is shown once', () => {
  const src = read(`${SETTINGS}/settingBody.jade`);
  assert.match(src, /h2\.admin-pane-group-title#product-name-title \{\{_ 'custom-product-name'\}\}/);
  assert.ok(controlLines(`${SETTINGS}/settingBody.jade`, '#product-name')[0].includes('aria-labelledby="product-name-title"'));
});

test('the mail service select is labelled by its visible title', () => {
  assert.match(read(`${SETTINGS}/settingBody.jade`), /label\.title\(for="mail-service"\) \{\{_ 'admin-email-service'\}\}/);
});

test('table-page filters keep their plain label and name the select with it', () => {
  const jade = read(`${SETTINGS}/tablePage.jade`);
  assert.match(jade, /select\.js-table-page-filter\([^\n]*aria-label="\{\{#if labelKey\}\}\{\{_ labelKey\}\}\{\{else\}\}\{\{label\}\}\{\{\/if\}\}"/);
  assert.match(read('models/lib/tablePage.js'), /label: filter\.label \|\| ''/,
    'buildFilters passes a filter\'s own label through');
});

test('People: each row checkbox and avatar link has a name', () => {
  const src = read(`${SETTINGS}/peopleBody.jade`);
  const boxes = src.split('\n').filter(l => /input\.selectUserChkBox\(/.test(l));
  assert.ok(boxes.length >= 2);
  for (const l of boxes) assert.ok(l.includes('aria-label="{{userData.username}}"'), l.trim());
  const links = src.split('\n').filter(l => /a\.js-edit-people-avatar\(/.test(l));
  assert.ok(links.length >= 3);
  for (const l of links) {
    assert.ok(l.includes("{{_ 'change-avatar'}}: {{userData.username}}"), l.trim());
    // 2.5.3 Label in Name: the initials shown instead of a photo begin the name.
    assert.ok(l.includes('{{#unless hasAvatarUrl}}{{userData.getInitials}} {{/unless}}'), l.trim());
  }
});

test('Offices and the other tables: a person link\'s name contains its visible initials', () => {
  const jade = read(`${SETTINGS}/tablePage.jade`);
  const links = jade.split('\n').filter(l => /a\.member\.edit-user\.js-table-page-edit-user\(/.test(l));
  assert.equal(links.length, 2);
  for (const l of links) assert.match(l, /aria-label="\{\{personLinkLabel userId initials text \w+\}\}"/);
  assert.match(read(`${SETTINGS}/tablePage.js`), /personLinkLabel\(userId, initials, text, avatarUrl\)/);
});

test('a person link always has a name, even with no text and no account on this client (link-name)', () => {
  // Problems / API: a row with a user id and no text beside it. The helper,
  // run with a stand-in ReactiveCache.
  const src = read(`${SETTINGS}/tablePage.js`);
  const start = src.indexOf('  personLinkLabel(userId, initials, text, avatarUrl) {');
  const end = src.indexOf('\n  },', start);
  const vm = require('node:vm');
  const make = users => vm.runInNewContext(`({ ${src.slice(start, end)} } })`, {
    ReactiveCache: { getUser: id => users[id] || null },
  }).personLinkLabel;
  const label = make({ u1: { username: 'anna', profile: { fullname: 'Anna Ek' }, getInitials: () => 'AE' } });
  assert.equal(label('u1', '', '', ''), 'AE Anna Ek', 'the account\'s own name, starting with its initials');
  assert.equal(label('gone', '', '', ''), 'gone', 'no account here: its id, never an empty name');
  assert.equal(label('u1', 'AE', 'Anna Ek (anna)', ''), 'AE Anna Ek (anna)');
  assert.equal(label('u1', 'AE', 'Anna Ek (anna)', '/a.png'), 'Anna Ek (anna)', 'with an avatar image its alt is the label');
  assert.equal(label('', '', '', ''), '', 'negative: no user, no link name to make');
});

test('the spinner preview is an image, so its aria-label is allowed', () => {
  assert.match(read(`${SETTINGS}/settingBody.jade`),
    /\.spinner-preview\(role="img" title="\{\{_ 'preview'\}\}" aria-label="\{\{_ 'preview'\}\}"\)/);
});

// Every <select> of the Admin Panel templates has a name: an aria-label (or
// aria-labelledby) of its own, a label(for=) pointing at its id, or a label
// element around it.
function unnamedSelects(file) {
  const src = read(file);
  const lines = src.split('\n');
  const out = [];
  lines.forEach((line, i) => {
    const m = /^(\s*)select\b/.exec(line);
    if (!m) return;
    if (/aria-label(ledby)?=/.test(line)) return;
    const head = line.split('(')[0];
    const id = (/#([\w-]+)/.exec(head) || /\bid="([^"]+)"/.exec(line) || [])[1];
    if (id && src.includes(`for="${id}"`)) return;
    let indent = m[1].length;
    for (let j = i - 1; j >= 0; j -= 1) {
      const p = lines[j];
      if (!p.trim()) continue;
      const pi = p.length - p.trimStart().length;
      if (pi < indent) {
        indent = pi;
        if (/^\s*label\b/.test(p)) return;
        if (/^\s*template\(/.test(p)) break;
      }
    }
    out.push(`${file}:${i + 1}: ${line.trim()}`);
  });
  return out;
}

test('no <select> in client/components/settings/*.jade lacks a label or aria-label (negative)', () => {
  const missing = settingsJade.flatMap(unnamedSelects);
  assert.deepEqual(missing, [], missing.join('\n'));
});

test('the select check itself catches an unnamed select (negative of the negative)', () => {
  const tmpDir = path.join(root, '.tools', 'tmp');
  fs.mkdirSync(tmpDir, { recursive: true });
  const dir = fs.mkdtempSync(path.join(tmpDir, 'a11y47-'));
  try {
    const rel = path.relative(root, path.join(dir, 'x.jade'));
    fs.writeFileSync(path.join(root, rel), [
      'template(name="x")',
      '  .form-group',
      "    .title {{_ 'type'}}",
      '    select.js-unnamed',
      '      option(value="a") A',
      '  label',
      '    | wrapped',
      '    select.js-wrapped',
      "  label(for=\"sel\") {{_ 'type'}}",
      '  select#sel',
    ].join('\n'));
    assert.deepEqual(unnamedSelects(rel).map(s => s.split(': ')[1]), ['select.js-unnamed']);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('every aria-label key used in the Admin Panel templates exists (negative)', () => {
  const bad = [];
  for (const file of settingsJade) {
    for (const [, key] of read(file).matchAll(/aria-label="[^"]*?\{\{_ '([\w.-]+)'\}\}/g)) {
      if (!Object.hasOwn(en, key)) bad.push(`${file}: ${key}`);
    }
  }
  assert.deepEqual(bad, []);
});

// ── 1.3.1 / 4.1.2 in the member menu ────────────────────────────────────────

test('the dependency toggles are checkboxes, not menu items without a menu', () => {
  const src = read('client/components/users/dependencyMenu.jade');
  assert.match(src, /a\.js-toggle-my-dependencies\(role="checkbox" aria-checked=/);
  assert.match(src, /a\.js-toggle-board-dependencies\(role="checkbox" aria-checked=/);
});

test('no template uses a menuitem role outside a role="menu" (negative)', () => {
  const walk = (dir, out = []) => {
    for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) walk(rel, out); else if (e.name.endsWith('.jade')) out.push(rel);
    }
    return out;
  };
  const bad = walk('client').filter(f => {
    const src = read(f);
    return /role="menuitem(checkbox|radio)?"/.test(src) && !/role="(menu|menubar)"/.test(src);
  });
  assert.deepEqual(bad, []);
});

test('the member menu list holds only list items: no bare hr, no nested list (negative)', () => {
  const src = read('client/components/users/userHeader.jade');
  const start = src.indexOf('template(name="memberMenuPopup")');
  const body = src.slice(start, src.indexOf('\ntemplate(', start + 1));
  // Inside `ul.pop-over-list` (2 spaces) under `with currentUser` (4), the items
  // sit at 6 spaces or deeper inside if/unless; a separator is wrapped in an li.
  assert.ok(!/^ {6,}hr$/m.test(body.replace(/^ +li\.pop-over-list-separator\n {8}hr$/gm, '')),
    'every hr in the member menu is inside li.pop-over-list-separator');
  assert.ok(!/^ {6,}ul\.pop-over-list/m.test(body), 'no list nested directly in the menu list');
  assert.ok((body.match(/li\.pop-over-list-separator\n {8}hr/g) || []).length >= 2);
});

// ── 1.4.3 Contrast (Minimum) in the default theme ───────────────────────────

test('the quiet Admin Panel texts reach 4.5:1 on its background', () => {
  const setting = read(`${SETTINGS}/settingBody.css`);
  const problems = read(`${SETTINGS}/adminProblems.css`);
  const attach = read(`${SETTINGS}/attachments.css`);
  const color = body => (/\bcolor:\s*(#[0-9a-f]{3,6})/i.exec(body) || [])[1];
  const cases = [
    ['.feature-desc', ruleBody(setting, '#tableVisibilityMode-setting .feature-desc')],
    ['.ldap-source-badge', ruleBody(setting, '.ldap-source-badge')],
    ['.instrumentation-area-head', ruleBody(problems, '.instrumentation-area-head')],
    ['.instrumentation-area-num.has-errors', ruleBody(problems, '.instrumentation-area-num.has-errors')],
    ['.cloud-input-example', ruleBody(attach, '.attachments-content .cloud-input-example')],
    ['.cloud-input-path', ruleBody(attach, '.attachments-content .cloud-input-path')],
    ['.cloud-input-desc', ruleBody(attach, '.attachments-content .cloud-input-desc')],
  ];
  for (const [name, body] of cases) {
    const c = color(body);
    assert.ok(c, `${name} sets a colour`);
    assert.ok(ratio(c, ADMIN_BG) >= 4.5, `${name} ${c} is ${ratio(c, ADMIN_BG).toFixed(2)}:1`);
    // Fading with opacity is what made two of them fail; a solid colour is used.
    assert.ok(!/opacity:\s*0\.\d/.test(body), `${name} is not faded with opacity`);
  }
});

test('the default theme hover under a popup menu item keeps white text at 4.5:1', () => {
  const css = read('client/components/boards/boardColors.css');
  const belize = ruleBody(css, '.board-color-belize');
  const hover = /--board-theme-hover:\s*(#[0-9a-f]{6})/i.exec(belize)[1];
  assert.ok(ratio('#ffffff', hover) >= 4.5, `${hover} under white is ${ratio('#ffffff', hover).toFixed(2)}:1`);
  assert.notEqual(hover.toLowerCase(), '#2e90d0', 'not the 3.49:1 blue again');
});

// ── 2.5.8 Target Size (Minimum) ─────────────────────────────────────────────

test('ticked rows and the Select all / Unselect all icons are at least 24px', () => {
  const css = read(`${SETTINGS}/settingBody.css`);
  const rows = ruleBody(css, '.setting-content a.flex:has(> .materialCheckBox),\na.flex.js-notify-option');
  assert.match(rows, /min-height:\s*24px/);
  const icons = ruleBody(css, 'a.js-org-feature-all,\na.js-team-feature-all');
  assert.match(icons, /min-width:\s*24px/);
  assert.match(icons, /min-height:\s*24px/);
  assert.match(icons, /display:\s*inline-flex/);
});

// ── 2.3.3 Animation from Interactions ───────────────────────────────────────

test('one global reduced-motion rule zeroes every animation and transition', () => {
  const css = read('client/components/main/layouts.css');
  const at = css.indexOf('@layer wekan-reduced-motion');
  assert.ok(at >= 0, 'the rule sits in a cascade layer, so it outranks unlayered !important');
  const block = css.slice(at, css.indexOf('\n}\n', at));
  assert.match(block, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(block, /\*,\s*\*::before,\s*\*::after\s*\{/);
  for (const decl of ['animation-duration: 0.01ms !important', 'animation-iteration-count: 1 !important',
    'transition-duration: 0.01ms !important', 'animation-delay: 0s !important', 'transition-delay: 0s !important']) {
    assert.ok(block.includes(decl), decl);
  }
  // layouts.css is part of every client bundle.
  assert.match(read('client/styles.js'), /import '\/client\/components\/main\/layouts\.css';/);
});

test('no other cascade layer can outrank the reduced-motion one (negative)', () => {
  const walk = (dir, out = []) => {
    for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) walk(rel, out); else if (e.name.endsWith('.css')) out.push(rel);
    }
    return out;
  };
  const layered = walk('client').filter(f => /@layer\b/.test(read(f)));
  assert.deepEqual(layered, ['client/components/main/layouts.css']);
});

console.log(`\naccessibilitySpec47Fixes: ${passed} tests passed`);
