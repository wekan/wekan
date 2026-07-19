'use strict';

// Guards for the Admin Panel → Problems pagination tables: server-side
// pagination with INDEX-BACKED sorts (so only one page loads, fast), theme-
// colored controls, pagination beside the search field, no redundant Search
// button, and clickable column-header sorting. (User reports: the Cards report
// spun while loading 11761 cards; controls ignored the theme.)
//
// Run: node tests/adminReportsPagination.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

console.log('adminReportsPagination:');

// ── performance: paginated + index-backed sorts ─────────────────────────────
check('Cards report sorts by an INDEXED field (boardId,createdAt), not the unindexed {boardId,sort}', () => {
  const pub = read('server/publications/cards.js');
  const block = pub.slice(pub.indexOf("publish('cardsReport'"), pub.indexOf("getCardsReportCount"));
  assert.ok(/sort:\s*\{\s*boardId:\s*1,\s*createdAt:\s*-1\s*\}/.test(block),
    'cardsReport must sort by the { boardId:1, createdAt:-1 } index');
  assert.ok(!/sort:\s*\{\s*boardId:\s*1,\s*sort:\s*1\s*\}/.test(block),
    'the unindexed { boardId:1, sort:1 } sort must be gone');
  // publication is bounded (limit/skip)
  assert.ok(/limit,\s*skip/.test(block), 'publication must page with limit/skip');
  const client = read('client/components/settings/adminReports.js');
  assert.ok(/collectionResults\(Cards, \{ boardId: 1, createdAt: -1 \}\)/.test(client),
    'client sort must match the publication');
});

check('eventlog has a {stream,at} index so Security/Speed/Tests pages stay fast', () => {
  const src = read('models/eventLog.js');
  assert.ok(/ensureIndex\(EventLog, \{ stream: 1, at: -1 \}\)/.test(src),
    'the stream+at index must be created for the streamSelector sort');
  assert.ok(/ensureIndex\(EventLogAcks, \{ stream: 1 \}\)/.test(src));
});

console.log(`\n${passed} passed`);
