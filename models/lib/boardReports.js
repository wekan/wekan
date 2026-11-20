'use strict';
// The Board View reports added on 2026-11-20 (TODO.md "Reports to add to Board
// Views"), as pure calculations: no Mongo, no Meteor, so
// tests/boardReports.test.cjs drives them with plain records. The server
// (server/lib/boardChartData.js) loads the records; every report answers the
// same shape, so the chart view (client/components/boards/charts/boardCharts.js)
// draws its bars and the PDF and Excel exports (models/lib/chartExportRows.js)
// write its table without knowing which report it is:
//
//   { bars: [{ label, value }], table: { headers: [[key, fallback]], rows: [[...]] } }
//
// A card is FINISHED at card.endAt, else card.archivedAt (as the other charts,
// models/lib/chartCalculations.js completionDate); a card not finished is open.

const DAY = 86400000;
const MAX_BARS = 24;

const finishedAt = card => card.endAt || card.archivedAt || null;
const time = value => (value ? new Date(value).getTime() : NaN);
const round = (value, digits = 1) => {
  const f = 10 ** digits;
  return Math.round((Number(value) || 0) * f) / f;
};

// Monday of the UTC week a date is in, as YYYY-MM-DD.
function weekOf(value) {
  const d = new Date(value);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}
function weeksBetween(from, to) {
  const out = [];
  const cursor = new Date(`${weekOf(from)}T00:00:00Z`);
  const end = time(`${weekOf(to)}T00:00:00Z`);
  while (cursor.getTime() <= end) {
    out.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }
  return out;
}
function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const rank = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (rank - lo);
}
const median = values => percentile(values, 50);
const lastBars = bars => bars.slice(-MAX_BARS);
// The weeks the board has cards in, at most the last 52.
function boardWeeks(cards, now) {
  const first = cards.reduce((min, c) => (time(c.createdAt) < min ? time(c.createdAt) : min), time(now));
  return weeksBetween(Math.max(first, time(now) - 52 * 7 * DAY), now);
}

const H = {
  week: ['week', 'Week'], cards: ['cards', 'Cards'], list: ['list', 'List'], open: ['open', 'Open'],
  done: ['done', 'Done'], resolved: ['resolved', 'Resolved'], created: ['report-created', 'Created'],
  net: ['report-net', 'Net'], arrivals: ['report-arrivals', 'Arrivals'], departures: ['report-departures', 'Departures'],
  medianDays: ['report-median-days', 'Median (days)'], p85: ['flow-p85', 'Stage 85th percentile (days)'],
  averageAge: ['report-average-age', 'Average age (days)'], median: ['report-median', 'Median'],
  person: ['person', 'Person'], labels: ['labels', 'Labels'], share: ['report-share', 'Share %'],
  onTime: ['report-on-time', 'On time'], late: ['report-late', 'Late'], noDue: ['report-no-due-date', 'No due date'],
  daysLate: ['report-average-days-late', 'Average days late'], release: ['scrum-release', 'Release'],
  remaining: ['report-remaining', 'Remaining'], projected: ['report-projected-finish', 'Projected finish'],
  card: ['card', 'Card'], subtasks: ['subtasks', 'Subtasks'], progress: ['progress', 'Progress'],
  relation: ['dependency-type', 'Relation type'], dependsOn: ['report-depends-on', 'Depends on'],
  blocked: ['report-blocked-chain', 'Blocked chain'], day: ['day', 'Day'], hour: ['report-hour', 'Hour'],
  changes: ['report-changes', 'Changes'], status: ['status', 'Status'],
};

// Created vs. Resolved: cards added and finished per week, and how many are
// open at the end of each week.
function createdVsResolved({ cards, now }) {
  const weeks = boardWeeks(cards, now);
  let open = cards.filter(c => time(c.createdAt) < time(`${weeks[0]}T00:00:00Z`)
    && !(time(finishedAt(c)) < time(`${weeks[0]}T00:00:00Z`))).length;
  const rows = weeks.map(week => {
    const created = cards.filter(c => c.createdAt && weekOf(c.createdAt) === week).length;
    const resolved = cards.filter(c => finishedAt(c) && weekOf(finishedAt(c)) === week).length;
    open += created - resolved;
    return [week, created, resolved, open];
  });
  return { bars: lastBars(rows.map(r => ({ label: r[0], value: r[3] }))), table: { headers: [H.week, H.created, H.resolved, H.open], rows } };
}

