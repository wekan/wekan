'use strict';

// The WeKan REST endpoint GET /api/boards lists public boards only. The MCP
// list_boards tool is for the authenticated user's visible boards, including
// private boards, so it must call /api/users/:userId/boards instead.
//
// Run: node tests/wekanMcpBoardsEndpoint.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const server = read('tools/ai-systems-mcp/server.py');
const boardsModel = read('server/models/boards.js');
const readme = read('tools/ai-systems-mcp/README.md');

test('WeKan /api/boards is public-only in the app source', () => {
  assert.ok(
    /WebApp\.handlers\.get\('\/api\/boards'[\s\S]*?\{ permission: 'public' \}/
      .test(boardsModel),
    'the app route still lists public boards only',
  );
});

test('MCP list_boards uses the authenticated user boards endpoint', () => {
  assert.ok(
    /def _visible_user_boards\(client: WekanClient\)[\s\S]*?\/api\/users\/\{user_id\}\/boards/
      .test(server),
    'connector should have a helper for /api/users/{userId}/boards',
  );
  assert.ok(
    /async def list_boards\([^)]*\)[\s\S]*?boards = await _visible_user_boards\(client\)/
      .test(server),
    'list_boards should include private boards visible to the authenticated user',
  );
});

test('MCP health probe counts authenticated visible boards, not public boards', () => {
  assert.ok(
    /async def wekan_health_status\([^)]*\)[\s\S]*?boards = await _visible_user_boards\(client\)/
      .test(server),
    'health should report the same visible board set as list_boards',
  );
  assert.ok(
    server.includes('"board_discovery_endpoint": "/api/users/{userId}/boards"'),
    'health should expose the active board discovery endpoint for deploy checks',
  );
});

test('the public-only endpoint is not used for MCP board discovery', () => {
  const forbidden = /client\.request\("GET", "\/api\/boards"\)/g;
  assert.deepStrictEqual(
    [...server.matchAll(forbidden)].map(match => match.index),
    [],
    'MCP board discovery must not call public-only /api/boards',
  );
});

test('README documents private-board list_boards behavior', () => {
  assert.ok(
    readme.includes('/api/users/:userId/boards') &&
      readme.includes('/api/boards` chi list public boards'),
    'README should explain why list_boards does not use /api/boards',
  );
});

test('MCP server version was bumped for the board-discovery fix', () => {
  assert.ok(/version="0\.3\.0"/.test(server), 'serverInfo should identify the fixed build');
});

test('untrusted resource ids cannot alter WeKan REST paths', () => {
  assert.ok(
    /def _resource_id\(value: str, name: str\)[\s\S]*?re\.fullmatch\(r"\[A-Za-z0-9\]\+", value\)/
      .test(server),
    'opaque ids should be validated before interpolation into an API path',
  );
  for (const name of ['board_id', 'list_id', 'user_id']) {
    assert.ok(
      server.includes(`_resource_id(${name === 'user_id' ? 'client.user_id' : name}, "${name}")`),
      `${name} should pass through the resource-id validator`,
    );
  }
});

test('the repository does not auto-connect contributors to a remote MCP', () => {
  const projectConfig = read('.codex/config.toml');
  assert.ok(!projectConfig.includes('[mcp_servers.'), 'project config must remain opt-in');
  assert.ok(!projectConfig.includes('1nutrouter.com'), 'project config must not trust a personal host');
  assert.ok(
    readme.includes('127.0.0.1') && readme.includes('authenticated reverse proxy'),
    'deployment docs should default to loopback and require remote client authentication',
  );
});

console.log(`\n${passed} tests passed`);
