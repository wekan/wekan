import { ReactiveCache } from '/imports/reactiveCache';
import { formatters, EXTERNAL_EXPORT_FORMATS } from './externalExportFormatters';
const { jiraTimeTrackingExport } = require('./jiraTimeTracking');
const { jiraScrumMetadataExport } = require('./jiraScrumMetadata');
const { jiraEstimateExportMapping, jiraEstimateExportValue } = require('./jiraEstimateMapping');
const { buildCustomFieldsWD } = require('./customFieldsWD');
const { notDeleted } = require('./softDelete');

export { EXTERNAL_EXPORT_FORMATS, formatters };

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

// Formats with a place for sprints and releases: GitLab iterations and
// milestones, OpenProject sprints and versions, Taiga milestones
// (externalExportFormatters.js).
const SCRUM_FORMATS = new Set(['gitlab', 'openproject', 'taiga']);
const PLANNING_FIELDS = { _id: 1, name: 1, goal: 1, notes: 1, state: 1, plannedStart: 1, plannedEnd: 1, releasedAt: 1 };
async function scrumPlanning(boardId) {
  const ScrumSprints = require('/models/scrumSprints').default;
  const ScrumReleases = require('/models/scrumReleases').default;
  const [sprints, releases] = await Promise.all([
    ScrumSprints.find({ boardId }, { fields: PLANNING_FIELDS, sort: { plannedStart: 1, name: 1 } }).fetchAsync(),
    ScrumReleases.find({ boardId }, { fields: PLANNING_FIELDS, sort: { plannedEnd: 1, name: 1 } }).fetchAsync(),
  ]);
  return { sprints, releases };
}

const WRIKE_FORMATS = new Set(['wrike', 'wrikeworkflow']);

// The board's rules as { trigger, action } with only the fields a Wrike
// status group is read from: the list a moveCard trigger names, and the
// action's type.
async function moveCompletionRules(boardId) {
  const rules = await ReactiveCache.getRules({ boardId });
  const out = [];
  for (const rule of rules || []) {
    const [trigger, action] = await Promise.all([ReactiveCache.getTrigger(rule.triggerId), ReactiveCache.getAction(rule.actionId)]);
    if (!trigger || !action) continue;
    out.push({ trigger: { activityType: trigger.activityType, listName: trigger.listName }, action: { actionType: action.actionType } });
  }
  return out;
}