// Net Flow: departures less arrivals per week; positive means the board is
// emptying, negative that work arrives faster than it leaves.
function netFlow({ cards, now }) {
  const rows = boardWeeks(cards, now).map(week => {
    const arrivals = cards.filter(c => c.createdAt && weekOf(c.createdAt) === week).length;
    const departures = cards.filter(c => finishedAt(c) && weekOf(finishedAt(c)) === week).length;
    return [week, arrivals, departures, departures - arrivals];
  });
  return { bars: lastBars(rows.map(r => ({ label: r[0], value: r[3] }))), table: { headers: [H.week, H.arrivals, H.departures, H.net], rows } };
}

// Time in List: how long cards stayed in each list, from the change history
// of their moves ({ entityId, previousContent.listId, newContent.listId,
// createdAt }). A card with no move stayed in its list from its creation.
function timeInList({ cards, lists, history = [], now }) {
  const moves = new Map();
  for (const row of history) {
    if (!row || !row.newContent || row.newContent.listId === undefined) continue;
    if (!moves.has(row.entityId)) moves.set(row.entityId, []);
    moves.get(row.entityId).push(row);
  }
  const spans = new Map(lists.map(l => [l._id, []]));
  for (const card of cards) {
    const own = (moves.get(card._id) || []).slice().sort((a, b) => time(a.createdAt) - time(b.createdAt));
    const end = time(finishedAt(card)) || time(now);
    let list = own.length ? own[0].previousContent && own[0].previousContent.listId : card.listId;
    let since = time(card.createdAt);
    for (const move of own) {
      const at = time(move.createdAt);
      if (list && spans.has(list) && at > since) spans.get(list).push((at - since) / DAY);
      list = move.newContent.listId;
      since = at;
    }
    if (list && spans.has(list) && end > since) spans.get(list).push((end - since) / DAY);
  }
  const rows = lists.map(l => {
    const days = spans.get(l._id);
    return [l.title, days.length, round(median(days)), round(percentile(days, 85))];
  });
  return { bars: rows.map(r => ({ label: r[0], value: r[2] })), table: { headers: [H.list, H.cards, H.medianDays, H.p85], rows } };
}

// Average Age: at the end of each week, the mean age in days of the cards
// open then.
function averageAge({ cards, now }) {
  const rows = boardWeeks(cards, now).map(week => {
    const at = Math.min(time(`${week}T00:00:00Z`) + 7 * DAY, time(now));
    const open = cards.filter(c => time(c.createdAt) <= at && !(time(finishedAt(c)) <= at));
    const age = open.length ? open.reduce((sum, c) => sum + (at - time(c.createdAt)) / DAY, 0) / open.length : 0;
    return [week, open.length, round(age)];
  });
  return { bars: lastBars(rows.map(r => ({ label: r[0], value: r[2] }))), table: { headers: [H.week, H.open, H.averageAge], rows } };
}

// Throughput Run Chart: cards finished per week, in order, with the median
// of the weeks shown.
function throughputRun({ cards, now }) {
  const counts = boardWeeks(cards, now).map(week => [week, cards.filter(c => finishedAt(c) && weekOf(finishedAt(c)) === week).length]);
  const mid = round(median(counts.map(r => r[1])));
  const rows = counts.map(([week, count]) => [week, count, mid]);
  return { bars: lastBars(rows.map(r => ({ label: r[0], value: r[1] }))), table: { headers: [H.week, H.done, H.median], rows } };
}

// Workload: the open cards of each person (assignees, else members), and how
// many of them are in each list.
function workload({ cards, lists, nameOf = id => id }) {
  const open = cards.filter(c => !finishedAt(c));
  const people = new Map();
  for (const card of open) {
    const ids = (card.assignees && card.assignees.length ? card.assignees : card.members) || [];
    for (const id of ids.length ? ids : ['']) {
      if (!people.has(id)) people.set(id, new Map());
      const byList = people.get(id);
      byList.set(card.listId, (byList.get(card.listId) || 0) + 1);
    }
  }
  const rows = [...people.entries()].map(([id, byList]) => [id ? nameOf(id) : '-',
    [...byList.values()].reduce((a, b) => a + b, 0), ...lists.map(l => byList.get(l._id) || 0)])
    .sort((a, b) => b[1] - a[1]);
  return { bars: rows.slice(0, MAX_BARS).map(r => ({ label: r[0], value: r[1] })),
    table: { headers: [H.person, H.open, ...lists.map(l => [null, l.title])], rows } };
}

