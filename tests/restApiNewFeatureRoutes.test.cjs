'use strict';

// The REST API endpoints added for features that shipped without one:
//
//   * attachment soft delete / restore / list-deleted (History.md §12) -
//     server/models/attachments.js, run through the SAME Meteor methods the
//     card and the card history use;
//   * Admin Panel / Problems - server/models/eventLog.js, through the same
//     admin-only eventLog* methods the Admin Panel pages call;
//   * the OAuth login provider and passwordless Admin Panel settings -
//     server/models/settings.js, which must NEVER return a provider's secret;
//   * the opened card's section order (Board Settings "card field order") -
//     server/models/boards.js;
//   * pausing a rule (`enabled`) over the rules API - server/models/rules.js.
//
// Each route is pinned to its method, path, JSDoc @operation block (what the
// OpenAPI generator reads) and an authentication check. The negative sweep at
// the end reads EVERY route in models/ and server/models/ and fails on one
// whose body has no authentication check at all, so a route cannot be added
// open by mistake - the fault is pinned as a shape, not at one call site.
//
// The generator itself is pinned too: server/models/boards.js has had a bare
// `catch {` since v11.67 and the esprima-based generator silently dropped the
// WHOLE Boards API from public/api/wekan.yml because of it; and a primitive
// array-element marker (`'wipLimitGroups.$.listIds.$'`) produced YAML no parser
// accepted. Both are reproduced here from the generator source and, when
// python3 + PyYAML are available, from the generated spec.
//
// Run: node tests/restApiNewFeatureRoutes.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('restApiNewFeatureRoutes:');

