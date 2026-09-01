const DASHBOARD_PAGE_SIZE = 10;
const DASHBOARD_MAX_PAGE_SIZE = 50;
const MAP_POINT_LIMIT = 200;
const DASHBOARD_DIMENSIONS = ['list', 'member', 'label', 'due'];

function dayBounds(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function dueBucket(card, now = new Date()) {
  if (!card || !card.dueAt) return 'none';
  const due = new Date(card.dueAt);
  if (Number.isNaN(due.getTime())) return 'none';
  const { start, end } = dayBounds(now);
  if (due < start) return 'overdue';
  if (due < end) return 'today';
  return 'upcoming';
}

function extractLocations(card) {
  const locations = Array.isArray(card?.locations) ? card.locations : [];
  const valid = locations.filter(
    location =>
      Number.isFinite(location?.latitude) &&
      Number.isFinite(location?.longitude),
  );
  if (valid.length) return valid;
  if (
    Number.isFinite(card?.locationLatitude) &&
    Number.isFinite(card?.locationLongitude)
  ) {
    return [{
      _id: 'legacy',
      name: card.locationName || '',
      address: card.locationAddress || '',
      latitude: card.locationLatitude,
      longitude: card.locationLongitude,
    }];
  }
  return [];
}

function countBy(values) {
  const counts = new Map();
  values.forEach(value => {
    if (!value) return;
    counts.set(value, (counts.get(value) || 0) + 1);
  });
  return counts;
}

function bucketsFrom(counts, labels, fallbackPrefix) {
  return [...counts.entries()]
    .map(([key, count]) => ({
      key,
      label: labels.get(key) || `${fallbackPrefix} ${key}`,
      count,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function buildBoardDashboard({
  cards = [],
  lists = [],
  members = [],
  labels = [],
  now = new Date(),
}) {
  const listLabels = new Map(lists.map(list => [list._id, list.title]));
  const memberLabels = new Map(
    members.map(member => [member._id, member.fullname || member.username || member._id]),
  );
  const labelLabels = new Map(
    labels.map(label => [label._id, label.name || label.color || label._id]),
  );

  const listCounts = countBy(cards.map(card => card.listId));
  const memberCounts = countBy(cards.flatMap(card => [
    ...(card.members || []),
    ...(card.assignees || []),
  ].filter((id, index, all) => all.indexOf(id) === index)));
  const labelCounts = countBy(cards.flatMap(card => card.labelIds || []));
  const dueCounts = countBy(cards.map(card => dueBucket(card, now)));
  const dueLabels = new Map([
    ['overdue', 'dashboard-due-overdue'],
    ['today', 'dashboard-due-today'],
    ['upcoming', 'dashboard-due-upcoming'],
    ['none', 'dashboard-due-none'],
  ]);

  const mapPoints = [];
  cards.forEach(card => {
    extractLocations(card).forEach(location => {
      if (mapPoints.length >= MAP_POINT_LIMIT) return;
      mapPoints.push({
        cardId: card._id,
        cardTitle: card.title,
        listId: card.listId,
        listTitle: listLabels.get(card.listId) || '',
        locationId: location._id || 'legacy',
        name: location.name || '',
        address: location.address || '',
        latitude: location.latitude,
        longitude: location.longitude,
      });
    });
  });

  const mapPointTotal = cards.reduce(
    (total, card) => total + extractLocations(card).length,
    0,
  );

  return {
    cardCount: cards.length,
    dimensions: {
      list: bucketsFrom(listCounts, listLabels, 'List'),
      member: bucketsFrom(memberCounts, memberLabels, 'Member'),
      label: bucketsFrom(labelCounts, labelLabels, 'Label'),
      due: bucketsFrom(dueCounts, dueLabels, 'Due'),
    },
    mapPoints,
    mapPointTotal,
    mapPointsTruncated: mapPointTotal > MAP_POINT_LIMIT,
  };
}

function normalizeDashboardPage(skip, limit) {
  const safeSkip = Math.max(0, Number.isInteger(skip) ? skip : 0);
  const numericLimit = Number.isInteger(limit) ? limit : DASHBOARD_PAGE_SIZE;
  return {
    skip: safeSkip,
    limit: Math.min(DASHBOARD_MAX_PAGE_SIZE, Math.max(1, numericLimit)),
  };
}

function normalizeDashboardDimension(dimension) {
  return DASHBOARD_DIMENSIONS.includes(dimension) ? dimension : null;
}

function dashboardSelector(dimension, key, now = new Date()) {
  if (!normalizeDashboardDimension(dimension) || typeof key !== 'string') return null;
  if (dimension === 'list') return { listId: key };
  if (dimension === 'member') return { $or: [{ members: key }, { assignees: key }] };
  if (dimension === 'label') return { labelIds: key };
  const { start, end } = dayBounds(now);
  if (key === 'overdue') return { dueAt: { $lt: start } };
  if (key === 'today') return { dueAt: { $gte: start, $lt: end } };
  if (key === 'upcoming') return { dueAt: { $gte: end } };
  if (key === 'none') {
    return { $or: [{ dueAt: { $exists: false } }, { dueAt: null }] };
  }
  return null;
}

module.exports = {
  DASHBOARD_PAGE_SIZE,
  DASHBOARD_MAX_PAGE_SIZE,
  MAP_POINT_LIMIT,
  buildBoardDashboard,
  dashboardSelector,
  dueBucket,
  extractLocations,
  normalizeDashboardDimension,
  normalizeDashboardPage,
};
