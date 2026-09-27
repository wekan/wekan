const { total } = require('./scrumReports');

// A sample is an observation, not proof that no intervening events occurred.
// Return only measured days; the chart must not interpolate missing history.
function dailyHistoryRows(samples, visibleIds = null) {
  return samples.map(sample => {
    const cards = sample.snapshot.cards.filter(card => !visibleIds || visibleIds.has(card.cardId));
    return { day: sample.day, capturedAt: sample.capturedAt,
      unit: sample.snapshot.unit, scope: total(cards),
      remaining: total(cards.filter(card => !card.done)),
      completed: total(cards.filter(card => card.done)),
      partial: Boolean(visibleIds || sample.snapshot.partial), consistency: 'observed' };
  });
}

module.exports = { dailyHistoryRows };
