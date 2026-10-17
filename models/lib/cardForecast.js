'use strict';

// Forecast done date for one card (docs/Features/Cards/Dates/Forecast.md):
// when it is likely to be done, from how long the board's finished cards
// took - ClickUp's and Jira's AI estimate, here two percentiles. The
// board-wide forecasts are the Monte Carlo view (models/lib/flowAnalytics.js).
//
// Pure, no Meteor. Tests: tests/cardForecast.test.cjs.

const { quantile } = require('./flowAnalytics');

const DAY = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 180;
const MIN_SAMPLES = 5;

const time = value => {
  const t = value ? new Date(value).getTime() : NaN;
  return Number.isNaN(t) ? null : t;
};

function startOf(card) {
  return time(card.startAt) || time(card.createdAt);
}

// When a finished card was finished: its end date, when it was archived, or
// when it was last changed if it was only marked complete.
function endOf(card) {
  if (time(card.endAt)) return time(card.endAt);
  if (card.archived && time(card.archivedAt)) return time(card.archivedAt);
  if (card.dueComplete === true) return time(card.modifiedAt) || time(card.dateLastActivity);
  return null;
}

function isOpen(card) {
  return !!card && !card.archived && card.dueComplete !== true && !card.endAt;
}

// The cycle times, in milliseconds, of the cards finished in the window.
function cycleTimes(cards, now = Date.now(), windowDays = WINDOW_DAYS) {
  const since = now - windowDays * DAY;
  const out = [];
  for (const card of cards || []) {
    if (!card || isOpen(card)) continue;
    const start = startOf(card);
    const end = endOf(card);
    if (start === null || end === null || end < since || end < start) continue;
    out.push(end - start);
  }
  return out;
}

// { enough: false, samples } or { enough: true, samples, p50, p85 } as Dates.
// Only the finished cards that took at least as long as this one has already
// been open count: a card open ten days cannot be done in three.
function forecastCard(card, times, now = Date.now()) {
  if (!isOpen(card)) return null;
  const start = startOf(card);
  if (start === null) return null;
  const elapsed = Math.max(0, now - start);
  const usable = (times || []).filter(t => t >= elapsed);
  if (usable.length < MIN_SAMPLES) return { enough: false, samples: usable.length };
  return {
    enough: true,
    samples: usable.length,
    p50: new Date(start + quantile(usable, 0.5)),
    p85: new Date(start + quantile(usable, 0.85)),
  };
}

module.exports = { WINDOW_DAYS, MIN_SAMPLES, startOf, endOf, isOpen, cycleTimes, forecastCard };