// pageCardIds: only these cards (one page of a streamed export), else all.
// (Not `cardIds`: the body declares a const of that name, and a parameter of
// the same name is a SyntaxError the server died of on 2026-11-20.)
// light: the board's references for a paged export (models/lib/exportPaging.js
// `all`) - no description and no comment text, each comment only counted.
async function collect(boardId, fields, format, pageCardIds, light) {
  const board = await ReactiveCache.getBoard(boardId);
  const lists = await ReactiveCache.getLists({ boardId, archived: false }, { sort: { sort: 1 } });
  const swimlanes = await ReactiveCache.getSwimlanes({ boardId, archived: false }, { sort: { sort: 1 } });
  const cards = await ReactiveCache.getCards({ boardId, archived: false, ...(Array.isArray(pageCardIds) ? { _id: { $in: pageCardIds } } : {}) },
    { sort: { sort: 1 } });
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
  // Each card's releases become its fix versions (jiraScrumMetadata.js).
  const releases = format === 'jira' && want('scrum')
    ? new Map((await require('/models/scrumReleases').default.find({ boardId }, { fields: { _id: 1, boardId: 1, name: 1,
      state: 1, plannedEnd: 1, releasedAt: 1, notes: 1, provenance: 1 } }).fetchAsync()).map(release => [release._id, release]))
    : null;
  const planning = SCRUM_FORMATS.has(format) && want('scrum') ? await scrumPlanning(boardId) : null;
  // A Wrike status group comes from the board's move-and-complete rules
  // (models/lib/wrikeWorkflow.js), so both Wrike exports read them.
  const workflowRules = WRIKE_FORMATS.has(format) ? await moveCompletionRules(boardId) : null;

  // The rest of a card, read once per board and only when selected. Custom
  // fields reach this export only after server/lib/adminOnlyCustomFields
  // assertFieldExport has let this caller read every value on the board.
  const cardIds = cards.map(c => c._id);
  const comments = want('comments') && cardIds.length
    ? await ReactiveCache.getCardComments(notDeleted({ cardId: { $in: cardIds } }),
      { sort: { createdAt: 1 }, ...(light ? { fields: { cardId: 1, userId: 1, createdAt: 1 } } : {}) }) : [];
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
  // Admin Panel / Anonymize export users, for every external format: the names
  // and the cards' and comments' text (CrossBoardExportBleed - only the JSON
  // export anonymized).
  const anonymized = await require('./importExportSecurity').anonymizeExportIdentities({ boardId, users, cards, comments });
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
      ...(format === 'jira' ? { jiraScrum: jiraScrumMetadataExport(c, listRecords.get(c.listId), wanted, releases) } : {}),
      ...(planning && c.scrum ? { scrum: { sprintId: c.scrum.sprintId || undefined,
        // One release in these formats: the card's first (models/lib/scrum.js).
        firstReleaseId: require('./scrum').cardReleaseIds(c.scrum)[0] || undefined, backlogRank: c.scrum.backlogRank ?? undefined } } : {}),
      cardId: c._id,
      listId: c.listId,
      title: c.title,
      description: light ? '' : c.description || '',
      listTitle: listById[c.listId] || '',
      swimlaneTitle: swById[c.swimlaneId] || 'Default',
      dueAt: iso(c.dueAt),
      ...(c.dueAt && c.dueComplete ? { dueComplete: true } : {}),
      ...(c.color ? { color: c.color } : {}),
      labelIds: c.labelIds || [],
      labels: (c.labelIds || []).map(id => labelById[id]).filter(Boolean),
      ...(want('dates') ? { startAt: iso(c.startAt), endAt: iso(c.endAt), createdAt: iso(c.createdAt) } : {}),
      ...(want('people') ? {
        owner: people[0], assignees: people.slice(1), creator: username(c.userId), requestedBy: c.requestedBy || undefined,
      } : {}),
      ...(want('subtasks') && c.parentId ? { parentCardId: c.parentId } : {}),
      // Card dependencies, for formats with relations of their own (Redmine).
      ...(want('dependencies') && Array.isArray(c.cardDependencies) && c.cardDependencies.length ? {
        dependencies: c.cardDependencies.filter(dep => dep && dep.cardId).map(dep => ({ cardId: dep.cardId, type: dep.type })),
      } : {}),
      // Hours spent, for formats with a place for tracked time (Super Productivity).
      ...(want('dates') && Number(c.spentTime) > 0 ? { spentTime: Number(c.spentTime) } : {}),
      ...(comments.length ? { comments: comments.filter(cm => cm.cardId === c._id)
        // A light comment is only counted; its text is read with its page.
        .map(cm => ({ text: light ? '\u00b7' : cm.text, author: username(cm.userId), date: iso(cm.createdAt) })) } : {}),
      ...(cardChecklists.length ? { checklists: cardChecklists } : {}),
      // A card that came from mail keeps its sender, recipients and
      // Message-ID in an .mbox - not when Admin Panel anonymizes the export,
      // since they name people.
      ...(format === 'mbox' && !anonymized && want('people') && c.email && c.email.from ? { email: {
        from: { name: c.email.from.name || '', address: c.email.from.address || '' },
        to: Array.isArray(c.email.to) ? c.email.to : [],
        // Without brackets: the export boundary reads "<id@host>" as a tag.
        messageId: String(c.email.messageId || '').replace(/^<|>$/g, ''), at: iso(c.email.at),
      } } : {}),
      ...(Object.keys(customFields).length ? { customFields } : {}),
    };
  });
  return { board, lists, swimlanes, jiraEstimateMapping: estimateMapping,
    ...(planning ? { scrumSprints: planning.sprints, scrumReleases: planning.releases } : {}),
    ...(workflowRules ? { workflowRules } : {}),
    items: items.map(item => gateItem(item, wanted)) };
}