// Distribution: open and finished cards by label, with each label's share of
// the open ones. A card with no label is counted under "-".
function distribution({ cards, labels = [] }) {
  const name = new Map(labels.map(l => [l._id, l.name || l.color || l._id]));
  const groups = new Map();
  for (const card of cards) {
    const ids = card.labelIds && card.labelIds.length ? card.labelIds : [''];
    for (const id of ids) {
      const key = id ? name.get(id) || id : '-';
      const g = groups.get(key) || { open: 0, done: 0 };
      if (finishedAt(card)) g.done += 1; else g.open += 1;
      groups.set(key, g);
    }
  }
  const totalOpen = [...groups.values()].reduce((s, g) => s + g.open, 0) || 1;
  const rows = [...groups.entries()].map(([key, g]) => [key, g.open, g.done, round((g.open / totalOpen) * 100)])
    .sort((a, b) => b[1] - a[1]);
  return { bars: rows.slice(0, MAX_BARS).map(r => ({ label: r[0], value: r[1] })),
    table: { headers: [H.labels, H.open, H.done, H.share], rows } };
}

// Due Date Performance: cards finished per week - on time (by their due
// date), late, without a due date - and how many days late the late ones were.
function dueDatePerformance({ cards, now }) {
  const rows = boardWeeks(cards, now).map(week => {
    const done = cards.filter(c => finishedAt(c) && weekOf(finishedAt(c)) === week);
    const late = done.filter(c => c.dueAt && time(finishedAt(c)) > time(c.dueAt));
    const onTime = done.filter(c => c.dueAt && time(finishedAt(c)) <= time(c.dueAt)).length;
    const daysLate = late.length ? late.reduce((s, c) => s + (time(finishedAt(c)) - time(c.dueAt)) / DAY, 0) / late.length : 0;
    return [week, onTime, late.length, done.filter(c => !c.dueAt).length, round(daysLate)];
  });
  return { bars: lastBars(rows.map(r => ({ label: r[0], value: r[1] + r[2] ? round((r[1] / (r[1] + r[2])) * 100) : 0 }))),
    table: { headers: [H.week, H.onTime, H.late, H.noDue, H.daysLate], rows } };
}

// Release Burndown: per Scrum release, its cards, those done, those left, and
// when the rest would be done at the weekly rate of the last four weeks.
function releaseBurndown({ cards, releases = [], now }) {
  const weekAgo = n => time(now) - n * 7 * DAY;
  const recent = cards.filter(c => time(finishedAt(c)) >= weekAgo(4)).length / 4;
  const rows = releases.map(release => {
    // releaseId and releaseIds both (models/lib/scrum.js cardReleaseIds).
    const own = cards.filter(c => require('./scrum').cardReleaseIds(c.scrum).includes(release._id));
    const done = own.filter(c => finishedAt(c)).length;
    const left = own.length - done;
    const finish = !left ? '' : recent > 0 ? new Date(time(now) + Math.ceil(left / recent) * 7 * DAY).toISOString().slice(0, 10) : '-';
    return [release.name || release._id, own.length, done, left, finish];
  });
  return { bars: rows.map(r => ({ label: r[0], value: r[3] })), table: { headers: [H.release, H.cards, H.done, H.remaining, H.projected], rows } };
}

// Epic Progress: every card with subtasks, its subtasks done and open, and the
// share done.
function epicProgress({ cards }) {
  const byId = new Map(cards.map(c => [c._id, c]));
  const children = new Map();
  for (const card of cards) {
    if (card.parentId && byId.has(card.parentId)) {
      if (!children.has(card.parentId)) children.set(card.parentId, []);
      children.get(card.parentId).push(card);
    }
  }
  const rows = [...children.entries()].map(([id, kids]) => {
    const done = kids.filter(k => finishedAt(k)).length;
    return [byId.get(id).title, kids.length, done, kids.length - done, round((done / kids.length) * 100)];
  }).sort((a, b) => a[4] - b[4]);
  return { bars: rows.slice(0, MAX_BARS).map(r => ({ label: r[0], value: r[4] })),
    table: { headers: [H.card, H.subtasks, H.done, H.open, H.progress], rows } };
}

// Dependency Map: each dependency of an open card, and the length of the chain
// of open cards it waits on - the longest blocked chains first.
function dependencyMap({ cards }) {
  const byId = new Map(cards.map(c => [c._id, c]));
  const deps = c => (Array.isArray(c.cardDependencies) ? c.cardDependencies : []).filter(d => d && byId.has(d.cardId));
  const memo = new Map();
  const chain = (id, seen = new Set()) => {
    if (memo.has(id)) return memo.get(id);
    if (seen.has(id)) return 0;
    seen.add(id);
    const card = byId.get(id);
    const open = deps(card).filter(d => !finishedAt(byId.get(d.cardId)));
    const length = open.length ? 1 + Math.max(...open.map(d => chain(d.cardId, seen))) : 0;
    memo.set(id, length);
    return length;
  };
  const rows = [];
  for (const card of cards.filter(c => !finishedAt(c))) {
    for (const dep of deps(card)) {
      const other = byId.get(dep.cardId);
      rows.push([card.title, dep.type || 'relates', other.title, finishedAt(other) ? 'done' : 'open', chain(card._id)]);
    }
  }
  rows.sort((a, b) => b[4] - a[4]);
  const seen = new Set();
  const bars = rows.filter(r => !seen.has(r[0]) && seen.add(r[0])).slice(0, MAX_BARS).map(r => ({ label: r[0], value: r[4] }));
  return { bars, table: { headers: [H.card, H.relation, H.dependsOn, H.status, H.blocked], rows } };
}

