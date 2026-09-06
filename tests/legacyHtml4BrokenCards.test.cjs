'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('HTML4 and HTML5 broken-card pages share one scoped query', () => {
  const publication = read('server/publications/cards.js');
  const page = read('server/lib/legacyHtml4Pages.js');
  const modern = read('client/components/main/brokenCards.js');
  const modernTemplate = read('client/components/main/brokenCards.jade');
  const search = read('client/lib/cardSearch.js');
  assert.match(publication, /async function buildBrokenCardsSearch\(userId\)/);
  assert.match(publication, /Meteor\.publish\('brokenCards',[\s\S]*buildBrokenCardsSearch\(this\.userId\)/);
  assert.match(publication, /export async function searchBrokenCardsPage/);
  assert.match(publication, /searchQueryPage\(await buildBrokenCardsSearch\(userId\)/);
  assert.match(publication, /executeCardSearch\(query, userId\)/);
  assert.match(page, /searchBrokenCardsPage\(userId, requestFields\.page\)/);
  assert.match(modern, /'brokenCards', search\.sessionId, search\.subscriptionCallbacks/);
  assert.match(modern, /getSearchData\(\)[\s\S]*return Template\.instance\(\)\.search/);
  assert.match(modernTemplate, /\+resultsPaged getSearchData/);
  assert.doesNotMatch(modernTemplate, /\+resultsPaged\(this\)/);
  assert.match(modernTemplate, /\.wrapper\.global-search-wrapper\.board-color-belize/);
  assert.match(modernTemplate, /\.global-search-results-list-wrapper\.global-search-results-list/);
  assert.match(search, /else this\.runSessionPage\('nextPage'\)/);
  assert.match(search, /this\.runSessionPage\('previousPage'\)/);
});

test('HTML4 broken-card rows expose every context and bounded paging', () => {
  const publication = read('server/publications/cards.js');
  const page = read('server/lib/legacyHtml4Pages.js');
  const renderer = read('imports/lib/legacyHtml4.js');
  assert.match(page, /board\?\.title \|\| unknown/);
  assert.match(page, /swimlaneById\.get\(card\.swimlaneId\)\?\.title \|\| unknown/);
  assert.match(page, /listById\.get\(card\.listId\)\?\.title \|\| unknown/);
  assert.match(page, /card\.type \|\| unknown/);
  assert.match(page, /fields: \{ page: result\.page \+ 1 \}/);
  const projection = publication.slice(publication.indexOf('function buildProjection(query)'),
    publication.indexOf('async function buildQuery'));
  assert.match(projection, /Math\.min\(limit, MAX_GLOBAL_SEARCH_RESULTS_PER_PAGE\)/);
  assert.match(renderer, /'\/broken-cards'/);
});
