// Planka, read from its REST API (models/lib/apiImport/planka.js): the board
// answer of GET /api/boards/:id and each card's comments, as the generalized
// importer's normalized board. Plain JavaScript without Meteor, so
// tests/plankaApiImport.test.cjs runs it in Node.
//
// input: { planka: { item: board, included: { users, labels, lists, cards,
//          cardMemberships, cardLabels, taskLists?, tasks, attachments, ... } },
//          comments: { [cardId]: [{ text, userId, createdAt }] },
//          commentUsers?: { [userId]: { username, name } } }
//
// Planka v1 and v2 differ in a few names, and both are read:
//   due done   v1 card.isDueDateCompleted     v2 card.isDueCompleted
//   tasks      v1 task.cardId                 v2 task.taskListId -> taskList.cardId
//   lists      v1 all shown                   v2 type active | closed | archive | trash
// Cards of the v2 archive list are imported archived, in the list they came
// from (prevListId) or the first list; cards in the trash are not imported.

export const MAX_PLANKA_CARDS = 20000;
const DEFAULT_SWIMLANE = 'Default';
const SHOWN_LIST_TYPES = ['active', 'closed'];

// Planka's label colors (server/api/models/Label.js) and the WeKan color
// closest to each; the rest keep the hex Planka draws them with
// (client/src/styles.module.scss). silver-glint and pirate-gold are
// gradients there.
const PLANKA_LABEL_COLORS = {
  'muddy-grey': 'gray', 'autumn-leafs': 'gold', 'morning-sky': 'sky', 'antique-blue': '#6c99bb',
  'egg-yellow': 'yellow', 'desert-sand': '#fad371', 'dark-granite': 'gray', 'fresh-salad': '#ced85e',
  'lagoon-blue': 'blue', 'midnight-blue': 'blue', 'light-orange': 'orange', 'pumpkin-orange': 'orange',
  'light-concrete': 'silver', 'sunny-grass': '#beca02', 'navy-blue': 'blue', 'lilac-eyes': 'slateblue',
  'apricot-red': 'red', 'orange-peel': 'orange', 'silver-glint': 'silver', 'bright-moss': 'green',
  'deep-ocean': 'navy', 'summer-sky': 'sky', 'berry-red': 'red', 'light-cocoa': 'saddlebrown',
  'grey-stone': 'silver', 'tank-green': '#8aa177', 'coral-green': '#2b6a6c', 'sugar-plum': 'slateblue',
  'pink-tulip': 'pink', 'shady-rust': 'saddlebrown', 'wet-rock': '#83949b', 'wet-moss': 'darkgreen',
  'turquoise-sea': '#00858a', 'lavender-fields': 'plum', 'piggy-red': 'pink', 'light-mud': '#c7a57a',
  'gun-metal': 'black', 'modern-green': 'lime', 'french-coast': '#00b4b1', 'sweet-lilac': 'purple',
  'red-burgundy': 'crimson', 'pirate-gold': 'gold',
};

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => (typeof value === 'string' ? value : typeof value === 'number' && Number.isFinite(value) ? String(value) : '');
const id = value => text(value).trim();
const array = value => (Array.isArray(value) ? value.filter(isObject) : []);
const byPosition = (a, b) => (Number(a.position) || 0) - (Number(b.position) || 0);