// Every route registration in a source, in order: { method, path, start }.
const ROUTE_RE = /WebApp\.handlers\.(get|post|put|delete)\(\s*\n?\s*'([^']+)'/g;
function routesOf(src) {
  const out = [];
  let m;
  while ((m = ROUTE_RE.exec(src))) out.push({ method: m[1], path: m[2], start: m.index });
  return out;
}
// The body of a route: from its registration to the next one (or EOF).
function bodyOf(src, route, all) {
  const next = all.find(r => r.start > route.start);
  return src.slice(route.start, next ? next.start : src.length);
}
// The JSDoc block that ends right before the route registration.
function jsdocBefore(src, route) {
  const head = src.slice(0, route.start);
  const open = head.lastIndexOf('/**');
  const close = head.lastIndexOf('*/');
  assert.ok(open !== -1 && close > open, `no JSDoc before ${route.method} ${route.path}`);
  assert.ok(/^\s*$/.test(head.slice(close + 2)), `JSDoc before ${route.method} ${route.path} is not adjacent`);
  return head.slice(open, close + 2);
}
const AUTH_RE = /Authentication\.check(UserId|LoggedIn|BoardAccess|BoardWriteAccess|BoardAdmin)\(/;

function pinRoute(file, method, routePath, operation, expectations = {}) {
  const src = read(file);
  const all = routesOf(src);
  const route = all.find(r => r.method === method && r.path === routePath);
  assert.ok(route, `${method.toUpperCase()} ${routePath} is registered in ${file}`);
  const doc = jsdocBefore(src, route);
  assert.ok(doc.includes(`@operation ${operation}`), `${routePath} JSDoc names @operation ${operation}`);
  assert.ok(/@summary /.test(doc), `${routePath} JSDoc has a @summary`);
  assert.ok(/@return_type /.test(doc), `${routePath} JSDoc has a @return_type`);
  const body = bodyOf(src, route, all);
  assert.match(body, AUTH_RE, `${routePath} checks authentication`);
  if (expectations.auth) assert.match(body, expectations.auth, `${routePath} uses the expected auth check`);
  if (expectations.body) for (const re of expectations.body) assert.match(body, re, `${routePath}: ${re}`);
  if (expectations.not) for (const re of expectations.not) assert.doesNotMatch(body, re, `${routePath} must not: ${re}`);
  return { doc, body };
}

// ---------------------------------------------------------------------------
// Attachments: soft delete, restore, list deleted
// ---------------------------------------------------------------------------

test('DELETE /api/boards/:boardId/attachments/:attachmentId soft-deletes through attachments.softDelete', () => {
  pinRoute('server/models/attachments.js', 'delete', '/api/boards/:boardId/attachments/:attachmentId',
    'delete_board_attachment', {
      auth: /Authentication\.checkLoggedIn\(req\.userId\)/,
      body: [/'attachments\.softDelete'/, /attachmentOfBoard\(req\.params\.attachmentId, req\.params\.boardId\)/],
      // Never a hard delete (History.md §12.3).
      not: [/removeAsync/, /\.remove\(/, /unlink/],
    });
});

test('POST /api/boards/:boardId/attachments/:attachmentId/restore restores through attachments.restore', () => {
  pinRoute('server/models/attachments.js', 'post', '/api/boards/:boardId/attachments/:attachmentId/restore',
    'restore_board_attachment', {
      auth: /Authentication\.checkLoggedIn\(req\.userId\)/,
      body: [/'attachments\.restore'/],
      not: [/removeAsync/],
    });
});

test('GET /api/boards/:boardId/attachments/deleted lists only soft-deleted attachments, board access required', () => {
  const { body } = pinRoute('server/models/attachments.js', 'get', '/api/boards/:boardId/attachments/deleted',
    'get_board_deleted_attachments', {
      auth: /Authentication\.checkBoardAccess\(req\.userId, paramBoardId\)/,
      body: [/deletedAt: \{ \$ne: null \}/, /'meta\.boardId': paramBoardId/],
    });
  assert.ok(/deletedAt: attachment\.deletedAt/.test(read('server/models/attachments.js')), 'rows say when');
  assert.ok(body.length > 0);
});

test('the attachment routes run the methods AS the request user (DDP invocation), and are loaded by the server', () => {
  const src = read('server/models/attachments.js');
  assert.match(src, /DDP\._CurrentMethodInvocation\.withValue\(\s*\{ userId \}/);
  assert.match(src, /Attachments\.collection\.findOneAsync\(\{\s*_id: attachmentId,\s*'meta\.boardId': boardId/,
    'an attachment is looked up by id AND board, so a board id cannot reach another board\'s file');
  assert.match(read('server/imports.js'), /import '\/server\/models\/attachments';/);
});

// ---------------------------------------------------------------------------
// Admin Panel / Problems
// ---------------------------------------------------------------------------

test('GET /api/admin/problems is admin-only and returns the Problems overview plus the new-problem counts', () => {
  pinRoute('server/models/eventLog.js', 'get', '/api/admin/problems', 'get_admin_problems', {
    auth: /await Authentication\.checkUserId\(req\.userId\)/,
    body: [/getProblemsOverview\(\)/, /'eventLogProblemAreas'/],
  });
});

test('GET /api/admin/problems/:stream is admin-only, validates the stream, pages through eventLogPage', () => {
  pinRoute('server/models/eventLog.js', 'get', '/api/admin/problems/:stream', 'get_admin_problem_stream', {
    auth: /await Authentication\.checkUserId\(req\.userId\)/,
    body: [/EVENT_STREAMS\.includes\(stream\)/, /'eventLogCount'/, /'eventLogPage'/, /code: 404/],
    // Never a raw collection read: the method's selector is the one the panel uses.
    not: [/EventLog\.find\(/],
  });
});

test('POST /api/admin/problems/:stream/acknowledge is admin-only and uses acknowledgeEventLog', () => {
  pinRoute('server/models/eventLog.js', 'post', '/api/admin/problems/:stream/acknowledge',
    'acknowledge_admin_problem_stream', {
      auth: /await Authentication\.checkUserId\(req\.userId\)/,
      body: [/'acknowledgeEventLog'/, /EVENT_STREAMS\.includes\(stream\)/],
    });
  assert.match(read('server/imports.js'), /import '\/server\/models\/eventLog';/);
});

// ---------------------------------------------------------------------------
// OAuth login providers and passwordless (Admin Panel / People / Login)
// ---------------------------------------------------------------------------

test('GET /api/admin/oauth-providers is admin-only and reports sources through getOauthProviderConfigSources', () => {
  pinRoute('server/models/settings.js', 'get', '/api/admin/oauth-providers', 'get_oauth_provider_settings', {
    auth: /await Authentication\.checkUserId\(req\.userId\)/,
    body: [/'getOauthProviderConfigSources'/],
  });
});

test('PUT /api/admin/oauth-providers/:providerKey is admin-only, validates the key, saves through saveOauthProviderSettings', () => {
  pinRoute('server/models/settings.js', 'put', '/api/admin/oauth-providers/:providerKey',
    'update_oauth_provider_settings', {
      auth: /await Authentication\.checkUserId\(req\.userId\)/,
      body: [/oauthProviderCatalog\(\)\.some\(p => p\.key === providerKey\)/, /'saveOauthProviderSettings'/, /code: 404/],
    });
});

test('PUT /api/admin/passwordless is admin-only and saves through savePasswordlessSettings', () => {
  pinRoute('server/models/settings.js', 'put', '/api/admin/passwordless', 'update_passwordless_settings', {
    auth: /await Authentication\.checkUserId\(req\.userId\)/,
    body: [/'savePasswordlessSettings'/, /enabled: body\.enabled === true/],
  });
});

test('the OAuth endpoints never expose a secret: only hasValue/source leaves the server (negative)', () => {
  const src = read('server/models/settings.js');
  const all = routesOf(src);
  for (const p of ['/api/admin/oauth-providers', '/api/admin/oauth-providers/:providerKey', '/api/admin/passwordless']) {
    for (const route of all.filter(r => r.path === p)) {
      // The code only - the next route's JSDoc (prose about the secret) is not it.
      const body = bodyOf(src, route, all).replace(/\/\*\*[\s\S]*?\*\//g, '');
      // The word `secret` may appear only as the INPUT key list the PUT accepts.
      const mentions = body.match(/secret/gi) || [];
      const allowed = body.match(/'secret'/g) || [];
      assert.strictEqual(mentions.length, allowed.length,
        `${route.method} ${p} mentions "secret" outside the input whitelist`);
      assert.doesNotMatch(body, /oauthProviders\.[^\s]*\.secret\b/);
      assert.doesNotMatch(body, /setting\.oauthProviders/);
      assert.doesNotMatch(body, /Settings\.findOneAsync/);
    }
  }
  // The method every one of them answers from reports the secret as hasValue only.
  const at = src.indexOf('async getOauthProviderConfigSources()');
  const method = src.slice(at, src.indexOf('async setPermanentDeleteEnabled', at));
  assert.match(method, /secret: \{ source: secret\.source, hasValue: secret\.hasValue \}/);
  assert.doesNotMatch(method, /secret: \{[^}]*value: secret\.value/);
  // And the documented response shape has no secret field either.
  const doc = jsdocBefore(src, all.find(r => r.path === '/api/admin/oauth-providers'));
  assert.doesNotMatch(doc, /@return_type[^\n]*secret/);
});

// ---------------------------------------------------------------------------
// Card field order (Board Settings)
// ---------------------------------------------------------------------------

test('GET /api/boards/:boardId/cardFieldOrder needs board access and returns the normalised order', () => {
  pinRoute('server/models/boards.js', 'get', '/api/boards/:boardId/cardFieldOrder', 'get_board_card_field_order', {
    auth: /Authentication\.checkBoardAccess\(req\.userId, paramBoardId\)/,
    body: [/applyCardFieldOrder\(board\.cardFieldOrder\)/, /CARD_FIELD_ORDER_KEYS/],
  });
});

test('PUT /api/boards/:boardId/cardFieldOrder needs board admin, normalises through applyCardFieldOrder', () => {
  pinRoute('server/models/boards.js', 'put', '/api/boards/:boardId/cardFieldOrder', 'update_board_card_field_order', {
    auth: /Authentication\.checkBoardAdmin\(req\.userId, paramBoardId\)/,
    body: [/applyCardFieldOrder\(order\)/, /\$set: \{ cardFieldOrder \}/, /code: 400/],
    // The raw request array is never stored as-is.
    not: [/\$set: \{ cardFieldOrder: order \}/, /\$set: \{ cardFieldOrder: req\.body/],
  });
  // The helper it relies on drops unknown keys and appends missing ones.
  const { applyCardFieldOrder, DEFAULT_CARD_FIELD_ORDER } = require('../models/lib/cardFieldOrder');
  // Eight sections since Board Settings / Card orders per field: Dependencies,
  // Sort and Vote/Poker are sections of their own (models/lib/cardFieldOrder.js).
  assert.deepStrictEqual(applyCardFieldOrder(['description', 'bogus', 'labels', 'labels']),
    ['description', 'labels', 'dates', 'members', 'dependencies', 'sort', 'customFields', 'voteAndPoker']);
  assert.deepStrictEqual(applyCardFieldOrder(undefined), DEFAULT_CARD_FIELD_ORDER);
});

// ---------------------------------------------------------------------------
// Card Settings (Board Settings): the pre-existing routes now carry the
// @operation block the OpenAPI generator reads.
// ---------------------------------------------------------------------------

test('GET /api/boards/:boardId/cardSettings has an @operation block and needs board access', () => {
  pinRoute('server/models/boards.js', 'get', '/api/boards/:boardId/cardSettings', 'get_board_card_settings', {
    auth: /Authentication\.checkBoardAccess\(req\.userId, id\)/,
    body: [/BOARD_CARD_SETTING_KEYS\.forEach/, /BOARD_CARD_NUMERIC_SETTING_KEYS\.forEach/],
  });
});

test('PUT /api/boards/:boardId/cardSettings has an @operation block and needs board write access', () => {
  const { doc } = pinRoute('server/models/boards.js', 'put', '/api/boards/:boardId/cardSettings',
    'update_board_card_settings', {
      auth: /Authentication\.checkBoardWriteAccess\(req\.userId, id\)/,
      body: [/code: 400/, /toBool\(req\.body\[key\]\)/],
    });
  assert.match(doc, /@param \{number\} \[cardAgingDays1\]/);
});

// ---------------------------------------------------------------------------
// Board View settings (Board Settings / Board View)
// ---------------------------------------------------------------------------

test('GET /api/boards/:boardId/boardViewSettings needs board access and answers the normalised snapshot', () => {
  pinRoute('server/models/boards.js', 'get', '/api/boards/:boardId/boardViewSettings', 'get_board_view_settings', {
    auth: /Authentication\.checkBoardAccess\(req\.userId, paramBoardId\)/,
    body: [/boardViewSettingsSnapshot\(board\)/, /code: 404/],
    // The raw document fields are never handed out un-normalised.
    not: [/data: board\.boardViewSettings/, /boardViewOrder: board\.boardViewOrder/],
  });
});

test('PUT /api/boards/:boardId/boardViewSettings needs board admin, writes only the pure helper\'s $set', () => {
  pinRoute('server/models/boards.js', 'put', '/api/boards/:boardId/boardViewSettings', 'update_board_view_settings', {
    auth: /Authentication\.checkBoardAdmin\(req\.userId, paramBoardId\)/,
    body: [/boardViewSettingsRequest\(board, input\)/, /\$set: result\.\$set/, /code: 400/,
      /boardViewSettingsSnapshot\(updated\)/],
    // Nothing from the request body reaches the database directly.
    not: [/\$set: req\.body/, /\$set: input/, /\$set: \{ boardViewSettings: /],
  });
});

test('boardViewSettingsSnapshot lists every view once, both sides explicit, defaults resolved, order whole', () => {
  const m = require('../models/lib/boardViewSettings');
  const snap = m.boardViewSettingsSnapshot({
    boardViewSettings: { 'board-view-table': { showOnPublic: false } },
    defaultPublicBoardView: 'board-view-lists',
    defaultPrivateBoardView: 'not-a-view',
    boardViewOrder: ['board-view-gantt', 'bogus', 'board-view-gantt'],
  });
  assert.deepStrictEqual(Object.keys(snap.boardViewSettings), m.DEFAULT_BOARD_VIEW_ORDER);
  assert.deepStrictEqual(snap.boardViewSettings['board-view-table'], { showOnPublic: false, showOnPrivate: true });
  assert.deepStrictEqual(snap.boardViewSettings['board-view-swimlanes'], { showOnPublic: true, showOnPrivate: true });
  assert.strictEqual(snap.defaultPublicBoardView, 'board-view-lists');
  assert.strictEqual(snap.defaultPrivateBoardView, m.DEFAULT_BOARD_VIEW, 'an unknown default reads as Swimlanes');
  assert.strictEqual(snap.boardViewOrder[0], 'board-view-gantt');
  assert.strictEqual(snap.boardViewOrder.length, m.BOARD_VIEWS.length);
  assert.ok(!snap.boardViewOrder.includes('bogus'));
  assert.deepStrictEqual(snap.keys, m.DEFAULT_BOARD_VIEW_ORDER);
  // A board that never opened the popup: everything shown, Swimlanes both sides.
  const fresh = m.boardViewSettingsSnapshot({});
  assert.ok(Object.values(fresh.boardViewSettings).every(e => e.showOnPublic && e.showOnPrivate));
  assert.strictEqual(fresh.defaultPublicBoardView, m.DEFAULT_BOARD_VIEW);
});

test('boardViewSettingsRequest applies the popup\'s modifiers: a default is always shown, order normalised', () => {
  const m = require('../models/lib/boardViewSettings');
  const board = { boardViewSettings: {}, defaultPublicBoardView: 'board-view-swimlanes' };
  // Setting a default also shows it on that side (defaultBoardViewModifier).
  let r = m.boardViewSettingsRequest(board, { defaultPublicBoardView: 'board-view-lists' });
  assert.deepStrictEqual(r, { $set: {
    defaultPublicBoardView: 'board-view-lists',
    'boardViewSettings.board-view-lists.showOnPublic': true,
  } });
  // One request may move the default AND hide the old one: defaults first.
  r = m.boardViewSettingsRequest(board, {
    defaultPublicBoardView: 'board-view-lists',
    boardViewSettings: { 'board-view-swimlanes': { showOnPublic: false, showOnPrivate: 'true' } },
  });
  assert.strictEqual(r.$set['boardViewSettings.board-view-swimlanes.showOnPublic'], false);
  assert.strictEqual(r.$set['boardViewSettings.board-view-swimlanes.showOnPrivate'], true);
  // Order: normalised, so every view exactly once with the given ones first.
  r = m.boardViewSettingsRequest(board, { boardViewOrder: ['board-view-table', 'board-view-table'] });
  assert.strictEqual(r.$set.boardViewOrder[0], 'board-view-table');
  assert.strictEqual(r.$set.boardViewOrder.length, m.BOARD_VIEWS.length);
  assert.strictEqual(new Set(r.$set.boardViewOrder).size, m.BOARD_VIEWS.length);
  // Nothing recognised: an empty $set (the route turns that into a 400).
  assert.deepStrictEqual(m.boardViewSettingsRequest(board, { unrelated: 1 }), { $set: {} });
  // The input board is not mutated.
  assert.deepStrictEqual(board, { boardViewSettings: {}, defaultPublicBoardView: 'board-view-swimlanes' });
});

test('boardViewSettingsRequest refuses an unknown view key, and hiding a side\'s default (negative)', () => {
  const m = require('../models/lib/boardViewSettings');
  const board = { boardViewSettings: {}, defaultPublicBoardView: 'board-view-swimlanes' };
  const refused = [
    { boardViewOrder: ['board-view-lists', 'board-view-bogus'] },
    { boardViewSettings: { 'board-view-bogus': { showOnPublic: false } } },
    { defaultPublicBoardView: 'board-view-bogus' },
    { defaultPrivateBoardView: 42 },
    { boardViewSettings: { 'board-view-swimlanes': { showOnPublic: false } } }, // the public default
    { boardViewSettings: { 'board-view-swimlanes': { showOnPrivate: false } } }, // the private default (missing = Swimlanes)
    { boardViewOrder: 'board-view-lists' },
    { boardViewSettings: ['board-view-lists'] },
    { boardViewSettings: { 'board-view-lists': 'no' } },
  ];
  for (const input of refused) {
    const r = m.boardViewSettingsRequest(board, input);
    assert.ok(r.error && !r.$set, `refused: ${JSON.stringify(input)} -> ${JSON.stringify(r)}`);
  }
  assert.match(m.boardViewSettingsRequest(board, { boardViewOrder: ['x'] }).error, /unknown board view "x"/);
  assert.match(m.boardViewSettingsRequest(board, { boardViewSettings: { 'board-view-swimlanes': { showOnPublic: false } } }).error,
    /cannot hide the public default view/);
  assert.ok(m.boardViewSettingsRequest(board, null).error);
  assert.ok(m.boardViewSettingsRequest(board, []).error);
  // A refusal is whole: the valid part of a partly-invalid body is not applied either.
  const r = m.boardViewSettingsRequest(board, { defaultPublicBoardView: 'board-view-lists', boardViewOrder: ['nope'] });
  assert.ok(r.error && !r.$set);
  // Hiding a view that is NOT the default on that side is fine.
  assert.ok(!m.boardViewSettingsRequest(board, { boardViewSettings: { 'board-view-lists': { showOnPublic: false } } }).error);
});

// ---------------------------------------------------------------------------
// Rules: enabled
// ---------------------------------------------------------------------------

test('PUT /api/boards/:boardId/rules/:ruleId accepts enabled, and GET reports it', () => {
  const src = read('server/models/rules.js');
  const all = routesOf(src);
  const put = all.find(r => r.method === 'put' && r.path === '/api/boards/:boardId/rules/:ruleId');
  assert.ok(put);
  const body = bodyOf(src, put, all);
  assert.match(body, /req\.body\.enabled !== undefined/);
  assert.match(body, /\$set: \{ enabled \}/);
  assert.match(jsdocBefore(src, put), /@param \{boolean\} \[enabled\]/);
  assert.match(src, /enabled: rule\.enabled !== false,/, 'serializeRule reports enabled');
  // A paused rule really is skipped by the engine (negative: not just stored).
  assert.match(read('server/rulesHelper.js'), /rule\.enabled !== false/);
});

// ---------------------------------------------------------------------------
// Negative sweep: no route anywhere without an authentication check
// ---------------------------------------------------------------------------

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.js')) out.push(p);
  }
  return out;
}

// Routes whose body delegates to a shared handler; the handler is checked instead.
const DELEGATED = { cardMemberFieldHandler: 'server/models/cards.js' };
// Routes that are open by design: the login/registration entry points.
const OPEN_BY_DESIGN = new Set(['/users/login', '/users/register', '/users/logout']);

test('every /api route in models/ and server/models/ checks authentication (negative sweep)', () => {
  const files = [...walk(path.join(ROOT, 'models'), []), ...walk(path.join(ROOT, 'server/models'), [])];
  let checked = 0;
  const open = [];
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    const all = routesOf(src);
    for (const route of all) {
      if (OPEN_BY_DESIGN.has(route.path)) continue;
      const body = bodyOf(src, route, all);
      checked += 1;
      const hasAuth = /Authentication\.check|req\.userId|authenticate\(req|checkAdminOrCondition/.test(body);
      const delegate = Object.keys(DELEGATED).find(fn => body.includes(`await ${fn}(req, res`));
      if (hasAuth) continue;
      if (delegate) {
        const handler = read(DELEGATED[delegate]);
        const at = handler.indexOf(`async function ${delegate}(`);
        assert.ok(at !== -1, `${delegate} exists`);
        assert.match(handler.slice(at, at + 2000), /Authentication\.check|req\.userId/, `${delegate} checks auth`);
        continue;
      }
      open.push(`${route.method.toUpperCase()} ${route.path} (${path.relative(ROOT, file)})`);
    }
  }
  assert.ok(checked > 100, `swept ${checked} routes`);
  assert.deepStrictEqual(open, [], 'routes with no authentication check');
});

// ---------------------------------------------------------------------------
// The OpenAPI generator: bare catch, for await, primitive array markers
// ---------------------------------------------------------------------------

test('the generator downlevels `catch {` and `for await (` so a route file with them is not dropped', () => {
  const gen = read('openapi/generate_openapi.py');
  const at = gen.indexOf('def downlevel_js(');
  const body = gen.slice(at, gen.indexOf('\nclass Context', at));
  assert.match(body, /re\.sub\(r'\\bcatch\\s\*\\\{', 'catch \(_\) \{', data\)/);
  assert.match(body, /re\.sub\(r'\\bfor\\s\+await\\s\*\\\(', 'for \(', data\)/);
  // The case is real: the Boards route file uses both constructs' first one.
  assert.match(read('server/models/boards.js'), /\} catch \{/);
  // A parse failure is no longer silent.
  assert.match(gen, /logger\.warning\('%s: cannot parse, its schema and routes are skipped: %s', path, e\)/);
});

test('a primitive array-element marker (listIds.$) emits no empty sub-schema', () => {
  const gen = read('openapi/generate_openapi.py');
  const at = gen.indexOf("if name.endswith('$'):");
  const branch = gen.slice(at, gen.indexOf("elif '$' in name:", at));
  assert.match(branch, /if self\.type != 'object':\s*\n\s*return current_schema/);
  assert.match(read('models/boards.js'), /'wipLimitGroups\.\$\.listIds\.\$': \{\s*type: String/);
});

test('the generated spec parses and carries the Boards API and every new operation (python3 + PyYAML, when available)', () => {
  const python = spawnSync('python3', ['-c', 'import yaml, esprima'], { encoding: 'utf8' });
  if (python.status !== 0) {
    console.log('    (python3 with PyYAML and esprima not available here - skipped; CI has them)');
    return;
  }
  const outDir = path.join(ROOT, '.tools', 'tmp', 'openapi-test');
  fs.mkdirSync(outDir, { recursive: true });
  const yml = path.join(outDir, 'wekan-routes.yml');
  const gen = spawnSync('python3', ['openapi/generate_openapi.py', '--release', 'vtest', 'models', 'server/models'],
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  assert.strictEqual(gen.status, 0, `generator failed: ${gen.stderr.slice(0, 500)}`);
  fs.writeFileSync(yml, gen.stdout);
  assert.doesNotMatch(gen.stderr, /server\/models\/boards\.js: cannot parse/);
  const check = spawnSync('python3', ['-c', [
    'import sys, yaml',
    `d = yaml.safe_load(open(${JSON.stringify(yml)}))`,
    'ops = set()',
    "for p, methods in d['paths'].items():",
    "    for m, op in methods.items():",
    "        if isinstance(op, dict) and 'operationId' in op: ops.add(op['operationId'])",
    "need = ['get_board_domains', 'get_board', 'delete_board_attachment', 'restore_board_attachment',",
    "        'get_board_deleted_attachments', 'get_admin_problems', 'get_admin_problem_stream',",
    "        'acknowledge_admin_problem_stream', 'get_oauth_provider_settings',",
    "        'update_oauth_provider_settings', 'update_passwordless_settings',",
    "        'get_board_card_field_order', 'update_board_card_field_order',",
    "        'get_board_card_settings', 'update_board_card_settings',",
    "        'get_board_view_settings', 'update_board_view_settings']",
    "missing = [n for n in need if n not in ops]",
    "assert not missing, missing",
    "# The card settings pair used to be hand-written in openapi/extra_paths.yml",
    "# as well; a second copy would be a duplicate operationId (negative).",
    "from collections import Counter",
    "counts = Counter(op['operationId'] for p in d['paths'].values() for op in p.values() if isinstance(op, dict) and 'operationId' in op)",
    "dup = [n for n in need[-4:] if counts[n] != 1]",
    "assert not dup, 'duplicate operationId: %s' % dup",
    "assert 'edit_board_card_settings' not in counts",
    "assert 'Boards' in d['definitions'], 'Boards schema'",
    "print('ok', len(ops))",
  ].join('\n')], { encoding: 'utf8' });
  assert.strictEqual(check.status, 0, `generated spec check failed: ${check.stderr.slice(0, 800)}`);
  assert.ok(/^ok \d+/.test(check.stdout.trim()));
});

test('the committed public/api/wekan.yml carries the Boards API and the new operations', () => {
  const yml = read('public/api/wekan.yml');
  for (const op of ['get_board_domains', 'delete_board_attachment', 'restore_board_attachment',
    'get_board_deleted_attachments', 'get_admin_problems', 'get_admin_problem_stream',
    'acknowledge_admin_problem_stream', 'get_oauth_provider_settings', 'update_oauth_provider_settings',
    'update_passwordless_settings', 'get_board_card_field_order', 'update_board_card_field_order',
    'get_board_card_settings', 'update_board_card_settings',
    'get_board_view_settings', 'update_board_view_settings']) {
    assert.ok(yml.includes(`operationId: ${op}`), `public/api/wekan.yml has ${op}`);
  }
  // The card settings routes carry their own @operation now; the hand-written
  // duplicate that openapi/extra_paths.yml used to hold is gone (negative).
  assert.strictEqual((yml.match(/operationId: get_board_card_settings\n/g) || []).length, 1);
  assert.ok(!yml.includes('operationId: edit_board_card_settings'));
  assert.ok(!read('openapi/extra_paths.yml').includes('cardSettings'));
  assert.ok(!/^  \w+\$\w+:\n    type: object\n      /m.test(yml), 'no empty $-sub-schema followed by a bare mapping');
});

console.log(`\nrestApiNewFeatureRoutes: ${passed} tests passed`);
