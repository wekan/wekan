'use strict';

// Pure calculations behind the board report charts (chartPlaceholderViews.jade
// replacements, docs/Features/Reports/charts.tsv). No Mongo/Meteor here so
// these can be driven directly from tests/chartCalculations.test.cjs; the
// server method in server/publications/boards.js loads the plain records
// (cards/lists/activities) and hands them to these functions.
//
// A card's COMPLETION date is card.endAt if set, else card.archivedAt, else
// null (not completed). WeKan has no separate "Done" list flag, so this is
// the closest existing field to "delivered" - charts.tsv's Lead/Cycle/
// Burndown/Burnup/Throughput/Flow-Efficiency descriptions all key off it.
function completionDate(card) {
  return card.endAt || card.archivedAt || null;
}

function dayKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function eachDay(from, to) {
  const days = [];
  const cursor = new Date(dayKey(from));
  const end = new Date(dayKey(to));
  while (cursor <= end) {
    days.push(dayKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

// Cumulative Flow Diagram: per day, per list, how many cards were in or past
// that list. Reconstructed from Activities (createCard/moveCard/archivedCard),
// each `{ activityType, listId, oldListId, cardId, createdAt }`, replayed in
// order to know which list every card sat in on any given day. `lists` is
// ordered board-left-to-right (the "past" in "in or past that status").
function computeCumulativeFlow(lists, events, fromDate, toDate) {
  const order = lists.map(list => list._id);
  const rank = Object.fromEntries(order.map((id, index) => [id, index]));
  const sorted = [...events].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const cardList = {};
  const archived = {};
  const days = eachDay(fromDate, toDate);
  const series = days.map(day => ({ day, counts: Object.fromEntries(order.map(id => [id, 0])) }));
  let eventIndex = 0;
  for (const day of days) {
    const dayEnd = new Date(`${day}T23:59:59.999Z`);
    while (eventIndex < sorted.length && new Date(sorted[eventIndex].createdAt) <= dayEnd) {
      const event = sorted[eventIndex];
      if (event.activityType === 'createCard') {
        cardList[event.cardId] = event.listId;
      } else if (event.activityType === 'moveCard') {
        cardList[event.cardId] = event.listId;
      } else if (event.activityType === 'archivedCard') {
        archived[event.cardId] = true;
      } else if (event.activityType === 'restoredCard') {
        archived[event.cardId] = false;
      }
      eventIndex += 1;
    }
    const counts = series[days.indexOf(day)].counts;
    Object.keys(cardList).forEach(cardId => {
      if (archived[cardId]) return;
      const listId = cardList[cardId];
      const listRank = rank[listId];
      if (listRank === undefined) return;
      order.forEach(id => {
        if (rank[id] <= listRank) counts[id] += 1;
      });
    });
  }
  return series;
}

// WIP Run: per day, how many cards were sitting in one of `wipListIds`
// (every list that is neither the first nor the last, i.e. "in progress").
// Reuses the same day-by-day replay as the CFD.
function computeWipRun(wipListIds, events, fromDate, toDate, wipLimit) {
  const wipSet = new Set(wipListIds);
  const sorted = [...events].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const cardList = {};
  const archived = {};
  const days = eachDay(fromDate, toDate);
  let eventIndex = 0;
  const series = [];
  for (const day of days) {
    const dayEnd = new Date(`${day}T23:59:59.999Z`);
    while (eventIndex < sorted.length && new Date(sorted[eventIndex].createdAt) <= dayEnd) {
      const event = sorted[eventIndex];
      if (event.activityType === 'createCard' || event.activityType === 'moveCard') {
        cardList[event.cardId] = event.listId;
      } else if (event.activityType === 'archivedCard') {
        archived[event.cardId] = true;
      } else if (event.activityType === 'restoredCard') {
        archived[event.cardId] = false;
      }
      eventIndex += 1;
    }
    const count = Object.keys(cardList).filter(cardId =>
      !archived[cardId] && wipSet.has(cardList[cardId])).length;
    series.push({ day, count, limit: wipLimit || null });
  }
  return series;
}

// Control Chart: one point per completed card - its cycle time in days,
// plotted on its completion date - plus a rolling average/stddev band over
// the given window (default 5, per charts.tsv's example).
function computeControlChart(cards, window = 5) {
  const points = cards
    .map(card => {
      const done = completionDate(card);
      if (!done) return null;
      const start = card.startAt || card.createdAt;
      const cycleDays = (new Date(done) - new Date(start)) / 86400000;
      return { cardId: card._id, title: card.title, completedAt: done, cycleDays: Math.max(0, cycleDays) };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));

  points.forEach((point, index) => {
    const slice = points.slice(Math.max(0, index - window + 1), index + 1).map(p => p.cycleDays);
    const avg = slice.reduce((sum, value) => sum + value, 0) / slice.length;
    const variance = slice.reduce((sum, value) => sum + (value - avg) ** 2, 0) / slice.length;
    point.average = avg;
    point.stddev = Math.sqrt(variance);
  });

  return points;
}

// Lead Time & Cycle Time: per completed card, Lead = completion - creation,
// Cycle = completion - start (falls back to creation when no startAt is set).
function computeLeadCycleTime(cards) {
  return cards
    .map(card => {
      const done = completionDate(card);
      if (!done) return null;
      const start = card.startAt || card.createdAt;
      return {
        cardId: card._id,
        title: card.title,
        completedAt: done,
        leadDays: Math.max(0, (new Date(done) - new Date(card.createdAt)) / 86400000),
        cycleDays: Math.max(0, (new Date(done) - new Date(start)) / 86400000),
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
}

// Burndown: remaining (not-yet-completed) card count per day, against an
// ideal straight-line trend from the count on day one to zero at `toDate`.
function computeBurndown(cards, fromDate, toDate) {
  const days = eachDay(fromDate, toDate);
  const initialTotal = cards.filter(card => new Date(card.createdAt) <= new Date(days[0])).length;
  const series = days.map((day, index) => {
    const dayEnd = new Date(`${day}T23:59:59.999Z`);
    const remaining = cards.filter(card => {
      if (new Date(card.createdAt) > dayEnd) return false;
      const done = completionDate(card);
      return !done || new Date(done) > dayEnd;
    }).length;
    const ideal = days.length > 1
      ? Math.max(0, initialTotal - (initialTotal * index) / (days.length - 1))
      : 0;
    return { day, remaining, ideal: Math.round(ideal * 100) / 100 };
  });
  return series;
}

// Burnup: total scope vs cumulative completed work per day.
function computeBurnup(cards, fromDate, toDate) {
  const days = eachDay(fromDate, toDate);
  return days.map(day => {
    const dayEnd = new Date(`${day}T23:59:59.999Z`);
    const total = cards.filter(card => new Date(card.createdAt) <= dayEnd).length;
    const completed = cards.filter(card => {
      const done = completionDate(card);
      return done && new Date(done) <= dayEnd;
    }).length;
    return { day, total, completed };
  });
}

// Throughput Histogram: completed-card count per bucket ('day'|'week'|'month').
function computeThroughput(cards, bucket = 'week') {
  const buckets = {};
  cards.forEach(card => {
    const done = completionDate(card);
    if (!done) return;
    const date = new Date(done);
    let key;
    if (bucket === 'day') {
      key = dayKey(date);
    } else if (bucket === 'month') {
      key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    } else {
      const weekStart = new Date(date);
      const weekday = (weekStart.getUTCDay() + 6) % 7; // Monday = 0
      weekStart.setUTCDate(weekStart.getUTCDate() - weekday);
      key = dayKey(weekStart);
    }
    buckets[key] = (buckets[key] || 0) + 1;
  });
  return Object.keys(buckets).sort().map(key => ({ bucket: key, count: buckets[key] }));
}

// Flow Efficiency: active-work time (spentTime, if the board tracks it) as a
// share of total cycle time. Boards that never log time on a card cannot say
// how much of its cycle time was "active" vs "waiting" - charts.tsv's "queue
// time between stages" needs per-list timestamps this chart does not have
// available cheaply, so spentTime (already tracked per card) stands in for
// active time; a card with no spentTime logged is left out rather than
// guessed at.
function computeFlowEfficiency(cards) {
  return cards
    .map(card => {
      const done = completionDate(card);
      const spent = Number(card.spentTime) || 0;
      if (!done || !spent) return null;
      const start = card.startAt || card.createdAt;
      const totalHours = Math.max((new Date(done) - new Date(start)) / 3600000, spent);
      const efficiency = totalHours > 0 ? Math.min(100, (spent / totalHours) * 100) : 0;
      return { cardId: card._id, title: card.title, activeHours: spent, totalHours, efficiency };
    })
    .filter(Boolean);
}

// Sentinel keys (never shown as-is) for a card that has no assignee/label to
// group under. group.label carries the SAME sentinel, and every renderer of
// dashboard groups (the live bar chart, the data table, the PDF/Excel
// export) must run it through DASHBOARD_EMPTY_GROUP_KEYS/translateGroupLabel
// before display - otherwise the literal word "none" reaches the screen
// untranslated, in every language, which is the bug this fixes.
const NO_ASSIGNEE_GROUP = { key: '__no_assignee__', label: '__no_assignee__' };
const NO_LABEL_GROUP = { key: '__no_label__', label: '__no_label__' };
const DASHBOARD_EMPTY_GROUP_KEYS = {
  __no_assignee__: ['no-assignee', 'No assignee'],
  __no_label__: ['no-label', 'No label'],
};

// `translate(key, fallback)` is the caller's own `__()` (TAPi18n.__ on the
// client, an exporter's own translate function on the server - see
// models/lib/chartExportRows.js). A label that is not one of the sentinels
// above is user data (a real assignee name or label name) and passes through
// unchanged.
function translateGroupLabel(label, translate) {
  const entry = DASHBOARD_EMPTY_GROUP_KEYS[label];
  if (!entry) return label;
  return translate ? translate(entry[0], entry[1]) : entry[1];
}

// Dashboard: card counts grouped by an attribute (assignee/label/etc), each
// entry {key, label, count}. `resolveGroups(card)` returns the array of
// {key, label} the card counts under (a card can have several labels).
// `emptyGroup` is the {key, label} a card with no groups falls into - the
// caller supplies one appropriate to what is being grouped (e.g. a real,
// translated "No assignee"/"No label" instead of the literal word "none",
// which used to show up untranslated on the Dashboard view no matter what).
function computeDashboardGroups(cards, resolveGroups, emptyGroup = { key: 'none', label: 'none' }) {
  const byKey = {};
  cards.forEach(card => {
    const groups = resolveGroups(card) || [];
    (groups.length ? groups : [emptyGroup]).forEach(group => {
      const entry = byKey[group.key] || { key: group.key, label: group.label, count: 0 };
      entry.count += 1;
      byKey[group.key] = entry;
    });
  });
  const total = cards.length || 1;
  return Object.values(byKey)
    .sort((a, b) => b.count - a.count)
    .map(entry => ({ ...entry, percent: Math.round((entry.count / total) * 1000) / 10 }));
}

// Time view (#812): spentTime grouped by assignee, and the per-card
// breakdown - the "reporting total hours by resource and task type" the
// issue asked for. Same shape as computeDashboardGroups (key/label/percent),
// but SUMS each card's spentTime into the group instead of counting cards,
// since "who spent how many hours" is the question here, not "who has how
// many cards". `resolveGroups(card)` returns the {key, label} group(s) a
// card's time counts under; a card with none falls into `emptyGroup`.
function computeTimeByGroup(cards, resolveGroups, emptyGroup = { key: 'none', label: 'none' }) {
  const byKey = {};
  const withTime = cards.filter(card => (Number(card.spentTime) || 0) > 0);
  withTime.forEach(card => {
    const time = Number(card.spentTime) || 0;
    const groups = resolveGroups(card) || [];
    (groups.length ? groups : [emptyGroup]).forEach(group => {
      const entry = byKey[group.key] || { key: group.key, label: group.label, hours: 0, cards: 0 };
      entry.hours += time;
      entry.cards += 1;
      byKey[group.key] = entry;
    });
  });
  const total = withTime.reduce((sum, card) => sum + (Number(card.spentTime) || 0), 0) || 1;
  return Object.values(byKey)
    .sort((a, b) => b.hours - a.hours)
    .map(entry => ({
      ...entry,
      hours: Math.round(entry.hours * 100) / 100,
      percent: Math.round((entry.hours / total) * 1000) / 10,
    }));
}

// The per-card breakdown: one row per card that has any spentTime logged,
// newest-largest first.
function computeTimeByCard(cards) {
  return cards
    .filter(card => (Number(card.spentTime) || 0) > 0)
    .map(card => ({
      key: card._id,
      title: card.title || card._id,
      hours: Math.round((Number(card.spentTime) || 0) * 100) / 100,
      isOvertime: !!card.isOvertime,
    }))
    .sort((a, b) => b.hours - a.hours);
}

module.exports = {
  completionDate,
  dayKey,
  eachDay,
  computeCumulativeFlow,
  computeWipRun,
  computeControlChart,
  computeLeadCycleTime,
  computeBurndown,
  computeBurnup,
  computeThroughput,
  computeFlowEfficiency,
  computeDashboardGroups,
  NO_ASSIGNEE_GROUP,
  NO_LABEL_GROUP,
  translateGroupLabel,
  computeTimeByGroup,
  computeTimeByCard,
};
