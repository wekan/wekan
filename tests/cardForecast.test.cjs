'use strict';

// Forecast done date (docs/Features/Cards/Dates/Forecast.md): cycle times,
// the conditional percentiles, too few samples, and who may read the times.
//
// Run: node tests/cardForecast.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const f = require('../models/lib/cardForecast.js');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const DAY = 86400000;
const now = new Date('2026-10-17T12:00:00Z').getTime();
const finished = d => ({ createdAt: new Date(now - 30 * DAY), endAt: new Date(now - 30 * DAY + d * DAY) });

console.log('cardForecast:');

test('cycle times of the finished cards in the window', () => {
  const times = f.cycleTimes([
    finished(2), finished(4),
    { createdAt: new Date(now - 10 * DAY), archived: true, archivedAt: new Date(now - 5 * DAY) },
    { createdAt: new Date(now - 10 * DAY), startAt: new Date(now - 8 * DAY), dueComplete: true, modifiedAt: new Date(now - 7 * DAY) },
    { createdAt: new Date(now - 400 * DAY), endAt: new Date(now - 300 * DAY) },
    { createdAt: new Date(now - 3 * DAY) },
  ], now);
  assert.deepStrictEqual(times.map(t => t / DAY), [2, 4, 5, 1], 'an open card and one finished long ago are left out');
});

test('the 50th and 85th percentile, of the cards that took at least this long', () => {
  const times = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(d => d * DAY);
  const card = { createdAt: new Date(now - 4 * DAY) };
  const res = f.forecastCard(card, times, now);
  assert.strictEqual(res.enough, true);
  assert.strictEqual(res.samples, 7, 'only the cards that took four days or more');
  assert.strictEqual((res.p50.getTime() - (now - 4 * DAY)) / DAY, 7);
  assert.strictEqual((res.p85.getTime() - (now - 4 * DAY)) / DAY, 9, 'the 6th of 7 (flowAnalytics quantile)');
});

test('too few samples, and a done card, give no dates (negative)', () => {
  const res = f.forecastCard({ createdAt: new Date(now - 9 * DAY) }, [1, 2, 10, 11].map(d => d * DAY), now);
  assert.deepStrictEqual(res, { enough: false, samples: 2 });
  assert.strictEqual(f.forecastCard({ createdAt: new Date(now), dueComplete: true }, [1, 2, 3, 4, 5].map(d => d * DAY), now), null);
  assert.strictEqual(f.forecastCard({}, [1, 2, 3, 4, 5].map(d => d * DAY), now), null);
});

test('the server answers numbers only, for a reader of the board, scoped by role (negative)', () => {
  const src = read('server/methods/cardForecast.js');
  assert.match(src, /boardForCardHelper\(this\.userId, boardId, 'forecast', 'allowsForecastOnCard'\)/);
  assert.match(src, /assignedOnlyCardScope\(board, this\.userId\)/);
  assert.match(src, /return cycleTimes\(finished\);/);
  assert.match(read('server/imports.js'), /import '\/server\/methods\/cardForecast';/);
  const jade = read('client/components/cards/cardDetails.jade');
  assert.match(jade, /unless \$eq currentBoard\.allowsForecastOnCard false\n\s+with cardForecastOf this/);
  const mini = read('client/components/cards/minicard.jade');
  assert.match(mini, /if currentBoard\.allowsForecastOnMinicard\n\s+with cardForecastOf this/, 'the minicard side is off until turned on');
  const { CARD_SETTINGS_ROWS } = require('../models/lib/cardSettingsRows.js');
  const row = CARD_SETTINGS_ROWS.find(r => r.key === 'forecast');
  assert.ok(row && row.card.default === true && row.minicard.default === false);
});

console.log(`\ncardForecast: ${passed} tests passed`);
