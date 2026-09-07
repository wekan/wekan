'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const service = read('server/lib/adminDomains.js');
const methods = read('server/models/users.js');
const pages = read('server/lib/legacyHtml4Pages.js');
const domainPage = pages.slice(pages.indexOf('async function adminPeopleDomainsPage'),
  pages.indexOf('async function adminPeopleSharedTemplatesPage'));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('legacyHtml4AdminPeopleDomains:');

test('HTML4 and Jade use one guarded domain aggregation service', () => {
  assert.ok(/requireGlobalAdmin[\s\S]*isAdmin[\s\S]*DomainBleed/.test(service));
  assert.ok(methods.includes('return domainsForAdmin(this.userId)'));
  assert.ok(methods.includes('return domainsPageForAdmin(this.userId, params)'));
  assert.ok(domainPage.includes('await domainsPageForAdmin(userId'));
  assert.ok(!/Meteor\.users\.find/.test(domainPage));
});

test('domain enumeration is bounded, normalized and secret-minimal', () => {
  assert.ok(/slice\(0, 500\)/.test(service));
  assert.ok(/Math\.min\(numericPerPage, 200\)/.test(service));
  assert.ok(/fields: \{ emails: 1 \}/.test(service));
  assert.ok(/lastIndexOf\('@'\)/.test(service));
  assert.ok(/toLowerCase\(\)\.trim\(\)/.test(service));
  assert.ok(/paginateDomains/.test(service));
});

test('HTML4 retains search, total and bounded previous/next paging', () => {
  assert.ok(/path !== '\/admin\/people\/domains'/.test(pages));
  assert.ok(/uiSearchForm\([\s\S]*fields: \{ page: 1 \}/.test(pages));
  assert.ok(/result\.page > 1[\s\S]*previous-page/.test(pages));
  assert.ok(/result\.page < result\.totalPages[\s\S]*next-page/.test(pages));
  assert.ok(/domain-user-count/.test(pages));
});

console.log(`\nlegacyHtml4AdminPeopleDomains: ${passed} tests passed`);
