'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('HTML4 global search parses and executes the Meteor search contract', () => {
  const query = read('config/query-classes.js');
  const publication = read('server/publications/cards.js');
  const page = read('server/lib/legacyHtml4Pages.js');
  assert.match(query, /buildParams\(queryText, translate = key => TAPi18n\.__\(key\)\)/);
  assert.match(query, /predicateTranslations\[category\]\[translate\(tag\)\]/);
  assert.match(query, /operatorMap\[String\(translate\(key\)\)\.toLowerCase\(\)\]/);
  assert.match(publication, /async function executeCardSearch\(query, userId\)/);
  assert.match(publication, /export async function searchCardsPage/);
  assert.match(publication, /authorizedBoardIds = await Boards\.userBoardIds/);
  assert.match(publication, /selectorIsInjection\(/);
  assert.match(page, /query\.buildParams\(queryText, key => translate\(key\)\)/);
  assert.match(page, /searchCardsPage\(/);
  assert.doesNotMatch(page, /new RegExp\(escaped, 'i'\)/);
});

test('search pages bound limits, pages, view scope and preserved form state', () => {
  const publication = read('server/publications/cards.js');
  const page = read('server/lib/legacyHtml4Pages.js');
  const renderer = read('imports/lib/legacyHtml4.js');
  const controller = read('server/legacyHtml4.js');
  const modern = read('client/components/main/globalSearch.js');
  const help = read('models/lib/globalSearchHelp.js');
  assert.match(publication, /MAX_GLOBAL_SEARCH_RESULTS_PER_PAGE = 200/);
  assert.match(publication, /Math\.min\([\s\S]*MAX_GLOBAL_SEARCH_RESULTS_PER_PAGE/);
  assert.match(publication, /Math\.min\(numericPage, 10000\)/);
  assert.match(publication, /if \(page > totalPages\)/);
  assert.match(page, /searchView === 'me'/);
  assert.match(page, /addPredicate\([\s\S]*OPERATOR_USER/);
  assert.match(page, /fields: \{ q: queryText, searchView, page: result\.page \+ 1 \}/);
  assert.match(renderer, /Object\.entries\(cell\.fields \|\| \{\}\)/);
  assert.match(controller, /query\.has\('searchView'\)/);
  assert.match(controller, /query\.has\('page'\)/);
  assert.match(modern, /GLOBAL_SEARCH_HELP_LINES\.forEach/);
  assert.match(page, /GLOBAL_SEARCH_HELP_LINES/);
  assert.match(help, /globalSearch-instructions-operator-board/);
  assert.match(help, /globalSearch-instructions-notes-5/);
});
