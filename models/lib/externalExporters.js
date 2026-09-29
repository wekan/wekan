import { ReactiveCache } from '/imports/reactiveCache';
import { formatters, EXTERNAL_EXPORT_FORMATS } from './externalExportFormatters';
const { jiraTimeTrackingExport } = require('./jiraTimeTracking');
const { jiraScrumMetadataExport } = require('./jiraScrumMetadata');
const { jiraEstimateExportMapping, jiraEstimateExportValue } = require('./jiraEstimateMapping');
const { buildCustomFieldsWD } = require('./customFieldsWD');
const { notDeleted } = require('./softDelete');

export { EXTERNAL_EXPORT_FORMATS };

// Generalized export: collect a WeKan board into a neutral intermediate, then a
// per-format formatter (externalExportFormatters.js) emits the target
// platform's JSON shape. This mirrors the generalized import
// (externalParsers.js): one collector + a map of formatters.

// #1173: what the export selection can reach in these formats. Selection
// gates the parts that ARE here - description, labels, dates, people,
// comments, checklists, subtasks and custom fields - and each formatter drops
// what its format has no field for.
function gateItem(item, wanted) {
  if (!wanted) return item;
  const out = { ...item };
  if (!wanted.has('description')) out.description = '';
  if (!wanted.has('labels')) { out.labelIds = []; out.labels = []; }
  if (!wanted.has('dates')) delete out.dueAt;
  return out;
}

const iso = value => (value ? new Date(value).toISOString() : undefined);

async function collect(boardId, fields, format) {
  const board = await ReactiveCache.getBoard(boardId);
  const lists = await ReactiveCache.getLists({ boardId, archived: false }, { sort: { sort: 1 } });
  const swimlanes = await ReactiveCache.getSwimlanes({ boardId, archived: false }, { sort: { sort: 1 } });
  const cards = await ReactiveCache.getCards({ boardId, archived: false }, { sort: { sort: 1 } });
  const listById = {};
  const listRecords = new Map(lists.map(list => [list._id, list]));
  lists.forEach(l => { listById[l._id] = l.title; });
  const swById = {};
  swimlanes.forEach(s => { swById[s._id] = s.title; });
  const labelById = {};
  (board.labels || []).forEach(l => { labelById[l._id] = l.name; });
  const wanted = fields && fields.length ? new Set(fields) : null;
  const want = key => !wanted || wanted.has(key);
  const timeFields = format === 'jira' && want('custom-fields')
    ? await ReactiveCache.getCustomFields({ boardIds: boardId, type: 'number' }) : [];
  const estimateMapping = format === 'jira' ? jiraEstimateExportMapping(timeFields, wanted) : null;

  // The rest of a card, read once per board and only when selected. Custom
  // fields reach this export only after server/lib/adminOnlyCustomFields
  // assertFieldExport has let this caller read every value on the board.
  const cardIds = cards.map(c => c._id);
  const comments = want('comments') && cardIds.length
    ? await ReactiveCache.getCardComments(notDeleted({ cardId: { $in: cardIds } }), { sort: { createdAt: 1 } }) : [];
  const checklists = want('checklists') && cardIds.length
    ? await ReactiveCache.getChecklists(notDeleted({ cardId: { $in: cardIds } }), { sort: { sort: 1 } }) : [];
  const checklistItems = checklists.length
    ? await ReactiveCache.getChecklistItems(notDeleted({ checklistId: { $in: checklists.map(c => c._id) } }), { sort: { sort: 1 } }) : [];
  const definitions = want('custom-fields')
    ? (await ReactiveCache.getCustomFields({ boardIds: boardId }))
      // Jira's time tracking and estimate carry these already.
      .filter(d => format !== 'jira' || !(d.settings && (d.settings.jiraTimeField || d.settings.jiraEstimateFieldId)))
    : [];
  const userIds = new Set();
  if (want('people')) cards.forEach(c => [c.userId, ...(c.assignees || []), ...(c.members || [])].forEach(id => id && userIds.add(id)));
  comments.forEach(c => c.userId && userIds.add(c.userId));
  const users = userIds.size ? await ReactiveCache.getUsers({ _id: { $in: [...userIds] } }) : [];
  const username = id => (users.find(u => u._id === id) || {}).username;

  const items = cards.map(c => {
    const people = want('people') ? [...(c.assignees || []), ...(c.members || [])].map(username).filter(Boolean) : [];
    const cardChecklists = checklists.filter(cl => cl.cardId === c._id).map(cl => ({
      title: cl.title,
      items: checklistItems.filter(it => it.checklistId === cl._id).map(it => ({ title: it.title, done: Boolean(it.isFinished) })),
    }));
    const customFields = {};
    for (const field of buildCustomFieldsWD(c.customFields, definitions)) {
      const value = field.trueValue;
      if (value === undefined || value === null || value === '') continue;
      customFields[field.definition.name] = value;
    }
    return {
      ...(format === 'jira' ? { jiraEstimate: jiraEstimateExportValue(c, estimateMapping) } : {}),
      ...(format === 'jira' ? { timetracking: jiraTimeTrackingExport(c, timeFields, wanted) } : {}),
      ...(format === 'jira' ? { jiraScrum: jiraScrumMetadataExport(c, listRecords.get(c.listId), wanted) } : {}),
      cardId: c._id,
      listId: c.listId,
      title: c.title,
      description: c.description || '',
      listTitle: listById[c.listId] || '',
      swimlaneTitle: swById[c.swimlaneId] || 'Default',
      dueAt: iso(c.dueAt),
      labelIds: c.labelIds || [],
      labels: (c.labelIds || []).map(id => labelById[id]).filter(Boolean),
      ...(want('dates') ? { startAt: iso(c.startAt), endAt: iso(c.endAt), createdAt: iso(c.createdAt) } : {}),
      ...(want('people') ? {
        owner: people[0], assignees: people.slice(1), creator: username(c.userId), requestedBy: c.requestedBy || undefined,
      } : {}),
      ...(want('subtasks') && c.parentId ? { parentCardId: c.parentId } : {}),
      ...(comments.length ? { comments: comments.filter(cm => cm.cardId === c._id)
        .map(cm => ({ text: cm.text, author: username(cm.userId), date: iso(cm.createdAt) })) } : {}),
      ...(cardChecklists.length ? { checklists: cardChecklists } : {}),
      ...(Object.keys(customFields).length ? { customFields } : {}),
    };
  });
  return { board, lists, swimlanes, jiraEstimateMapping: estimateMapping,
    items: items.map(item => gateItem(item, wanted)) };
}

export async function buildExternalExport(boardId, format, fields) {
  const formatter = formatters[format];
  if (!formatter) return null;
  const formatted = formatter(await collect(boardId, fields, format));
  return require('/server/lib/secureTransfer').secureTransfer(formatted, {
    direction: 'export', source: `export:${format}`,
  });
}
