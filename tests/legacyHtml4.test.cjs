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
  UI_ICONS, uiAttachment, uiBoardCreateForm, uiCardDestinationForm, uiControlLabel,
  uiExportForm, uiFieldsetForm, uiFileForm, uiIcon, uiSearchForm,
  uiSelectForm, uiTextareaForm, uiTextForm,
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

test('shared fieldset component keeps related labelled fields in one form', () => {
  const component = uiFieldsetForm({
    action: '/b/a/board/c', legend: 'Location', id: 'new-location',
    inputs: [
      { label: 'Location name', name: 'locationName', value: 'Harbour', maxlength: 1000 },
      { label: 'Latitude', name: 'locationLatitude', value: '60.1', maxlength: 40 },
      { type: 'select', label: 'Relation', name: 'dependencyType', value: 'blocks',
        options: [{ value: 'related-to', label: 'Related' }, { value: 'blocks', label: 'Blocks' }] },
    ],
    fields: { legacyOperation: 'save-card-location', locationId: '' }, submitLabel: 'Save',
  });
  const html = renderLegacyHtml4Page('/b/a/board/c', {
    authenticated: true, username: 'alice', actionFields: () => ({}),
    page: { heading: 'Card', columns: ['Field', 'Value'], rows: [{ cells: [component, ''] }] },
  });
  assert.match(html, /<fieldset><legend>Location<\/legend>/);
  assert.match(html, /<label for="legacy-locationName-new-location-0">Location name<\/label>/);
  assert.match(html, /name="locationLatitude"[^>]*value="60\.1"/);
  assert.match(html, /<label for="legacy-dependencyType-new-location-2">Relation<\/label>/);
  assert.match(html, /<option value="blocks" selected>Blocks<\/option>/);
  assert.match(html, /name="legacyOperation" value="save-card-location"/);
  assert.equal((html.match(/name="locationName"/g) || []).length, 1);
  assert.equal((html.match(/name="locationLatitude"/g) || []).length, 1);
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

test('shared board creation component keeps title and permission in one semantic form', () => {
  const component = uiBoardCreateForm({
    action: '/allboards/remaining', titleLabel: 'Title', permissionLabel: 'Permissions',
    permissions: [{ value: 'private', label: 'Private' }],
    fields: { legacyOperation: 'create-board', boardType: 'board' }, submitLabel: 'Add Board',
  });
  const html = renderLegacyHtml4Page('/allboards/remaining', {
    authenticated: true, username: 'alice', actionFields: () => ({}),
    page: { heading: 'All Boards', columns: ['Board', 'Permissions'], rows: [{ cells: [component, ''] }] },
  });
  assert.match(html, /<fieldset><legend>Add Board<\/legend>/);
  assert.match(html, /name="boardTitle"[^>]*required/);
  assert.match(html, /name="boardPermission"/);
  assert.match(html, /name="legacyOperation" value="create-board"/);
  assert.equal((html.match(/name="boardTitle"/g) || []).length, 1);
  assert.equal((html.match(/name="boardPermission"/g) || []).length, 1);
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
  assert.match(multipart, /files: 1, fields: 40, parts: 41/);
  assert.match(multipart, /fileSize: MAX_MULTIPART_FILE_BYTES/);
  assert.match(multipart, /createWriteStream\(tempPath, \{ flags: 'wx', mode: 0o600 \}\)/);
  assert.match(multipart, /\['importFile', 'brandingImage'\]\.includes\(fieldName\) \|\| upload/);
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
  assert.match(pages, /query\.buildParams\(queryText, key => translate\(key\)\)/);
  assert.match(pages, /searchCardsPage\(/);
  assert.doesNotMatch(pages, /new RegExp\(escaped, 'i'\)/);
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

test('All Boards HTML4 mutations are signed, textual and share server boundaries', () => {
  const root = path.join(__dirname, '..');
  const pages = fs.readFileSync(path.join(root, 'server/lib/legacyHtml4Pages.js'), 'utf8');
  const request = fs.readFileSync(path.join(root, 'server/legacyHtml4.js'), 'utf8');
  for (const operation of ['toggle-board-star', 'toggle-default-board',
    'confirm-archive-board', 'archive-board', 'restore-board']) {
    assert.match(pages + request, new RegExp(operation));
  }
  assert.match(request, /boardListOperations\.includes\(requestFields\.legacyOperation\)/);
  assert.match(request, /DDP\._CurrentMethodInvocation\.withValue/);
  assert.match(pages, /confirmBoardArchive === board\._id/);
});

test('card details repeat board and assigned-only authorization scopes', () => {
  const pages = fs.readFileSync(path.join(__dirname, '..', 'server', 'lib',
    'legacyHtml4Pages.js'), 'utf8');
  assert.match(pages, /cardDetailsPage\(\s*board, segment\(cardMatch\[1\]\), userId, requestFields, translate/);
  assert.match(pages, /const assignedScope = assignedOnlyCardScope\(board, userId\)/);
  assert.match(pages, /\.\.\.boardCardScope\(board\)/);
  assert.match(pages, /deletedAt: null/);
  assert.match(pages, /Meteor\.users\.find\(\{ _id: \{ \$in: personIds \} \}/);
  assert.match(pages, /fields: \{ username: 1, 'profile\.fullname': 1 \}/);
  assert.match(pages, /const contentCardId = contentCard\?\._id \|\| card\._id/);
  assert.match(pages, /const contentBoardId = contentCard\?\.boardId \|\| card\.boardId/);
  assert.match(pages, /CardComments\.find\(\{ cardId: contentCardId, boardId: contentBoardId \}/);
  assert.match(pages, /ChecklistItems\.find\(\{ cardId: contentCardId, boardId: contentBoardId/);
  assert.match(pages, /Attachments\.collection\.find\(\{ 'meta\.cardId': contentCardId, 'meta\.boardId': contentBoardId \}/);
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

test('HTML4 card creation is labelled and keeps controls in natural tab order', () => {
  const html = renderLegacyHtml4Page('/b/board/slug', {
    authenticated: true, username: 'alice',
    actionFields: action => ({ legacySession: 'a'.repeat(48), authAction: action,
      authCounter: '1', authHash: 'b'.repeat(64) }),
    page: { heading: 'Board', columns: ['Content', 'Action'], rows: [{ rowHeader: false,
      cells: [uiTextForm({ action: '/b/board/slug', label: 'Card title', name: 'cardTitle',
        fields: { legacyOperation: 'create-card', listId: 'list' }, submitLabel: 'Add card' }),
      ''] }] },
  });
  assert.match(html, /<label for="legacy-cardTitle">Card title<\/label>/);
  assert.match(html, /name="cardTitle" type="text" maxlength="1000"/);
  assert.match(html, /name="legacyOperation" value="create-card"/);
  assert.ok(html.indexOf('name="cardTitle"') < html.indexOf('value="&gt; Add card"'));
  assert.doesNotMatch(html, /tabindex=/);
});

test('HTML4 card editing components remain labelled and keyboard ordered', () => {
  const html = renderLegacyHtml4Page('/b/board/slug/card', {
    authenticated: true, username: 'alice',
    actionFields: action => ({ legacySession: 'a'.repeat(48), authAction: action,
      authCounter: '1', authHash: 'b'.repeat(64) }),
    page: { heading: 'Card', columns: ['Card', 'Description'], rows: [
      { rowHeader: false, cells: [uiTextForm({ action: '/b/board/slug/card', label: 'Title',
        name: 'cardTitle', value: '<title>', fields: { legacyOperation: 'edit-card-title' },
        submitLabel: 'Save' }), ''] },
      { rowHeader: false, cells: [uiTextareaForm({ action: '/b/board/slug/card',
        label: 'Description', name: 'cardDescription', value: '<description>',
        fields: { legacyOperation: 'edit-card-description' }, submitLabel: 'Save' }), ''] },
      { rowHeader: false, cells: [uiSelectForm({ action: '/b/board/slug/card',
        label: 'List', name: 'cardListId', value: 'list-b', options: [
          { value: 'list-a', label: '<List A>' }, { value: 'list-b', label: 'List B' },
        ], fields: { legacyOperation: 'move-card-to-list' }, submitLabel: 'Move card to' }), ''] },
    ] },
  });
  assert.match(html, /<label for="legacy-cardTitle">Title<\/label>/);
  assert.match(html, /value="&lt;title&gt;"/);
  assert.match(html, /<label for="legacy-cardDescription">Description<\/label>/);
  assert.match(html, /&lt;description&gt;<\/textarea>/);
  assert.match(html, /<label for="legacy-cardListId">List<\/label>/);
  assert.match(html, /<option value="list-a">&lt;List A&gt;<\/option>/);
  assert.match(html, /<option value="list-b" selected>List B<\/option>/);
  assert.ok(html.indexOf('name="cardTitle"') < html.indexOf('name="cardDescription"'));
  assert.ok(html.indexOf('name="cardDescription"') < html.indexOf('name="cardListId"'));
  assert.doesNotMatch(html, /tabindex=/);
});

test('HTML4 card destination component exposes title, destination and position in order', () => {
  const html = renderLegacyHtml4Page('/b/board/slug/card', {
    authenticated: true, username: 'alice',
    actionFields: action => ({ legacySession: 'a'.repeat(48), authAction: action,
      authCounter: '1', authHash: 'b'.repeat(64) }),
    page: { heading: 'Card', columns: ['Card', 'Action'], rows: [{ rowHeader: false,
      cells: ['', uiCardDestinationForm({
        action: '/b/board/slug/card', titleLabel: 'Title', titleValue: '<Item>',
        destinationLabel: 'Destination', destinationValue: 'b|s|l|c',
        destinations: [{ value: 'b|s|l|', label: 'Board / Lane / List' },
          { value: 'b|s|l|c', label: '<Card>' }],
        positionLabel: 'Position', positions: [{ value: 'above', label: 'Above' },
          { value: 'below', label: 'Below' }],
        fields: { itemId: 'item-1', legacyOperation: 'convert-checklist-item-to-card' },
        submitLabel: 'Convert',
      })] }] },
  });
  assert.match(html, /for="legacy-cardTitle-item-1">Title<\/label>/);
  assert.match(html, /value="&lt;Item&gt;"/);
  assert.match(html, /for="legacy-cardDestination-item-1">Destination<\/label>/);
  assert.match(html, /<option value="b\|s\|l\|c" selected>&lt;Card&gt;<\/option>/);
  assert.match(html, /for="legacy-position-item-1">Position<\/label>/);
  assert.match(html, /name="legacyOperation" value="convert-checklist-item-to-card"/);
  assert.ok(html.indexOf('name="cardTitle"') < html.indexOf('name="cardDestination"'));
  assert.ok(html.indexOf('name="cardDestination"') < html.indexOf('name="position"'));
  assert.doesNotMatch(html, /tabindex=/);
});

test('HTML4 comment forms expose labelled add, edit and delete operations', () => {
  const html = renderLegacyHtml4Page('/b/board/slug/card', {
    authenticated: true, username: 'alice',
    actionFields: action => ({ legacySession: 'a'.repeat(48), authAction: action,
      authCounter: '1', authHash: 'b'.repeat(64) }),
    page: { heading: 'Card', columns: ['Card', 'Description'], rows: [
      { rowHeader: false, cells: [uiTextareaForm({ action: '/b/board/slug/card',
        label: 'Comment', name: 'commentText', id: 'newComment',
        fields: { legacyOperation: 'add-comment' },
        submitLabel: 'Comment' }), ''] },
      { rowHeader: false, cells: [uiTextareaForm({ action: '/b/board/slug/card',
        label: 'Comment', name: 'commentText', id: 'editComment-comment1', value: '<edit>',
        fields: { legacyOperation: 'edit-comment', commentId: 'comment-1' },
        submitLabel: 'Save' }), { component: 'action', action: '/b/board/slug/card',
        label: 'Delete', icon: 'remove',
        fields: { legacyOperation: 'confirm-delete-comment', commentId: 'comment-1' } }] },
      { rowHeader: false, cells: [uiTextareaForm({ action: '/b/board/slug/card',
        label: 'In reply to: Parent', name: 'commentText', id: 'replyComment-comment1',
        fields: { legacyOperation: 'add-comment', parentId: 'comment-1' },
        submitLabel: 'Reply' }), { component: 'action', action: '/b/board/slug/card',
        label: 'Reply', fields: { legacyOperation: 'start-comment-reply',
          commentId: 'comment-1' } }] },
    ] },
  });
  assert.match(html, /<label for="legacy-newComment">Comment<\/label>/);
  assert.match(html, /<label for="legacy-editComment-comment1">Comment<\/label>/);
  assert.match(html, /<label for="legacy-replyComment-comment1">In reply to: Parent<\/label>/);
  for (const operation of ['add-comment', 'edit-comment', 'confirm-delete-comment',
    'start-comment-reply']) {
    assert.match(html, new RegExp(`name="legacyOperation" value="${operation}"`));
  }
  assert.match(html, /&lt;edit&gt;<\/textarea>/);
  assert.match(html, /value="- Delete"/);
  assert.doesNotMatch(html, /tabindex=/);
  const pages = fs.readFileSync(path.join(__dirname, '..', 'server', 'lib',
    'legacyHtml4Pages.js'), 'utf8');
  assert.match(pages, /fields: \{ \.\.\.replyFields, legacyOperation: 'add-comment' \}/);
  assert.match(pages, /requestFields\.replyToComment === comment\._id/);
  assert.match(pages, /comment-in-reply-to/);
});

test('HTML4 checklist destinations are bounded, labelled and carry board plus card identity', () => {
  const pages = fs.readFileSync(path.join(__dirname, '..', 'server', 'lib',
    'legacyHtml4Pages.js'), 'utf8');
  assert.match(pages, /async function writableCardDestinationOptions\(userId\)/);
  assert.match(pages, /allowIsBoardMemberWithWriteAccess\(userId, candidateBoard\)/);
  assert.match(pages, /limit: 5000/);
  assert.match(pages, /value: `\$\{candidateBoard\._id\}\|\$\{candidateCard\._id\}`/);
  assert.match(pages, /value: `\$\{candidateBoard\._id\}\|\$\{swimlane\._id\}\|\$\{list\._id\}\|`/);
  assert.match(pages, /name: 'targetCardRef'[\s\S]*?legacyOperation: 'move-checklist-to-card'/);
  assert.match(pages, /name: 'targetCardRef'[\s\S]*?legacyOperation: 'copy-checklist-to-card'/);
  assert.match(pages, /uiCardDestinationForm\([\s\S]*?convert-checklist-item-to-card/);
});

test('HTML4 checklist export is a signed POST with the same formats and sections', () => {
  const component = uiExportForm({
    action: '/b/board/slug/card', label: 'Export',
    formats: ['pdf', 'xlsx', 'json', 'json-no-attachments', 'zip']
      .map(value => ({ value, label: value })),
    sections: [{ value: 'checklists', label: 'Checklists' }],
    fields: { boardId: 'board', cardId: 'card', checklistId: 'checklist',
      legacyOperation: 'export-checklist' },
  });
  const html = renderLegacyHtml4Page('/b/board/slug/card', {
    authenticated: true, username: 'alice',
    actionFields: (action, purpose) => ({ legacySession: 'a'.repeat(48), authAction: action,
      authCounter: '2', authHash: 'b'.repeat(64), authPurpose: purpose }),
    page: { heading: 'Card', columns: ['Card', 'Action'], rows: [{ cells: [component, ''] }] },
  });
  assert.match(html, /<form method="post" action="\/b\/board\/slug\/card">/);
  assert.match(html, /name="legacySession"/);
  assert.match(html, /name="authPurpose" value="download:checklist"/);
  assert.match(html, /name="legacyOperation" value="export-checklist"/);
  assert.match(html, /name="exportFields" type="checkbox" value="checklists" checked/);
  for (const format of ['pdf', 'xlsx', 'json', 'json-no-attachments', 'zip']) {
    assert.match(html, new RegExp(`value="${format}"`));
  }
  assert.doesNotMatch(html, /authToken=|legacySession=/);

  const root = path.join(__dirname, '..');
  const handler = fs.readFileSync(path.join(root, 'server', 'lib',
    'legacyHtml4ScopedExport.js'), 'utf8');
  assert.match(handler, /Checklists\.findOneAsync\(\{ _id: checklistId, boardId, cardId \}\)/);
  assert.match(handler, /!board\.isVisibleBy\(user\) \|\| !card \|\| !checklist/);
  assert.match(handler, /new ExporterBoardPDF/);
  assert.match(handler, /new ExporterExcelBoard/);
  assert.match(handler, /new ExporterZip/);
  assert.match(handler, /await exporter\.buildStream\(res\)/);
  const sessions = fs.readFileSync(path.join(root, 'server', 'lib',
    'legacyHtml4Session.js'), 'utf8');
  assert.match(sessions, /consumeLegacyHtml4DownloadSession/);
  assert.match(sessions, /consumedDownloads: \{ \$ne: supplied \}/);
  assert.match(sessions, /\$push: \{ consumedDownloads: supplied \}/);
  const middleware = fs.readFileSync(path.join(root, 'server', 'legacyHtml4.js'), 'utf8');
  assert.match(middleware,
    /legacyOperation === 'export-checklist'[\s\S]*consumeLegacyHtml4DownloadSession/);
});

test('HTML4 checklist import is bounded, scoped and uses the shared importer', () => {
  const root = path.join(__dirname, '..');
  const multipart = fs.readFileSync(path.join(root, 'server', 'lib',
    'legacyHtml4Multipart.js'), 'utf8');
  const imports = fs.readFileSync(path.join(root, 'server', 'lib',
    'legacyHtml4Imports.js'), 'utf8');
  const pages = fs.readFileSync(path.join(root, 'server', 'lib',
    'legacyHtml4Pages.js'), 'utf8');
  const jade = fs.readFileSync(path.join(root, 'client', 'components', 'boards',
    'exportScope.jade'), 'utf8');
  const checklistJs = fs.readFileSync(path.join(root, 'client', 'components', 'cards',
    'checklists.js'), 'utf8');
  assert.match(multipart, /\/\^\\\/b\\\/\[\^\/\]\+\\\/\[\^\/\]\+\\\/\[\^\/\]\+\$\//);
  assert.match(multipart, /name !== 'importField'/);
  assert.match(pages, /legacyOperation: 'import-checklist-file'/);
  assert.match(pages, /sections: BOARD_EXPORT_FIELDS\.map/);
  assert.match(imports,
    /Checklists\.findOneAsync\(\{\s*_id: target\.checklistId, boardId: target\.boardId, cardId: target\.cardId/);
  assert.match(imports, /allowIsBoardMemberWithWriteAccess\(userId, board\)/);
  assert.match(imports, /secureTransfer\(document/);
  assert.match(imports, /readWekanZipArchive\(upload\.tempPath/);
  assert.match(imports, /new ScopedImporter\(target, safeDocument/);
  assert.match(imports, /withDeadline\(importer\.run\(\)/);
  assert.match(jade, /template\(name="importChecklistPopup"\)/);
  assert.match(checklistJs,
    /'click \.js-import-checklist': Popup\.open\('importChecklist', \{ titleKey: 'import' \}\)/);
});

test('HTML4 attachments use separate signed POST preview and download controls', () => {
  const component = uiAttachment({
    name: 'report.png', type: 'image/png', size: 123,
    actions: [{
      action: '/b/board/slug/card', label: 'Preview',
      authPurpose: 'download:gif-attachment',
      fields: { legacyOperation: 'preview-attachment-gif', boardId: 'board',
        cardId: 'card', attachmentId: 'attachment' },
    }, {
      action: '/b/board/slug/card', label: 'Download', icon: 'move-down',
      authPurpose: 'download:original-attachment',
      fields: { legacyOperation: 'download-attachment-original', boardId: 'board',
        cardId: 'card', attachmentId: 'attachment' },
    }],
  });
  const html = renderLegacyHtml4Page('/b/board/slug/card', {
    authenticated: true, username: 'alice',
    actionFields: (action, purpose) => ({ legacySession: 'a'.repeat(48), authAction: action,
      authCounter: '2', authHash: 'b'.repeat(64), authPurpose: purpose }),
    page: { heading: 'Card', columns: ['Card', 'Action'], rows: [{ cells: ['Attachment', component] }] },
  });
  assert.match(html, /<strong>report\.png<\/strong> \(image\/png, 123 bytes\)/);
  assert.match(html, /name="authPurpose" value="download:gif-attachment"/);
  assert.match(html, /name="legacyOperation" value="preview-attachment-gif"/);
  assert.match(html, /name="authPurpose" value="download:original-attachment"/);
  assert.match(html, /name="legacyOperation" value="download-attachment-original"/);
  assert.doesNotMatch(html, /legacySession=|authHash=/);

  const root = path.join(__dirname, '..');
  const response = fs.readFileSync(path.join(root, 'server', 'lib',
    'legacyHtml4AttachmentResponse.js'), 'utf8');
  assert.match(response, /attachment\.meta\?\.boardId !== String\(boardId/);
  assert.match(response, /attachment\.meta\?\.cardId !== String\(cardId/);
  assert.match(response, /canReadBoard\(userId, board\)/);
  assert.match(response, /attachmentAsStoredGif/);
  assert.match(response, /correctedNameForStoredFile/);
  assert.match(response, /isStorageReadEnabled/);
  assert.match(response, /sanitizeDownloadFileName/);
  const sessions = fs.readFileSync(path.join(root, 'server', 'lib',
    'legacyHtml4Session.js'), 'utf8');
  assert.match(sessions, /purpose !== expectedPurpose/);
  assert.match(sessions, /consumedDownloads: \{ \$ne: supplied \}/);
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

test('global identity navigation spans every remaining semantic page column', () => {
  const html = renderLegacyHtml4Page('/admin/problems/recovery', {
    authenticated: true,
    username: 'administrator',
    isAdmin: true,
    actionFields: () => ({}),
    page: {
      heading: 'Recovery',
      columns: ['Done', 'Date', 'Event', 'User', 'Detail'],
      rows: [],
    },
  });
  assert.match(html,
    /<th scope="row">Username: administrator<\/th><td colspan="4">/);
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
