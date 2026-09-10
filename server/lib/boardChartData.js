// Loads the plain records one board report chart needs and hands them to the
// pure calculations in models/lib/chartCalculations.js. Shared by the
// `boardChartData` Meteor method (server/publications/boards.js) and the
// chart PDF/Excel export routes (models/exportCharts.js) so the two answer
// with the same numbers. Callers are responsible for the authorization check
// (board.isVisibleBy) - this module only reads data.
import { ReactiveCache } from '/imports/reactiveCache';
import Cards from '/models/cards';
import Activities from '/models/activities';

const {
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
  computeTimeByGroup,
  computeTimeByCard,
  computeCardsByAssigneeGroup,
} = require('/models/lib/chartCalculations');

export async function loadBoardChartData(boardId, chartKey) {
  const board = await ReactiveCache.getBoard(boardId);
  if (!board) return null;

  const lists = await ReactiveCache.getLists({ boardId, archived: false }, { sort: { sort: 1 } });
  const cardFields = {
    fields: {
      title: 1, listId: 1, createdAt: 1, archivedAt: 1, archived: 1,
      startAt: 1, endAt: 1, dueAt: 1, spentTime: 1, isOvertime: 1,
      assignees: 1, members: 1, labelIds: 1,
    },
  };
  const allCards = await Cards.find({ boardId }, cardFields).fetchAsync();
  const firstCreatedAt = allCards.reduce(
    (min, card) => (!min || card.createdAt < min ? card.createdAt : min), null);
  const fromDate = firstCreatedAt || new Date();
  const toDate = new Date();

  if (chartKey === 'cumulativeFlow' || chartKey === 'wipRun') {
    const events = await Activities.find(
      { boardId, activityType: { $in: ['createCard', 'moveCard', 'archivedCard', 'restoredCard'] } },
      { fields: { activityType: 1, cardId: 1, listId: 1, createdAt: 1 }, sort: { createdAt: 1 } },
    ).fetchAsync();

    if (chartKey === 'cumulativeFlow') {
      return {
        lists: lists.map(list => ({ _id: list._id, title: list.title })),
        series: computeCumulativeFlow(lists, events, fromDate, toDate),
      };
    }
    const wipListIds = lists.length > 2 ? lists.slice(1, -1).map(l => l._id) : lists.map(l => l._id);
    const wipLimit = lists.length > 2
      ? lists.slice(1, -1).reduce((sum, list) =>
        (list.wipLimit && list.wipLimit.enabled) ? sum + (list.wipLimit.value || 0) : sum, 0) || null
      : null;
    return { series: computeWipRun(wipListIds, events, fromDate, toDate, wipLimit) };
  }

  if (chartKey === 'controlChart') return { points: computeControlChart(allCards) };
  if (chartKey === 'leadTime' || chartKey === 'cycleTime') return { points: computeLeadCycleTime(allCards) };
  if (chartKey === 'burndown') return { series: computeBurndown(allCards, fromDate, toDate) };
  if (chartKey === 'burnup') return { series: computeBurnup(allCards, fromDate, toDate) };
  if (chartKey === 'throughputHistogram') return { series: computeThroughput(allCards, 'week') };
  if (chartKey === 'flowEfficiency') return { points: computeFlowEfficiency(allCards) };

  if (chartKey === 'gantt') {
    return {
      cards: allCards
        .filter(card => card.startAt || card.dueAt || card.endAt || card.createdAt)
        .sort((a, b) => new Date(a.startAt || a.createdAt) - new Date(b.startAt || b.createdAt))
        .map(card => ({
          title: card.title, startAt: card.startAt || null, dueAt: card.dueAt || null, endAt: card.endAt || null,
        })),
    };
  }

  if (chartKey === 'dashboard' || chartKey === 'time' || chartKey === 'groupByAssignee') {
    const usersById = {};
    const userIds = new Set();
    allCards.forEach(card => (card.assignees || []).forEach(id => userIds.add(id)));
    await Promise.all([...userIds].map(async id => {
      usersById[id] = await ReactiveCache.getUser({ _id: id });
    }));
    const nameOf = id => (usersById[id] && (usersById[id].profile?.fullname || usersById[id].username)) || id;

    if (chartKey === 'time') {
      // #812 ("reporting total hours by resource and task type"): who logged
      // how many hours, and which cards those hours went to. Matches the
      // Time view's own "archived: false" summary above it.
      const activeCards = allCards.filter(card => !card.archived);
      return {
        byAssignee: computeTimeByGroup(activeCards, card =>
          (card.assignees || []).map(id => ({ key: id, label: nameOf(id) })), NO_ASSIGNEE_GROUP),
        byCard: computeTimeByCard(activeCards),
      };
    }

    if (chartKey === 'groupByAssignee') {
      // #4688 ("grouping cards by assignee"): the same "which cards count
      // under which assignee" fold the Dashboard/Time views already use,
      // but returning the cards themselves rather than a count/hours total,
      // for a team-meeting-friendly read-only overview. Archived cards are
      // excluded, matching the Time view's own "archived: false" summary.
      const activeCards = allCards.filter(card => !card.archived);
      return {
        groups: computeCardsByAssigneeGroup(activeCards, card =>
          (card.assignees || []).map(id => ({ key: id, label: nameOf(id) })), NO_ASSIGNEE_GROUP),
      };
    }

    const labelById = Object.fromEntries((board.labels || []).map(l => [l._id, l.name || l.color]));
    return {
      byAssignee: computeDashboardGroups(allCards, card =>
        (card.assignees || []).map(id => ({ key: id, label: nameOf(id) })), NO_ASSIGNEE_GROUP),
      byLabel: computeDashboardGroups(allCards, card =>
        (card.labelIds || []).map(id => ({ key: id, label: labelById[id] || id })), NO_LABEL_GROUP),
      byList: computeDashboardGroups(allCards, card =>
        [{ key: card.listId, label: (lists.find(l => l._id === card.listId) || {}).title || card.listId }]),
    };
  }

  return null;
}
