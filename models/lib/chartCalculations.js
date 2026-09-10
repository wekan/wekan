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

// Completion forecast (#1476): projects a completion date for the cards still
// open, from the average throughput of the most recent buckets of
// `computeThroughput`'s own series - reusing that series rather than
// recomputing velocity a second way. `bucketDays` is how many calendar days
// one throughput bucket spans (7 for 'week', 30 for 'month', 1 for 'day'),
// and `windowSize` is how many of the most recent buckets the average is
// taken over (default 4, e.g. the last 4 weeks). Returns null when there is
// nothing open to project, or when recent throughput is zero (the rate never
// finishes the remaining work, so no date can be given).
function computeCompletionForecast(cards, throughputSeries, bucketDays = 7, windowSize = 4) {
  const remaining = cards.filter(card => !completionDate(card)).length;
  if (remaining <= 0) return { remaining: 0, averagePerBucket: 0, bucketsNeeded: 0, projectedDate: null };
  const recent = throughputSeries.slice(-windowSize);
  const totalCompleted = recent.reduce((sum, row) => sum + (Number(row.count) || 0), 0);
  const averagePerBucket = recent.length ? totalCompleted / recent.length : 0;
  if (averagePerBucket <= 0) {
    return { remaining, averagePerBucket: 0, bucketsNeeded: null, projectedDate: null };
  }
  const bucketsNeeded = Math.ceil(remaining / averagePerBucket);
  const projected = new Date();
  projected.setUTCDate(projected.getUTCDate() + bucketsNeeded * bucketDays);
  return {
    remaining,
    averagePerBucket: Math.round(averagePerBucket * 100) / 100,
    bucketsNeeded,
    projectedDate: dayKey(projected),
  };
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

// Pulse (#1292: a "GitHub Pulse-like graph" of board activity over time):
// total Activities documents per day (or per week, once the window is long
// enough that a day-per-bar chart would not fit) across `fromDate`..`toDate`.
// A day with no activity is a zero-count bucket, never omitted - otherwise
// the chart would silently compress quiet stretches instead of showing them.
// `activities` is any array of `{ createdAt }` records (the caller filters
// to the board and the window before calling this).
function computeActivityPulse(activities, fromDate, toDate, bucket = 'day') {
  const days = eachDay(fromDate, toDate);
  if (bucket === 'week') {
    const weekOf = day => {
      const date = new Date(day);
      const weekday = (date.getUTCDay() + 6) % 7; // Monday = 0
      date.setUTCDate(date.getUTCDate() - weekday);
      return dayKey(date);
    };
    const weeks = [];
    const seen = new Set();
    days.forEach(day => {
      const week = weekOf(day);
      if (!seen.has(week)) {
        seen.add(week);
        weeks.push(week);
      }
    });
    const counts = Object.fromEntries(weeks.map(week => [week, 0]));
    activities.forEach(activity => {
      const week = weekOf(dayKey(activity.createdAt));
      if (week in counts) counts[week] += 1;
    });
    return weeks.map(week => ({ day: week, count: counts[week] }));
  }
  const counts = Object.fromEntries(days.map(day => [day, 0]));
  activities.forEach(activity => {
    const key = dayKey(activity.createdAt);
    if (key in counts) counts[key] += 1;
  });
  return days.map(day => ({ day, count: counts[day] }));
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
  __no_roadmap_value__: ['roadmap-no-value', 'No value'],
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

// Roadmap board view (#627: "a Roadmap view organizing cards by version/
// release milestone in a timeline layout") - groups cards by the VALUE of
// one board custom field (a "Version"/"Release" text or dropdown field the
// board already has), one row per distinct value, each row keeping the
// CARDS (not just a count) so the caller can plot them on a timeline the
// same way the Gantt views already do. `resolveValue(card)` returns the
// card's value for the chosen field, or a falsy value when the card has none
// - those fall into `emptyGroup`, always sorted last so it reads as the
// leftover bucket rather than competing with real versions/releases, same
// convention as computeCardsByAssigneeGroup below. Unlike an assignee, a
// custom field's text/dropdown value is a single string, not an array, so
// each card counts under exactly one group.
const NO_ROADMAP_GROUP = { key: '__no_roadmap_value__', label: '__no_roadmap_value__' };

function computeCardsByCustomFieldGroup(cards, resolveValue, emptyGroup = NO_ROADMAP_GROUP) {
  const byKey = {};
  cards.forEach(card => {
    const value = resolveValue(card);
    const group = value ? { key: value, label: value } : emptyGroup;
    const entry = byKey[group.key] || { key: group.key, label: group.label, cards: [] };
    entry.cards.push(card);
    byKey[group.key] = entry;
  });
  return Object.values(byKey).sort((a, b) => {
    if (a.key === emptyGroup.key) return 1;
    if (b.key === emptyGroup.key) return -1;
    return a.label.localeCompare(b.label);
  });
}

// Group by Assignee board view (#4688: "grouping cards by assignee" for a
// team-meeting-friendly overview). Same shape/fold as computeDashboardGroups
// (a card with several assignees counts under each, a card with none falls
// into `emptyGroup`), but each group carries the actual CARDS instead of a
// count/percent, since this view lists them rather than charting them.
// Groups are sorted by card count (most first), with the "no assignee"
// sentinel group always last regardless of its count so it reads as the
// leftover bucket rather than competing with real assignees.
function computeCardsByAssigneeGroup(cards, resolveGroups, emptyGroup = { key: 'none', label: 'none' }) {
  const byKey = {};
  cards.forEach(card => {
    const groups = resolveGroups(card) || [];
    (groups.length ? groups : [emptyGroup]).forEach(group => {
      const entry = byKey[group.key] || { key: group.key, label: group.label, cards: [] };
      entry.cards.push({
        cardId: card._id,
        title: card.title || card._id,
        dueAt: card.dueAt || null,
        isOvertime: !!card.isOvertime,
      });
      byKey[group.key] = entry;
    });
  });
  return Object.values(byKey).sort((a, b) => {
    if (a.key === emptyGroup.key) return 1;
    if (b.key === emptyGroup.key) return -1;
    return b.cards.length - a.cards.length;
  });
}

// Time view (#1121): the SUM of remaining time until due date, across the
// board's/list's active (still-open) cards that have a due date set - "how
// much is left" alongside the "how much has already been spent" breakdown
// above. Only OPEN cards count: `card.archived` excludes archived cards, and
// an end date (endAt, i.e. `completionDate` finding a value) means the card
// is already done and drops out even if it is not archived. A card with no
// dueAt is not part of "remaining time until due" at all and is skipped.
// An overdue card (dueAt already in the past) contributes its NEGATIVE
// remaining time rather than 0: the issue's own "remaining: 6 days and 9
// hours" wants one running total, and silently flooring overdue cards to 0
// would hide exactly the cards most worth surfacing (the ones already late)
// behind cards that still have time left - the total should get SMALLER,
// not stay flat, when a card slips past its due date.
function computeRemainingTimeSum(cards, now = new Date()) {
  const nowMs = now.getTime();
  const openCardsWithDue = cards.filter(card =>
    !card.archived && !completionDate(card) && card.dueAt);
  const totalMs = openCardsWithDue.reduce((sum, card) => {
    const dueMs = new Date(card.dueAt).getTime();
    return sum + (dueMs - nowMs);
  }, 0);
  const totalHours = totalMs / (1000 * 60 * 60);
  const sign = totalHours < 0 ? -1 : 1;
  const absHours = Math.round(Math.abs(totalHours));
  let days = Math.floor(absHours / 24);
  let hours = absHours - days * 24;
  if (hours === 24) { // rounding can push the remainder up to a full day
    days += 1;
    hours = 0;
  }
  return {
    totalHours: Math.round(totalHours * 100) / 100,
    days: days * sign,
    hours: hours === 0 ? 0 : hours * sign, // avoid a signed -0 when the hour part is exactly 0
    cardCount: openCardsWithDue.length,
  };
}

// Formats computeRemainingTimeSum's {days, hours} as the issue's own
// "6 days and 9 hours" shape - here "X days, Y hours", matching the format
// requested in #1121. An overdue total (days/hours negative) prints as
// "-X days, Y hours": one leading minus on the whole duration rather than a
// minus on each half, since "-6 days, -9 hours" reads as two separate
// negatives instead of one overdue amount.
function formatRemainingTime(remaining, translate = (key, fallback) => fallback) {
  const negative = remaining.days < 0 || remaining.hours < 0;
  const days = Math.abs(remaining.days);
  const hours = Math.abs(remaining.hours);
  const daysLabel = translate('days', 'days');
  const hoursLabel = translate('hours', 'hours');
  return `${negative ? '-' : ''}${days} ${daysLabel}, ${hours} ${hoursLabel}`;
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
  computeCompletionForecast,
  computeFlowEfficiency,
  computeActivityPulse,
  computeDashboardGroups,
  NO_ASSIGNEE_GROUP,
  NO_LABEL_GROUP,
  translateGroupLabel,
  computeTimeByGroup,
  computeTimeByCard,
  computeCardsByAssigneeGroup,
  computeCardsByCustomFieldGroup,
  NO_ROADMAP_GROUP,
  computeRemainingTimeSum,
  formatRemainingTime,
};