// A text export a page of cards at a time (server/lib/renderExternalExport.js
// streams the formats that are a sequence of independent parts): the board's
// card ids are read first, then each page is collected and passed through the
// export boundary as the whole document is, so only one page is in memory.
// With { paged: true } each page also carries the board's light references
// and its place (models/lib/exportPaging.js), for the formats whose rows refer
// to other cards; { byList: true } orders the cards list by list, as the
// formats that group by list write them. There is always at least one page,
// so a formatter writes its head and tail for an empty board too.
export async function* externalExportPages(boardId, format, fields, pageSize = 500, options = {}) {
  const { secureTransfer } = require('/server/lib/secureTransfer');
  const context = { direction: 'export', source: `export:${format}` };
  let all = null;
  let ids;
  // The board's, lists' and swimlanes' titles pass the boundary as the cards
  // do, on every page as in buildExternalExport below.
  const safeTitle = doc => (doc && typeof doc.title === 'string'
    ? Object.assign(Object.create(Object.getPrototypeOf(doc)), doc, { title: secureTransfer(doc.title, context) }) : doc);
  const safeParts = collected => ({ board: safeTitle(collected.board), lists: (collected.lists || []).map(safeTitle),
    swimlanes: (collected.swimlanes || []).map(safeTitle) });
  if (options.paged) {
    const light = await collect(boardId, fields, format, null, true);
    all = secureTransfer(light.items, context);
    const paging = require('./exportPaging');
    // `order`: a format's own order of the cards (Teamwork's task tree).
    if (options.order) all = options.order(all);
    // 'lists': in the board's list order, as the outlines group them;
    // true: in the order the cards first name their lists (Todoist).
    if (options.byList === 'lists') all = paging.byListOrder(all, paging.listTitlesOf(safeParts(light).lists, all));
    // 'listIds': by list id, for the documents that nest cards in their lists.
    else if (options.byList === 'listIds') all = paging.byListIdOrder(all, (light.lists || []).map(l => l._id));
    // 'listIdsThenTitles': a card of a list that is not exported by its list's title (Nullboard).
    else if (options.byList === 'listIdsThenTitles') {
      all = paging.byListIdOrder(all, (light.lists || []).map(l => l._id), item => String(item.listTitle || 'List'));
    }
    else if (options.byList) all = paging.byFirstListOrder(all, item => item.listTitle || '');
    ids = all.map(item => item.cardId);
  } else {
    ids = (await ReactiveCache.getCards({ boardId, archived: false }, { sort: { sort: 1 }, fields: { _id: 1 } })).map(c => c._id);
  }
  const pages = Math.max(1, Math.ceil(ids.length / pageSize));
  for (let n = 0; n < pages; n += 1) {
    const pageIds = ids.slice(n * pageSize, (n + 1) * pageSize);
    // eslint-disable-next-line no-await-in-loop
    const collected = await collect(boardId, fields, format, pageIds);
    // A page is in the order of its ids (the board's order, or list by list).
    const rank = new Map(pageIds.map((id, i) => [id, i]));
    const items = secureTransfer(collected.items, context).sort((a, b) => rank.get(a.cardId) - rank.get(b.cardId));
    yield { ...collected, ...safeParts(collected), items,
      ...(all ? { page: { all, offset: n * pageSize, first: n === 0, last: n === pages - 1 } } : {}) };
  }
}

export async function buildExternalExport(boardId, format, fields) {
  const formatter = formatters[format];
  if (!formatter) return null;
  const { secureTransfer } = require('/server/lib/secureTransfer');
  const context = { direction: 'export', source: `export:${format}` };
  // A JSON document is checked as it is sent. A formatter that writes a
  // document of its own - OPML, Leo's XML, Markdown, CSV - returns text in that
  // format's syntax, which is not HTML: passing the finished document through
  // the HTML sanitizer stripped its markup (OPML's <outline text="..."> lost
  // every card), logged its own tags as unsafe markup on every export, and held
  // a whole board to the size of one string.
  const collected = await collect(boardId, fields, format);
  const formatted = formatter(collected);
  if (typeof formatted !== 'string') return secureTransfer(formatted, context);
  // A text document is made again from the board's values passed through the
  // boundary: the cards (plain objects collect builds) and the board's, lists'
  // and swimlanes' titles. The board, its lists and swimlanes are collection
  // documents with helpers, so each keeps its prototype and gets a checked
  // title - the boundary refuses a non-plain object as a whole.
  const safeTitle = doc => (doc && typeof doc.title === 'string'
    ? Object.assign(Object.create(Object.getPrototypeOf(doc)), doc, { title: secureTransfer(doc.title, context) }) : doc);
  return formatter({ ...collected, board: safeTitle(collected.board), lists: (collected.lists || []).map(safeTitle),
    swimlanes: (collected.swimlanes || []).map(safeTitle), items: secureTransfer(collected.items, context) });
}
