'use strict';

// Wiring and safety contract for the in-app MCP tab and standalone MCP server.
// Run: node tests/wekanMcpWorkManagement.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const server = read('tools/ai-systems-mcp/server.py');
const readme = read('tools/ai-systems-mcp/README.md');
const {
  MCP_KEY_PREFIX,
  hashMcpApiKey,
  normalizeMcpKeyName,
  expiryDate,
  publicMcpApiKey,
} = require('../models/lib/mcpApiKeys');
const {
  mcpUsageDateKey,
  normalizeMcpDailyCreateLimit,
  sumMcpUsageCounters,
} = require('../models/lib/mcpUsage');

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test('the authenticated MCP tab is reachable from the member menu', () => {
  const router = read('config/router.js');
  const menu = read('client/components/users/userHeader.jade');
  assert.match(router, /FlowRouter\.route\('\/mcp'/);
  assert.match(
    router,
    /FlowRouter\.route\('\/mcp',[\s\S]*?triggersEnter: \[ensureSignedInUnlessSandstorm\]/,
  );
  assert.match(menu, /pathFor 'mcp'/);
  assert.match(menu, /js-mcp-hub/);
});

test('the MCP template, logic, and styles are registered in the client bundle', () => {
  const imports = read('client/features/main.js');
  for (const extension of ['jade', 'js', 'css']) {
    assert.ok(
      imports.includes(`/client/components/main/mcpHub.${extension}`),
      `mcpHub.${extension} must be imported`,
    );
  }
  assert.match(read('models/lib/pageTitles.js'), /mcp: 'mcp-hub'/);
});

test('public runtime configuration exposes only endpoint metadata', () => {
  const config = read('server/mcpPublicConfig.js');
  assert.match(config, /process\.env\.MCP_PUBLIC_URL/);
  assert.match(config, /\['http:', 'https:'\]/);
  assert.match(config, /Meteor\.settings\.public\.mcp/);
  assert.doesNotMatch(config, /WEKAN_(API_TOKEN|PASSWORD|USERNAME|EMAIL|USER_ID)/);

  const client = read('client/components/main/mcpHub.js');
  assert.match(client, /Meteor\.settings\?\.public\?\.mcp/);
  assert.match(client, /'x-api-key': apiKey/);
  assert.match(client, /'<YOUR_MCP_API_KEY>'/);
  assert.match(client, /template\.selectedKeyId\.set\(result\.key\._id\)/);
  assert.match(client, /template\.configApiKey\.set\(result\.apiKey\)/);
  assert.doesNotMatch(client, /WEKAN_(API_TOKEN|PASSWORD|USERNAME|EMAIL|USER_ID)/);

  const compose = read('docker-compose.yml');
  assert.match(compose, /MCP_PUBLIC_URL=\$\{MCP_PUBLIC_URL:-\}/);
});

test('MCP API key values are prefixed, normalized, hashed, and expire', () => {
  assert.equal(MCP_KEY_PREFIX, 'wk_mcp_');
  assert.equal(normalizeMcpKeyName('  Claude   Desktop  '), 'Claude Desktop');
  assert.equal(hashMcpApiKey('secret').length, 64);
  assert.notEqual(hashMcpApiKey('secret'), 'secret');
  assert.equal(
    expiryDate(30, new Date('2026-09-01T00:00:00.000Z')).toISOString(),
    '2026-10-01T00:00:00.000Z',
  );
  assert.equal(expiryDate(7), null);
});

test('public key records never return hashes or raw secrets', () => {
  const visible = publicMcpApiKey({
    _id: 'key1',
    name: 'Agent',
    prefix: 'wk_mcp_12345678',
    keyHash: 'do-not-return',
    apiKey: 'do-not-return-either',
    scopes: ['mcp-tools:call'],
    createdAt: new Date(),
    expiresAt: new Date(),
  });
  assert.equal(visible.keyHash, undefined);
  assert.equal(visible.apiKey, undefined);
  assert.equal(visible.prefix, 'wk_mcp_12345678');
});

test('signed-in users can create, list, and revoke only their own MCP keys', () => {
  const methods = read('server/mcpApiKeys.js');
  const service = read('server/lib/mcpApiKeys.js');
  assert.match(methods, /'mcpApiKeys\.list'/);
  assert.match(methods, /'mcpApiKeys\.create'/);
  assert.match(methods, /'mcpApiKeys\.revoke'/);
  assert.match(methods, /\{ _id: keyId, userId: this\.userId, revokedAt: null \}/);
  assert.match(service, /keyHash: hashMcpApiKey\(apiKey\)/);
  assert.doesNotMatch(service, /apiKey,\s*prefix:/);
});

test('MCP usage dates, counters, and daily limits are deterministic', () => {
  assert.equal(
    mcpUsageDateKey(new Date('2026-08-31T17:00:00.000Z')),
    '2026-09-01',
  );
  assert.equal(normalizeMcpDailyCreateLimit('250'), 250);
  assert.equal(normalizeMcpDailyCreateLimit(), null);
  assert.equal(normalizeMcpDailyCreateLimit(''), null);
  assert.equal(normalizeMcpDailyCreateLimit('0'), null);
  assert.equal(normalizeMcpDailyCreateLimit('invalid'), null);
  assert.deepEqual(sumMcpUsageCounters([
    { toolCallTotal: 3, downloadTotal: 2, createRequested: 1, createSuccess: 1 },
    { toolCallTotal: 4, downloadTotal: 1, createRequested: 2, createFailed: 2 },
  ]), {
    toolCallTotal: 7,
    downloadTotal: 3,
    createRequested: 3,
    createSuccess: 1,
    createFailed: 2,
  });
});

test('usage tracking is unlimited by default and atomically enforces an optional quota', () => {
  const usageRoutes = read('server/mcpUsage.js');
  const usageService = read('server/lib/mcpUsage.js');
  const template = read('client/components/main/mcpHub.jade');
  assert.match(usageRoutes, /'mcpUsage\.summary'/);
  assert.match(usageRoutes, /\/api\/mcp\/usage\/event/);
  assert.match(usageRoutes, /req\.mcpApiKeyId/);
  assert.match(usageService, /if \(limit === null\)/);
  assert.match(usageService, /createRequested: \{ \$lt: limit \}/);
  assert.match(usageService, /mcp-daily-create-limit-reached/);
  assert.match(server, /client\.record_usage\(tool, action, "requested"\)/);
  assert.match(server, /client\.record_usage\(tool, action, "success"\)/);
  assert.match(server, /client\.record_usage\(tool, action, "failed"\)/);
  assert.match(template, /mcp-usage-dashboard/);
  assert.match(template, /usageProgressStyle/);
});

test('x-api-key authentication resolves to a user without replacing login auth', () => {
  const middleware = read('server/apiMiddleware.js');
  const routes = read('server/mcpApiKeys.js');
  assert.match(middleware, /req\.headers\['x-api-key'\]/);
  assert.match(middleware, /verifyMcpApiKey\(apiKey\)/);
  assert.match(middleware, /req\.mcpApiKeyId = verified\.keyId/);
  assert.match(middleware, /req\.method === 'DELETE'/);
  assert.match(middleware, /MCP API key operation not permitted/);
  assert.match(middleware, /if \(req\.authToken && !req\.userId\)/);
  assert.match(routes, /WebApp\.handlers\.get\('\/api\/mcp\/whoami'/);
});

test('the UI explains sprint and task mappings without exposing credentials', () => {
  const template = read('client/components/main/mcpHub.jade');
  const english = read('imports/i18n/data/en.i18n.json');
  const vietnamese = read('imports/i18n/data/vi.i18n.json');
  for (const key of ['mcp-sprints', 'mcp-tasks', 'mcp-cards', 'mcp-security']) {
    assert.ok(template.includes(`'${key}'`));
    assert.ok(english.includes(`"${key}"`));
    assert.ok(vietnamese.includes(`"${key}"`));
  }
  assert.match(english, /Use swimlanes as sprints/);
  assert.match(english, /Use checklist items as tasks/);
  assert.match(template, /js-select-mcp-key/);
  assert.match(template, /js-mcp-config-key/);
  assert.match(english, /stays in this browser tab and is not sent to the server/);
});

test('MCP exposes sprint tools backed by board-scoped swimlane routes', () => {
  for (const tool of ['list_sprints', 'get_sprint', 'create_sprint', 'update_sprint']) {
    assert.match(server, new RegExp(`async def ${tool}\\(`));
  }
  assert.match(server, /list_sprints[\s\S]*?\/api\/boards\/\{board_path\}\/swimlanes/);
  assert.match(server, /create_sprint[\s\S]*?"POST"[\s\S]*?\/swimlanes/);
  assert.match(server, /update_sprint[\s\S]*?"PUT"[\s\S]*?\/swimlanes\/\{sprint_path\}/);
});

test('MCP exposes checklist tasks and card update tools', () => {
  for (const tool of [
    'get_card',
    'update_card',
    'list_checklists',
    'create_checklist',
    'list_tasks',
    'create_task',
    'update_task',
  ]) {
    assert.match(server, new RegExp(`async def ${tool}\\(`));
  }
  assert.match(server, /"wekan_mapping": "checklist-item"/);
  assert.match(server, /"swimlaneId": sprint_id/);
  assert.match(server, /"listId": destination_list_id/);
});

test('HTTP MCP calls require a user key and enforce the manifest rate limit', () => {
  assert.match(server, /ctx\.headers/);
  assert.match(server, /headers\.get\("x-api-key"\)/);
  assert.match(server, /MCP_RATE_LIMIT_PER_MINUTE = 60/);
  assert.match(server, /"x-api-key": api_key/);
  assert.match(server, /\/api\/mcp\/whoami/);
  assert.match(server, /Missing MCP API key in x-api-key or Authorization header/);
});

test('write tools validate every id interpolated into a REST path', () => {
  for (const [value, label] of [
    ['sprint_id', 'sprint_id'],
    ['card_id', 'card_id'],
    ['checklist_id', 'checklist_id'],
    ['task_id', 'task_id'],
  ]) {
    assert.ok(
      server.includes(`_resource_id(${value}, "${label}")`),
      `${label} must use _resource_id`,
    );
  }
});

test('destructive delete tools stay outside the MCP contract', () => {
  assert.doesNotMatch(server, /async def delete_(sprint|task|card|board|list)\(/);
  assert.match(readme, /khong expose tool xoa/);
});

test('the Python MCP server parses successfully', () => {
  const result = spawnSync('python3', [
    '-m',
    'py_compile',
    path.join(root, 'tools/ai-systems-mcp/server.py'),
  ], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

let failed = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    console.log(`  ok - ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  not ok - ${name}`);
    console.error(error.stack || error);
  }
}

console.log(`\nwekan MCP work management: ${tests.length - failed}/${tests.length} passed`);
if (failed) process.exitCode = 1;
