import tableSort from '../../models/lib/tableViewSort.js';
const { compareTableViewRows } = tableSort;

export const TABLE_PAGE_SIZE = 25;
const fields = ['title', 'listTitle', 'swimlaneTitle', 'assigneesKey', 'membersKey', 'labelsKey',
  'receivedAt', 'startAt', 'dueAt', 'endAt'];
export function validTablePageOptions(value) {
  return value && Object.keys(value).length === 5 && typeof value.query === 'string' && value.query.length <= 512 &&
    fields.includes(value.sortField) && ['asc', 'desc'].includes(value.direction) &&
    typeof value.group === 'boolean' && Number.isSafeInteger(value.page) && value.page > 0;
}

// Sort/search across the complete authorized result, then ship only one page.
// The scan projects table metadata; full card documents are read for 25 IDs only.
export async function boardTablePage({ cards, lists, swimlanes, board, scope, selector, options, dates = card => card, stopped = () => false }) {
  const [listDocs, laneDocs] = await Promise.all([
    lists.find({ boardId: board._id, archived: false }, { projection: { title: 1 } }).toArray(),
    swimlanes.find({ boardId: board._id, archived: false }, { projection: { title: 1, sort: 1 } }).toArray(),
  ]);
  const listMap = new Map(listDocs.map(doc => [doc._id, doc]));
  const laneMap = new Map(laneDocs.map(doc => [doc._id, doc]));
  const labels = new Map((board.labels || []).map(label => [label._id, label.name || '']));
  const query = options.query.trim().toLowerCase(), rows = [];
  const scoped = { $and: [scope, selector] };
  const cursor = cards.find(scoped, { projection: { title: 1, listId: 1, swimlaneId: 1,
    labelIds: 1, members: 1, assignees: 1, type: 1, linkedId: 1, receivedAt: 1, startAt: 1, dueAt: 1, endAt: 1 } }).batchSize(250);
  try {
    for await (const card of cursor) {
      if (stopped()) break;
      const list = listMap.get(card.listId), lane = laneMap.get(card.swimlaneId);
      if (!list || !lane) continue;
      const labelNames = (card.labelIds || []).map(id => labels.get(id)).filter(name => name !== undefined);
      const resolvedDates = dates(card);
      const row = { _id: card._id, title: card.title || '', listTitle: list.title || '',
        swimlaneTitle: lane.title || '', swimlaneSort: lane.sort || 0, swimlaneId: lane._id,
        labelsKey: labelNames.join(' '), membersKey: (card.members || []).join(' '),
        assigneesKey: (card.assignees || []).join(' '), receivedAt: resolvedDates.receivedAt,
        startAt: resolvedDates.startAt, dueAt: resolvedDates.dueAt, endAt: resolvedDates.endAt };
      if (!query || [row.title, row.listTitle, row.swimlaneTitle, ...labelNames].join(' ').toLowerCase().includes(query)) rows.push(row);
    }
  } finally { await cursor.close(); }
  rows.sort((a, b) => {
    const groupOrder = options.group ? a.swimlaneSort - b.swimlaneSort ||
      a.swimlaneTitle.localeCompare(b.swimlaneTitle) || a.swimlaneId.localeCompare(b.swimlaneId) : 0;
    return groupOrder || compareTableViewRows(a, b, options.sortField, options.direction) || a._id.localeCompare(b._id);
  });
  const total = rows.length, page = Math.min(options.page, Math.max(1, Math.ceil(total / TABLE_PAGE_SIZE)));
  const ids = rows.slice((page - 1) * TABLE_PAGE_SIZE, page * TABLE_PAGE_SIZE).map(row => row._id);
  const docs = stopped() ? [] : await cards.find({ $and: [scoped, { _id: { $in: ids } }] }).toArray();
  const dateValues = rows.slice((page - 1) * TABLE_PAGE_SIZE, page * TABLE_PAGE_SIZE)
    .map(({ _id, receivedAt, startAt, dueAt, endAt }) => ({ _id, receivedAt: receivedAt ?? null,
      startAt: startAt ?? null, dueAt: dueAt ?? null, endAt: endAt ?? null }));
  return { ids, total, page, cards: docs, dateValues };
}
