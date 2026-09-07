'use strict';

// Legacy HTML4 Admin Panel / Settings / Translation must expose the same
// operations as Blaze without introducing a second authority path.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const pages = read('server/lib/legacyHtml4Pages.js');
const route = read('server/legacyHtml4.js');
const service = read('server/lib/adminTranslations.js');
const model = read('server/models/translation.js');
const permissions = read('server/permissions/translation.js');
const client = read('client/components/settings/translationBody.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('legacyHtml4AdminTranslations:');

test('one common admin service owns both modern and HTML4 mutations', () => {
  for (const operation of ['createTranslationForAdmin', 'updateTranslationForAdmin',
    'deleteTranslationForAdmin']) {
    assert.ok(model.includes(`${operation}(this.userId`), `modern method uses ${operation}`);
    assert.ok(route.includes(`${operation}(session.userId`), `HTML4 route uses ${operation}`);
  }
  assert.ok(/requireAdmin[\s\S]*?isAdmin[\s\S]*?not-authorized/.test(service));
  assert.ok(/TranslationBleed/.test(service), 'refused HTTP operations are reported');
});

test('the page provides create, edit, literal search, pagination and confirmed delete', () => {
  assert.ok(/path !== '\/admin\/settings\/translation'/.test(pages));
  for (const operation of ['search-translations', 'create-translation',
    'update-translation', 'request-delete-translation', 'delete-translation',
    'translation-page']) assert.ok(pages.includes(operation), `${operation} control exists`);
  assert.ok(route.includes("requestFields.confirmTranslationDelete"),
    'the first delete request only asks for confirmation');
  assert.ok(/confirmTranslationDelete === translation\._id/.test(pages));
  assert.ok(/ADMIN_TRANSLATIONS_PAGE_SIZE = 25/.test(service));
  assert.ok(/limit: ADMIN_TRANSLATIONS_PAGE_SIZE/.test(service));
  const publication = read('server/publications/translation.js');
  assert.ok(/Math\.min\(limit, ADMIN_TRANSLATIONS_PAGE_SIZE\)/.test(publication),
    'a direct subscription cannot enlarge the bounded page');
});

test('search and mutation authority cannot carry executable selectors', () => {
  assert.ok(/check\(value, String\)/.test(service));
  assert.ok(/search\.length > 500/.test(service));
  assert.ok(/new RegExp\(literal, 'i'\)/.test(service));
  assert.ok(!/new RegExp/.test(client), 'the browser sends plain text');
  assert.ok(/updateAsync\(existing\._id/.test(service));
  assert.ok(/removeAsync\(\{ _id: translationId \}\)/.test(service));
  assert.ok(/createdAt: now, modifiedAt: now/.test(service),
    'direct inserts retain schema timestamps');
});

test('runtime translations use a separate exact-language publication', () => {
  const publication = read('server/publications/translation.js');
  const tap = read('imports/i18n/tap.js');
  assert.ok(/publish\('translationLanguage', function\(language\)/.test(publication));
  assert.ok(/Translation\.find\(\{ language \}/.test(publication));
  assert.ok(/fields: \{ language: 1, text: 1, translationText: 1 \}/.test(publication));
  assert.ok(/subscribe\('translationLanguage', language/.test(tap));
  assert.ok(!/subscribe\('translation', \{language/.test(tap));
});

test('direct DDP writes are blocked and reported', () => {
  assert.ok(/Translation\.deny\(/.test(permissions));
  for (const verb of ['insert', 'update', 'remove']) {
    assert.ok(new RegExp(`async ${verb}\\(userId\\)[\\s\\S]*?TranslationBleed`).test(permissions),
      `${verb} is denied and reported`);
  }
});

console.log(`\nlegacyHtml4AdminTranslations: ${passed} tests passed`);