// Activity Heatmap: the board's changes by weekday and hour (UTC). The table
// is the heatmap, a row per weekday and a column per hour; the bars are each
// weekday's total.
const WEEKDAYS = [['monday', 'Monday'], ['tuesday', 'Tuesday'], ['wednesday', 'Wednesday'], ['thursday', 'Thursday'],
  ['friday', 'Friday'], ['saturday', 'Saturday'], ['sunday', 'Sunday']];
function activityHeatmap({ activities = [] }) {
  const grid = WEEKDAYS.map(() => Array(24).fill(0));
  for (const a of activities) {
    const t = new Date(a.createdAt);
    if (Number.isNaN(t.getTime())) continue;
    grid[(t.getUTCDay() + 6) % 7][t.getUTCHours()] += 1;
  }
  const rows = grid.map((hours, i) => [WEEKDAYS[i], ...hours]);
  return { bars: grid.map((hours, i) => ({ label: WEEKDAYS[i], value: hours.reduce((a, b) => a + b, 0) })),
    table: { headers: [H.day, ...Array.from({ length: 24 }, (_, h) => [null, String(h).padStart(2, '0')])], rows } };
}

// The reports: chart key, Board View, label key and English title, what the
// server has to load, and the calculation.
const BOARD_REPORTS = [
  { key: 'createdResolved', view: 'board-view-created-resolved', icon: 'fa-exchange', title: 'Created vs. Resolved', compute: createdVsResolved },
  { key: 'netFlow', view: 'board-view-net-flow', icon: 'fa-balance-scale', title: 'Net Flow', compute: netFlow },
  { key: 'timeInList', view: 'board-view-time-in-list', icon: 'fa-hourglass-o', title: 'Time in List', needs: ['history'], compute: timeInList },
  { key: 'averageAge', view: 'board-view-average-age', icon: 'fa-birthday-cake', title: 'Average Age', compute: averageAge },
  { key: 'throughputRun', view: 'board-view-throughput-run', icon: 'fa-line-chart', title: 'Throughput Run Chart', compute: throughputRun },
  { key: 'workload', view: 'board-view-workload', icon: 'fa-user-circle', title: 'Workload', needs: ['users'], compute: workload },
  { key: 'distribution', view: 'board-view-distribution', icon: 'fa-pie-chart', title: 'Distribution', compute: distribution },
  { key: 'dueDatePerformance', view: 'board-view-due-date-performance', icon: 'fa-calendar-check-o', title: 'Due Date Performance', compute: dueDatePerformance },
  { key: 'releaseBurndown', view: 'board-view-release-burndown', icon: 'fa-flag', title: 'Release Burndown', needs: ['releases'], compute: releaseBurndown },
  { key: 'epicProgress', view: 'board-view-epic-progress', icon: 'fa-sitemap', title: 'Epic Progress', compute: epicProgress },
  { key: 'dependencyMap', view: 'board-view-dependency-map', icon: 'fa-share-alt', title: 'Dependency Map', compute: dependencyMap },
  { key: 'activityHeatmap', view: 'board-view-activity-heatmap', icon: 'fa-th', title: 'Activity Heatmap', needs: ['activities'], compute: activityHeatmap },
];
const REPORT_KEYS = BOARD_REPORTS.map(r => r.key);
const reportByKey = key => BOARD_REPORTS.find(r => r.key === key) || null;
const reportByView = view => BOARD_REPORTS.find(r => r.view === view) || null;

function computeBoardReport(key, input) {
  const report = reportByKey(key);
  if (!report) return null;
  return report.compute({ cards: [], lists: [], now: new Date(), ...input });
}

// A label that is a [key, fallback] pair (the weekdays) translated; a string
// stays as it is.
const labelText = (label, translate) => (Array.isArray(label) ? translate(label[0], label[1]) : label);

module.exports = {
  BOARD_REPORTS, REPORT_KEYS, reportByKey, reportByView, computeBoardReport, labelText,
  weekOf, median, percentile,
  createdVsResolved, netFlow, timeInList, averageAge, throughputRun, workload, distribution,
  dueDatePerformance, releaseBurndown, epicProgress, dependencyMap, activityHeatmap,
};
