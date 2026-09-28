'use strict';

// Archive dates are grouped in UTC, independently of the viewer's timezone.
// Restored cards and legacy archives without a date are not contributions.
function archiveYear(value, now = new Date()) {
  const year = value === undefined ? now.getUTCFullYear() : Number(value);
  if (!['number', 'string', 'undefined'].includes(typeof value) ||
      !Number.isInteger(year) || year < 1900 || year > 9998) {
    throw new Error('Invalid archive year');
  }
  return year;
}

function archiveContributions(year, labels = []) {
  year = archiveYear(year);
  const from = new Date(Date.UTC(year, 0, 1));
  const until = new Date(Date.UTC(year + 1, 0, 1));
  const days = new Map();
  const definitions = new Map(labels.filter(label => label && typeof label._id === 'string')
    .map(label => [label._id, { name: String(label.name || label.color || ''),
      color: typeof label.color === 'string' && /^(?:[a-z][a-z0-9-]*|#[0-9a-f]{6})$/i.test(label.color)
        ? label.color : 'gray' }]));
  for (let time = +from; time < +until; time += 86400000) {
    const date = new Date(time).toISOString().slice(0, 10);
    days.set(date, { date, count: 0, labels: new Map() });
  }
  return {
    from, until,
    add(card) {
      if (card.archived !== true || !(card.archivedAt instanceof Date) ||
          !Number.isFinite(+card.archivedAt)) return;
      const day = days.get(card.archivedAt.toISOString().slice(0, 10));
      if (!day) return;
      day.count++;
      for (const id of new Set(Array.isArray(card.labelIds) ? card.labelIds : [])) {
        if (definitions.has(id)) day.labels.set(id, definitions.get(id));
      }
    },
    result() {
      return { year, timezone: 'UTC', days: [...days.values()].map(day => ({
        date: day.date, count: day.count,
        level: day.count === 0 ? 0 : Math.min(4, 1 + Math.floor(Math.log2(day.count))),
        labels: [...day.labels.values()],
      })) };
    },
  };
}
module.exports = { archiveYear, archiveContributions };