function isoDate(value) {
  if (value === undefined || value === null || value === '') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function readInput(input) {
  if (typeof input === 'string') {
    try { return JSON.parse(input); } catch (error) { throw new Error('Planka data is not valid JSON'); }
  }
  return input;
}

// A Planka label color as a WeKan label color, or undefined.
export function plankaLabelColor(value) {
  return PLANKA_LABEL_COLORS[text(value).trim().toLowerCase()];
}

export function parsePlankaApi(input) {
  const data = readInput(input);
  if (!isObject(data) || !isObject(data.planka)) throw new Error('Planka data must be an object with the board answer as "planka"');
  const { item: board, included } = data.planka;
  if (!isObject(board) || !isObject(included)) throw new Error('Planka board answer needs "item" and "included"');
  if (!Array.isArray(included.lists) || !Array.isArray(included.cards)) throw new Error('Planka board answer needs lists and cards');
  if (included.cards.length > MAX_PLANKA_CARDS) throw new Error(`Planka board has more than ${MAX_PLANKA_CARDS} cards`);
  const unsupported = [];
  const comments = isObject(data.comments) ? data.comments : {};
  const commentUsers = isObject(data.commentUsers) ? data.commentUsers : {};

  const users = new Map(array(included.users).map(user => [id(user.id), user]));
  const username = userId => {
    const user = users.get(id(userId)) || commentUsers[id(userId)];
    return user ? text(user.username).trim() || text(user.email).trim() || text(user.name).trim() : '';
  };
  const displayName = userId => {
    const user = users.get(id(userId)) || commentUsers[id(userId)];
    return user ? text(user.name).trim() : '';
  };

  // Lists: v2's archive and trash lists are not columns.
  const columns = [];
  const columnOf = new Map();
  const archiveIds = new Set();
  const trashIds = new Set();
  const lists = array(included.lists).slice().sort(byPosition);
  for (const list of lists) {
    const type = text(list.type);
    if (type === 'archive') { archiveIds.add(id(list.id)); continue; }
    if (type === 'trash') { trashIds.add(id(list.id)); continue; }
    if (type && !SHOWN_LIST_TYPES.includes(type)) {
      unsupported.push({ path: `/lists/${id(list.id)}`, reason: `Planka list type "${type}" is not known; it is imported as a list` });
    }
    const base = text(list.name).trim() || 'Untitled';
    let title = base;
    for (let n = 2; columns.includes(title); n += 1) title = `${base} (${n})`;
    if (title !== base) unsupported.push({ path: `/lists/${id(list.id)}/name`, reason: `Planka has two lists named "${base}"; this one is imported as "${title}"` });
    columns.push(title);
    columnOf.set(id(list.id), title);
  }

  const labels = new Map(array(included.labels).map(label => [id(label.id), label]));
  const labelsOf = new Map();
  for (const link of array(included.cardLabels)) {
    const label = labels.get(id(link.labelId));
    if (!label) continue;
    if (!labelsOf.has(id(link.cardId))) labelsOf.set(id(link.cardId), []);
    labelsOf.get(id(link.cardId)).push(label);
  }
  const membersOf = new Map();
  for (const link of array(included.cardMemberships)) {
    const name = username(link.userId);
    if (!name) continue;
    if (!membersOf.has(id(link.cardId))) membersOf.set(id(link.cardId), []);
    membersOf.get(id(link.cardId)).push(name);
  }
  // Checklists: v2's task lists, or v1's tasks straight on the card as one.
  const checklistsOf = new Map();
  const taskLists = new Map(array(included.taskLists).map(taskList => [id(taskList.id), taskList]));
  const tasksIn = new Map();
  for (const task of array(included.tasks).sort(byPosition)) {
    const key = task.taskListId != null ? `list:${id(task.taskListId)}` : `card:${id(task.cardId)}`;
    if (!tasksIn.has(key)) tasksIn.set(key, []);
    const title = text(task.name).trim();
    if (title) tasksIn.get(key).push({ title, done: task.isCompleted === true });
  }
  const addChecklist = (cardId, title, items) => {
    if (!items || !items.length) return;
    if (!checklistsOf.has(cardId)) checklistsOf.set(cardId, []);
    checklistsOf.get(cardId).push({ title, items });
  };
  for (const taskList of [...taskLists.values()].sort(byPosition)) {
    addChecklist(id(taskList.cardId), text(taskList.name).trim() || 'Tasks', tasksIn.get(`list:${id(taskList.id)}`));
  }
  for (const [key, items] of tasksIn) {
    if (key.startsWith('card:')) addChecklist(key.slice(5), 'Tasks', items);
  }

  const tasks = [];
  let trashed = 0;
  let archivedWithoutList = false;
  const cards = array(included.cards).slice().sort(byPosition);
  for (const card of cards) {
    const cardId = id(card.id);
    const listId = id(card.listId);
    const at = `/cards/${cardId}`;
    if (trashIds.has(listId)) { trashed += 1; continue; }
    const archived = archiveIds.has(listId);
    let column = columnOf.get(archived ? id(card.prevListId) : listId);
    if (!column) {
      if (!archived) { unsupported.push({ path: at, reason: 'a Planka card whose list is not on the board is not imported' }); continue; }
      column = columns[0];
      if (!column) { archivedWithoutList = true; column = 'Archive'; }
    }
    const task = {
      title: text(card.name).trim(),
      description: text(card.description),
      column_name: column,
      swimlane_name: DEFAULT_SWIMLANE,
      tags: [],
    };
    if (cardId) task.ref = cardId;
    if (archived) task.archived = true;
    const due = isoDate(card.dueDate);
    if (due) task.date_due = due;
    else if (due === undefined) unsupported.push({ path: `${at}/dueDate`, reason: `Planka due date "${text(card.dueDate)}" is not a date` });
    if (due && (card.isDueCompleted === true || card.isDueDateCompleted === true)) task.due_complete = true;
    const created = isoDate(card.createdAt);
    if (created) task.date_creation = created;
    const owner = username(card.creatorUserId);
    if (owner) task.owner_username = owner;
    const assignees = membersOf.get(cardId);
    if (assignees && assignees.length) task.assignees = [...new Set(assignees)];
    for (const label of labelsOf.get(cardId) || []) {
      const name = text(label.name).trim() || text(label.color).trim();
      if (!name || task.tags.some(t => t.name === name)) continue;
      const color = plankaLabelColor(label.color);
      task.tags.push(color ? { name, color } : { name });
    }
    const checklists = checklistsOf.get(cardId);
    if (checklists) task.checklists = checklists;
    const notes = (Array.isArray(comments[cardId]) ? comments[cardId] : [])
      .filter(c => isObject(c) && text(c.text).trim())
      .map(c => {
        const comment = { text: text(c.text) };
        const author = username(c.userId);
        if (author) comment.author = author;
        const name = displayName(c.userId);
        if (name) comment.authorName = name;
        const date = isoDate(c.createdAt);
        if (date) comment.date = date;
        return comment;
      });
    if (notes.length) task.comments = notes;
    if (card.stopwatch && isObject(card.stopwatch) && Number(card.stopwatch.total) > 0) {
      unsupported.push({ path: `${at}/stopwatch`, reason: 'the Planka stopwatch time is not imported' });
    }
    tasks.push(task);
  }
  if (archivedWithoutList) columns.push('Archive');
  if (trashed) unsupported.push({ path: '/lists/trash', reason: `${trashed} card(s) in the Planka trash are not imported` });

  const attachments = array(included.attachments).length;
  if (attachments) unsupported.push({ path: '/attachments', reason: `${attachments} Planka attachment(s) are files on the Planka server and are not imported` });
  const customFields = array(included.customFieldValues).length;
  if (customFields) unsupported.push({ path: '/customFieldValues', reason: `${customFields} Planka custom field value(s) are not imported` });
  const skipped = Number(data.commentsSkipped) || 0;
  if (skipped) unsupported.push({ path: '/comments', reason: `the comments of ${skipped} card(s) were not fetched (too many cards)` });

  return {
    board: { name: text(board.name).trim() || 'Imported Planka board' },
    columns: columns.map(title => ({ title })),
    swimlanes: [{ name: DEFAULT_SWIMLANE }],
    tasks,
    warnings: [],
    unsupported,
  };
}
