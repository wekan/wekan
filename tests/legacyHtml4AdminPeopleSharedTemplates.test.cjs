'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const common = read('models/lib/sharedTemplates.js');
const service = read('server/lib/adminSharedTemplates.js');
const methods = read('server/models/users.js');
const modern = read('client/components/settings/peopleBody.js');
const pages = read('server/lib/legacyHtml4Pages.js');
const route = read('server/legacyHtml4.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('legacyHtml4AdminPeopleSharedTemplates:');

test('one Global Admin service owns HTML5 and HTML4 template discovery', () => {
  assert.ok(/requireGlobalAdmin[\s\S]*?isAdmin[\s\S]*?not-authorized/.test(service));
  assert.ok(service.includes("bleed: 'TemplateBleed'"));
  assert.ok(service.includes("category: 'authz'"));
  assert.ok(methods.includes('return sharedTemplatesForAdmin(this.userId)'));
  assert.ok(pages.includes('sharedTemplatesForAdmin(userId'));
  assert.ok(!methods.includes('const templateBoards = [];\n      for (const card of cards)'));
});

test('both renderers share the exact three scopes and grouping function', () => {
  for (const scope of ['organizations', 'teams', 'domains']) assert.ok(common.includes(scope));
  assert.ok(common.includes('normalizeSharedTemplateScopes'));
  assert.ok(common.includes('buildSharedTemplateScopeGroups'));
  assert.ok(modern.includes('buildSharedTemplateScopeGroups(scope, rows)'));
  assert.ok(pages.includes('buildSharedTemplateScopeGroups(scope, templateRows)'));
});

test('HTML4 retains scope selection, grouped board links and anonymous isolation', () => {
  assert.ok(/path !== '\/admin\/people\/shared-templates'/.test(pages));
  assert.ok(/name: 'templateScopes'/.test(pages));
  assert.ok(/legacyOperation: 'filter-shared-templates'/.test(pages));
  assert.ok(/board\.url \? uiAction/.test(pages));
  assert.ok(/requestFields\.req = req/.test(route));
  assert.ok(/catch \(_\)[\s\S]*?error-notAuthorized/.test(pages));
});

console.log(`\nlegacyHtml4AdminPeopleSharedTemplates: ${passed} tests passed`);
