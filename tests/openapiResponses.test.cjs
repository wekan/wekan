'use strict';

// Non-200 REST responses belong in the route's JSDoc and are generated into
// public/api/wekan.yml. This pins both halves so a docs rebuild cannot erase
// DELETE /api/users/{user}'s response contract.
//
// Run: node tests/openapiResponses.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = relativePath => fs.readFileSync(
  path.join(repoRoot, relativePath),
  'utf8',
);

const generator = read('openapi/generate_openapi.py');
const users = read('server/models/users.js');
const openapi = read('public/api/wekan.yml');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const routeAt = users.indexOf("WebApp.handlers.delete('/api/users/:userId'");
const routeDoc = users.slice(users.lastIndexOf('/**', routeAt), routeAt);
const pathAt = openapi.indexOf('  /api/users/{user}:');
const nextPathAt = openapi.indexOf('\n  /api/', pathAt + 1);
const deletePath = openapi.slice(pathAt, nextPathAt);

test('the generator accepts repeatable @response annotations', () => {
  assert.match(generator, /tag == 'response'/);
  assert.match(generator, /self\._doc\.setdefault\('responses', \{\}\)\[code\]/);
  assert.match(generator, /for code, response in self\.responses\.items\(\)/);
});

test('the user DELETE route owns its success and not-found contracts', () => {
  assert.ok(routeAt >= 0, 'the route exists');
  assert.match(routeDoc, /@return_type \{_id: string\}/);
  assert.match(routeDoc, /@response 404 \{error: string\} No user matched/);
});

test('the generated OpenAPI path documents the exact 200 response body', () => {
  assert.ok(pathAt >= 0 && nextPathAt > pathAt, 'the generated user path exists');
  assert.match(
    deletePath,
    /delete:[\s\S]*?'200':[\s\S]*?schema:[\s\S]*?properties:[\s\S]*?_id:[\s\S]*?type: string/,
  );
});

test('the generated OpenAPI path documents the exact 404 response body', () => {
  assert.match(
    deletePath,
    /'404':[\s\S]*?No user matched the requested id\.[\s\S]*?schema:[\s\S]*?properties:[\s\S]*?error:[\s\S]*?type: string/,
  );
});

console.log(`\n${passed} tests passed`);
