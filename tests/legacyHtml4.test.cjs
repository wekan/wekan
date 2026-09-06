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
  safeColor,
} = require('../imports/lib/legacyHtml4');
const {
  UI_ICONS, uiControlLabel, uiFileForm, uiIcon, uiSearchForm, uiTextareaForm,
} = require('../imports/lib/uiComponentLibrary');
const { KEYBOARD_SHORTCUT_MAPPINGS } = require('../imports/lib/keyboardShortcutMappings');
const { IMPORT_SOURCES, importSourceByKey, importSourceName } = require('../models/lib/importSources');
const { BOARD_EXPORT_FIELDS, parseImportFields, toggleImportField } = require('../models/lib/exportFields');

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

test('every Legacy HTML4 translation key exists in the source catalogue', () => {
  const root = path.join(__dirname, '..');
  const english = JSON.parse(fs.readFileSync(path.join(root, 'imports', 'i18n', 'data',
    'en.i18n.json'), 'utf8'));
  const sources = [
    path.join(root, 'imports', 'lib', 'legacyHtml4.js'),
    path.join(root, 'server', 'lib', 'legacyHtml4Pages.js'),
  ].map(file => fs.readFileSync(file, 'utf8')).join('\n');
  const missing = [];
  for (const calls of [/(?:translated|tr)\([^,]+,\s*'([^']+)'/g, /\bt\(\s*'([^']+)'/g]) {
    let match;
    while ((match = calls.exec(sources))) {
      if (!Object.prototype.hasOwnProperty.call(english, match[1])) missing.push(match[1]);
    }
  }
  assert.deepEqual([...new Set(missing)], []);
});

test('all WeKan page URLs receive the HTML4 baseline', () => {
  for (const url of ['/', '/sign-in', '/sign-up', '/allboards/table',
    '/b/KfGA54csY72ir5H6p/taulu-1', '/b/x/board/card/y',
    '/admin/problems/security-report', '/my-cards']) {
    assert.equal(isDocumentRequest(request(url, { accept: 'text/html' })), true, url);
    const html = renderLegacyHtml4Page(url);
    assert.match(html, /^<!DOCTYPE HTML PUBLIC "-\/\/W3C\/\/DTD HTML 4\.01 Transitional\/\/EN"/);
    assert.match(html, /Legacy HTML4 view because JavaScript drag and drop is not available/);
  }
});

test('every Legacy HTML4 page has one content table and no frames', () => {
  for (const url of ['/sign-in', '/sign-up', '/allboards', '/b/x/board', '/admin/problems']) {
    const html = renderLegacyHtml4Page(url, {
      authenticated: url !== '/sign-in' && url !== '/sign-up',
      username: 'alice',
      actionFields: action => ({
        legacySession: 'a'.repeat(48), authAction: action,
        authCounter: '1', authHash: 'b'.repeat(64),
      }),
      page: url.startsWith('/sign') ? null : {
        heading: 'Page', columns: ['Content', 'Action'],
        rows: [{ cells: ['safe', { action: url, label: 'Open' }] }],
      },
    });
    assert.equal((html.match(/<table\b/g) || []).length, 1, url);
    assert.equal((html.match(/<\/table>/g) || []).length, 1, url);
    assert.doesNotMatch(html, /<\/?(?:frame|frameset|iframe)\b/i, url);
    assert.match(html, /<a href="#content">Skip to main content<\/a>/, url);
    assert.match(html, /<h1 id="content">/, url);
    assert.match(html, /<caption>/, url);
    assert.match(html, /<th scope="col">/, url);
    assert.match(html, /<th scope="row">/, url);
    assert.match(html, /border="1" cellpadding="4" cellspacing="0" width="100%"/, url);
  }
});

test('shared UI icons have printable ASCII and Jade mappings', () => {
  for (const [name, icon] of Object.entries(UI_ICONS)) {
    assert.match(icon.ascii, /^[\x20-\x7e]+$/, name);
    assert.match(icon.html5, /^fa-[a-z-]+$/, name);
  }
  assert.equal(uiIcon('caret-down'), 'v');
  assert.equal(uiIcon('caret-right'), '>');
  assert.equal(uiControlLabel('caret-right', 'Board'), '> Board');
  assert.equal(uiControlLabel('add', 'Card'), '+ Card');
  const jade = fs.readFileSync(path.join(__dirname, '..', 'client', 'components',
    'swimlanes', 'swimlaneHeader.jade'), 'utf8');
  const helpers = fs.readFileSync(path.join(__dirname, '..', 'client', 'config',
    'blazeHelpers.js'), 'utf8');
  assert.match(jade, /uiIconClass 'caret-right'/);
  assert.match(jade, /uiIconClass 'caret-down'/);
  assert.match(helpers, /uiIcon\(name, 'html5'\)/);
});

test('component library has matching HTML5 and HTML4 routes', () => {
  const root = path.join(__dirname, '..');
  const read = file => fs.readFileSync(path.join(root, file), 'utf8');
  const router = read('config/router.js');
  const templates = read('client/components/main/uiComponentLibrary.jade');
  const pages = read('server/lib/legacyHtml4Pages.js');
  assert.match(router, /FlowRouter\.route\('\/accessibility\/components'/);
  assert.match(templates, /template\(name="uiComponentLibrary"\)/);
  assert.match(templates, /uiIconClass 'caret-down'/);
  assert.match(pages, /path === '\/accessibility\/components'/);
  assert.match(pages, /UI_ICONS\['caret-down'\]\.ascii/);
});

test('information pages have dedicated controllers and share shortcut data', () => {
  const root = path.join(__dirname, '..');
  const pages = fs.readFileSync(path.join(root, 'server', 'lib', 'legacyHtml4Pages.js'), 'utf8');
  const keyboard = fs.readFileSync(path.join(root, 'client', 'lib', 'keyboard.js'), 'utf8');
  for (const route of ['/accessibility', '/support', '/shortcuts']) {
    assert.match(pages, new RegExp(`path === '${route}'`), route);
  }
  assert.match(keyboard, /keyboardShortcutMappings.*KEYBOARD_SHORTCUT_MAPPINGS/);
  assert.ok(KEYBOARD_SHORTCUT_MAPPINGS.length >= 16);
  for (const mapping of KEYBOARD_SHORTCUT_MAPPINGS) {
    assert.ok(mapping.keys.length > 0);
    assert.match(mapping.action, /^[a-z0-9-]+$/);
  }
  assert.match(pages, /supportPagePublic === true \|\| Boolean\(userId\)/);
  assert.match(pages, /AccessibilitySettings\.findOneAsync/);
  assert.match(pages, /const allowed = Boolean\(userId\)/);
});

test('HTML5 and HTML4 import pickers share one safe source registry', () => {
  const root = path.join(__dirname, '..');
  const pages = fs.readFileSync(path.join(root, 'server', 'lib', 'legacyHtml4Pages.js'), 'utf8');
  const html5 = fs.readFileSync(path.join(root, 'client', 'components', 'import', 'import.js'), 'utf8');
  assert.ok(IMPORT_SOURCES.length >= 14);
  assert.equal(new Set(IMPORT_SOURCES.map(source => source.key)).size, IMPORT_SOURCES.length);
  for (const source of IMPORT_SOURCES) assert.match(source.key, /^[a-z0-9-]+$/);
  assert.equal(importSourceByKey('trello').name, 'Trello');
  assert.equal(importSourceByKey('../admin'), null);
  assert.equal(importSourceName(importSourceByKey('wekan'), 'Branded'), 'Branded (JSON, .zip)');
  assert.match(html5, /require\('\/models\/lib\/importSources'\)/);
  assert.match(pages, /importSourceByKey\(selectedKey\)/);
  assert.match(pages, /uiAction\(\{ action: `\/import\/\$\{source\.key\}`/);
  assert.match(pages, /if \(!userId \|\| !\/\^\\\/import/);
  assert.deepEqual(parseImportFields(undefined), BOARD_EXPORT_FIELDS.map(part => part.field));
  assert.equal(toggleImportField(undefined, 'comments').includes('comments'), false);
  assert.deepEqual(toggleImportField('comments', 'not-a-real-field'), ['comments']);
  assert.match(pages, /fields: \{ importFields, toggleImportField: part\.field \}/);
});

test('HTML4 text imports use a bounded signed form and the shared import method', () => {
  const root = path.join(__dirname, '..');
  const operations = fs.readFileSync(path.join(root, 'server', 'lib',
    'legacyHtml4Imports.js'), 'utf8');
  const middleware = fs.readFileSync(path.join(root, 'server', 'legacyHtml4.js'), 'utf8');
  assert.match(operations, /MAX_IMPORT_TEXT_BYTES = 5 \* 1024 \* 1024/);
  assert.match(operations, /importSourceByKey\(source\)/);
  assert.match(operations, /document: parseImportText\(source, input\)/);
  assert.match(operations, /pruneImportDocument\(document, selected\)/);
  assert.match(operations, /Meteor\.callAsync\('importBoard', pruned/);
  assert.match(operations, /DDP\._CurrentMethodInvocation\.withValue/);
  assert.match(middleware, /session && requestFields\.legacyOperation === 'import-board-text'/);

  const html = renderLegacyHtml4Page('/import/csv', {
    authenticated: true,
    username: 'alice',
    actionFields: action => ({ legacySession: 'a'.repeat(48), authAction: action,
      authCounter: '1', authHash: 'b'.repeat(64) }),
    page: { heading: 'Import', columns: ['Input', 'Action'], rows: [{ rowHeader: false,
      cells: [uiTextareaForm({ action: '/import/csv', label: 'CSV input', name: 'importText',
        value: '<unsafe>', fields: { legacyOperation: 'import-board-text' },
        submitLabel: 'Import' }), ''] }] },
  });
  assert.match(html, /<label for="legacy-importText">CSV input<\/label>/);
  assert.match(html, /<textarea[^>]+name="importText"[^>]*>&lt;unsafe&gt;<\/textarea>/);
  assert.match(html, /name="legacyOperation" value="import-board-text"/);
  assert.match(html, /name="authHash" value="b{64}"/);
});

test('HTML4 file imports stream bounded multipart data to private temporary files', () => {
  const root = path.join(__dirname, '..');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
  const multipart = fs.readFileSync(path.join(root, 'server', 'lib',
    'legacyHtml4Multipart.js'), 'utf8');
  const operations = fs.readFileSync(path.join(root, 'server', 'lib',
    'legacyHtml4Imports.js'), 'utf8');
  const middleware = fs.readFileSync(path.join(root, 'server', 'legacyHtml4.js'), 'utf8');
  assert.match(multipart, /require\('@fastify\/busboy'\)/);
  assert.equal(manifest.dependencies['@fastify/busboy'], '^3.2.2');
  assert.equal(lock.packages['node_modules/@fastify/busboy'].license, 'MIT');
  assert.match(multipart, /files: 1, fields: 20, parts: 21/);
  assert.match(multipart, /fileSize: MAX_MULTIPART_FILE_BYTES/);
  assert.match(multipart, /createWriteStream\(tempPath, \{ flags: 'wx', mode: 0o600 \}\)/);
  assert.match(multipart, /fieldName !== 'importFile' \|\| upload/);
  assert.match(multipart, /upload\.truncated/);
  assert.match(multipart, /Promise\.resolve\(fileWrite\)[\s\S]*then\(cleanup\)/);
  assert.match(multipart, /req\.on\('aborted'/);
  assert.match(operations, /importLegacyHtml4File/);
  assert.match(operations, /source === 'excel'[\s\S]*excelBase64/);
  assert.match(operations, /detectedFileMime\(upload\.tempPath\)/);
  assert.match(operations, /await assertImportEnabled\(\)/);
  assert.match(operations, /importZipBuffer\(bytes, userId\)/);
  assert.match(operations, /readWekanZipArchive\(upload\.tempPath/);
  assert.match(operations, /new WekanCreator\(\{ membersMapping: \{\},[\s\S]*attachmentStream/);
  assert.match(operations, /withDeadline\(creator\.create\(document, null\)/);
  assert.match(operations, /return await invokeImport/);
  assert.ok(middleware.indexOf('receiveLegacyHtml4Multipart(req)')
    < middleware.indexOf('consumeLegacyHtml4Session(req, path)'),
  'multipart fields are parsed before their signature is checked');
  assert.match(middleware, /removeLegacyHtml4Upload\(multipartUpload\)/);

  const html = renderLegacyHtml4Page('/import/wekan', {
    authenticated: true, username: 'alice',
    actionFields: action => ({ legacySession: 'a'.repeat(48), authAction: action,
      authCounter: '1', authHash: 'b'.repeat(64) }),
    page: { heading: 'Import', columns: ['Input', 'Action'], rows: [{ rowHeader: false,
      cells: [uiFileForm({ action: '/import/wekan', label: 'JSON file', name: 'importFile',
        accept: '.json,application/json', fields: { legacyOperation: 'import-board-file' },
        submitLabel: 'Import' }), ''] }] },
  });
  assert.match(html, /enctype="multipart\/form-data"/);
  assert.match(html, /<label for="legacy-importFile">JSON file<\/label>/);
  assert.match(html, /type="file" accept="\.json,application\/json"/);
  assert.match(html, /name="legacyOperation" value="import-board-file"/);
});

test('card discovery pages scope reads to the authenticated user boards', () => {
  const root = path.join(__dirname, '..');
  const pages = fs.readFileSync(path.join(root, 'server', 'lib', 'legacyHtml4Pages.js'), 'utf8');
  const middleware = fs.readFileSync(path.join(root, 'server', 'legacyHtml4.js'), 'utf8');
  for (const route of ['/my-cards', '/due-cards', '/global-search', '/bookmarks']) {
    assert.match(pages, new RegExp(route.replace('/', '\\/')), route);
  }
  assert.match(pages, /if \(!userId\) return null/);
  assert.match(pages, /Boards\.userBoardIds\(userId, false, \{\}, \{ includePublic: false \}\)/);
  assert.match(pages, /\{ members: userId \}.*\{ assignees: userId \}/s);
  assert.match(pages, /starredPagesOf\(user\?\.profile\?\.starredPages\)/);
  assert.match(pages, /query\.replace\(\/\[\.\*\+\?\^\$\{\}\(\)\|\[\\\]\\\\\]\/g/);
  assert.match(middleware, /if \(query\.has\('q'\)\) requestFields\.q = query\.get\('q'\)/);
});

test('All Boards HTML4 routes use the shared section and workspace selectors', () => {
  const pages = fs.readFileSync(path.join(__dirname, '..', 'server', 'lib',
    'legacyHtml4Pages.js'), 'utf8');
  assert.match(pages, /defaultSection, menuSectionOrder, normalizeSection, sectionTitleKey/);
  assert.match(pages, /workspaceIdForSlugPath\(tree, slugPath, getSlug\)/);
  assert.match(pages, /workspaceSlugPath\(profile\.boardWorkspacesTree \|\| \[\], node\.id, getSlug\)/);
  assert.match(pages, /selector\.members = \{ \$elemMatch: \{ userId, isActive: true, isAdmin: true \} \}/);
  assert.match(pages, /Boards\.userBoards\(userId, archived, selector/);
  assert.match(pages, /\{ includePublic: false \}/);
  assert.match(pages, /selector\.type = 'template-container'/);
  assert.match(pages, /selector\._id = \{ \$nin: Object\.keys\(assignments\) \}/);
});

test('card details repeat board and assigned-only authorization scopes', () => {
  const pages = fs.readFileSync(path.join(__dirname, '..', 'server', 'lib',
    'legacyHtml4Pages.js'), 'utf8');
  assert.match(pages, /cardDetailsPage\(board, segment\(cardMatch\[1\]\), userId, translate\)/);
  assert.match(pages, /const assignedScope = assignedOnlyCardScope\(board, userId\)/);
  assert.match(pages, /\.\.\.boardCardScope\(board\)/);
  assert.match(pages, /deletedAt: null/);
  assert.match(pages, /Meteor\.users\.find\(\{ _id: \{ \$in: personIds \} \}/);
  assert.match(pages, /fields: \{ username: 1, 'profile\.fullname': 1 \}/);
  assert.match(pages, /CardComments\.find\(\{ cardId: card\._id, boardId: card\.boardId \}/);
  assert.match(pages, /ChecklistItems\.find\(\{ cardId: card\._id, boardId: card\.boardId/);
  assert.match(pages, /Attachments\.collection\.find\(\{ 'meta\.cardId': card\._id, 'meta\.boardId': card\.boardId \}/);
  assert.match(pages, /cleanFileName\(attachment\.name\)/);
});

test('HTML4 global search is a labelled signed POST form', () => {
  const html = renderLegacyHtml4Page('/global-search', {
    authenticated: true,
    username: 'alice',
    actionFields: action => ({
      legacySession: 'a'.repeat(48), authAction: action,
      authCounter: '1', authHash: 'b'.repeat(64),
    }),
    page: {
      heading: 'Search All Boards', columns: ['Card', 'Board', 'Due Date'],
      rows: [{ rowHeader: false, cells: [uiSearchForm({
        action: '/global-search', label: 'Search All Boards', value: '<query>',
      }), '', ''] }],
    },
  });
  assert.match(html, /<form method="post" action="\/global-search">/);
  assert.match(html, /<label for="legacy-search-query">Search All Boards<\/label>/);
  assert.match(html, /name="q"[^>]+value="&lt;query&gt;"/);
  assert.match(html, /name="authHash" value="b{64}"/);
  assert.doesNotMatch(html, /<th scope="row"><form method="post" action="\/global-search">/);
});

test('authenticated navigation gives every HTML4 destination its translated name', () => {
  const html = renderLegacyHtml4Page('/my-cards', {
    authenticated: true,
    username: 'alice',
    actionFields: action => ({ legacySession: 'a'.repeat(48), authAction: action,
      authCounter: '1', authHash: 'b'.repeat(64) }),
    page: { heading: 'My Cards', columns: ['Card', 'Board'], rows: [] },
  });
  for (const label of ['All Boards', 'My Cards', 'Due Cards', 'Search All Boards',
    'Starred boards', 'Import', 'Support', 'Accessibility', 'Keyboard shortcuts']) {
    assert.match(html, new RegExp(`value="&gt; ${label}"`), label);
  }
});

test('account forms retain semantic labels, grouping and keyboard order', () => {
  const login = renderLegacyHtml4Page('/sign-in');
  assert.match(login, /<fieldset><legend>Log In<\/legend>/);
  assert.ok(login.indexOf('for="username"') < login.indexOf('for="password"'));
  assert.ok(login.indexOf('name="username"') < login.indexOf('name="password"'));
  assert.ok(login.indexOf('name="password"') < login.indexOf('type="submit"'));
  assert.doesNotMatch(login, /tabindex\s*=\s*["']?[1-9]/i);
  const css = fs.readFileSync(path.join(__dirname, '..', 'public', 'legacy-html4.css'), 'utf8');
  assert.match(css, /a:focus,[\s\S]*input:focus[\s\S]*outline:/);
});

test('HTML4 page actions are visible signed POST controls', () => {
  const html = renderLegacyHtml4Page('/b/board/example', {
    authenticated: true,
    actionFields: action => ({
      legacySession: 'a'.repeat(48), authAction: action,
      authCounter: '4', authHash: 'b'.repeat(64),
    }),
    page: {
      heading: 'Board', columns: ['Content', 'Action'],
      rows: [{ cells: ['List', [{ action: '/b/board/example', label: 'Next list', fields: { viewList: 'list2' } }]] }],
    },
  });
  assert.match(html, /<form class="legacy-action" method="post" action="\/b\/board\/example">/);
  assert.match(html, /name="authAction" value="\/b\/board\/example"/);
  assert.match(html, /name="viewList" value="list2"/);
  assert.match(html, /type="submit" value="&gt; Next list"/);
});

test('HTML4 colors accept only the shared palette or a six-digit hex', () => {
  assert.equal(safeColor('green'), '#3cb500');
  assert.equal(safeColor('belize', true), '#2980b9');
  assert.equal(safeColor('#Aa00ff'), '#aa00ff');
  assert.equal(safeColor('red;position:fixed'), '');
  assert.equal(safeColor('url(javascript:alert(1))'), '');
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
  assert.match(html, /Username: alice/);
  assert.doesNotMatch(html, /<form method="post" action="\/users\/login">/);

  const middleware = fs.readFileSync(path.join(__dirname, '..', 'server',
    'legacyHtml4.js'), 'utf8');
  assert.match(middleware, /consumeLegacyHtml4Session\(req, path\)/);
  assert.match(middleware, /authenticated: Boolean\(session\)/);
  assert.match(middleware, /tripCanary\('authz\.legacy-html4-session'/);
});

test('sign-up uses registration guards and starts the same cookieless session', () => {
  const signup = renderLegacyHtml4Page('/sign-up');
  assert.match(signup, /<form method="post" action="\/users\/register">/);
  assert.match(signup, /name="legacyHtml4" value="1"/);
  const route = fs.readFileSync(path.join(__dirname, '..', 'server',
    'apiAuthRoutes.js'), 'utf8');
  const register = route.slice(route.indexOf("WebApp.handlers.post('/users/register'"));
  assert.match(register, /legacyHtml4 = req\.body\?\.legacyHtml4 === '1'/);
  assert.match(register, /disableRegistration === true/);
  assert.match(register, /delete options\.legacyHtml4/);
  assert.match(register, /createLegacyHtml4Session\(userId, req\)/);
  assert.match(register, /renderLegacyHtml4Page\('\/allboards'/);
  assert.match(register, /Location', '\/sign-up\?registration=failed'/);
  const beforeToken = register.indexOf('createLegacyHtml4Session(userId, req)');
  const reusableToken = register.indexOf('Accounts._generateStampedLoginToken()');
  assert.ok(beforeToken !== -1 && reusableToken > beforeToken,
    'HTML4 returns before a reusable Meteor token is generated');
});

test('sign-in uses the HTML5 view branding, settings and translations', () => {
  const values = {
    'loginPopup-title': 'Kirjaudu sisään', username: 'Käyttäjänimi',
    email: 'Sähköposti', password: 'Salasana',
    'forgot-password': 'Unohtunut salasana',
    'signupPopup-title': 'Luo käyttäjätili',
    acceptance_of_our_legalNotice: 'Jatkamalla hyväksyt', legalNotice: 'käyttöehdot',
    'skip-to-content': 'Siirry pääsisältöön',
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
  assert.match(html, /Siirry pääsisältöön/);
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
