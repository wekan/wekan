import { Meteor } from 'meteor/meteor';
import { ReactiveDict } from 'meteor/reactive-dict';

// The board's cycle times for the forecast done date
// (docs/Features/Cards/Dates/Forecast.md): asked once per board and kept for
// ten minutes, shared by the opened card and every minicard.
const { forecastCard } = require('/models/lib/cardForecast');

const KEEP_MS = 10 * 60 * 1000;
const times = new ReactiveDict();
const asked = new Map();

function cycleTimesOf(boardId) {
  if (!boardId) return null;
  const at = asked.get(boardId);
  if (!at || Date.now() - at > KEEP_MS) {
    asked.set(boardId, Date.now());
    Meteor.call('boards.cycleTimes', boardId, (err, list) => {
      times.set(boardId, err || !Array.isArray(list) ? [] : list);
    });
  }
  return times.get(boardId);
}

// { enough, p50, p85 } for an open card, or null.
export function forecastOf(card) {
  const real = card && card.getRealCard ? card.getRealCard() : card;
  if (!real) return null;
  const list = cycleTimesOf(real.boardId);
  return list ? forecastCard(real, list) : null;
}
