// Kanri, the offline desktop kanban app: its JSON export, read and written.
// Plain JavaScript without Meteor, so tests/kanriFormat.test.cjs runs the round
// trip in Node. Where each field comes from in Kanri is in
// docs/Features/ImportExport/Format-Coverage.md.
//
// Kanri writes two JSON files, and its "Import from Kanri" reads both back:
//
//   a single board (Import & Export -> Partial Export, or the board's menu):
//     { id, title, columns: [{ id, title, cards: [card] }], background,
//       globalTags: [tag], lastEdited, createdAt }
//   all data (Import & Export -> Full Export): the app settings and every board
//     { activeTheme, colors: {...}, pins: [...], boards: [board], ... }
//
//   card: { id?, name, description?, color?, dueDate?, isDueDateCompleted?,
//           isDueDateCounterRelative?, tasks?: [{ id?, name, finished }],
//           tags?: [tag] }
//   tag:  { id?, text, color?, style? }   color is '#rrggbb' from Kanri's color
//         picker; style is the CSS Kanri draws it with ("background-color: ...")
//
// A board maps to:
//   title                 -> the board title
//   columns               -> lists, in order (a repeated title gets " (2)")
//   cards                 -> cards: name, description, id as source reference,
//                            dueDate, isDueDateCompleted as "due date done"
//   card.tasks            -> a "Tasks" checklist, finished = done
//   card.tags             -> labels, with the tag's color
//   card.color            -> the card color: Kanri's palette classes
//                            (bg-red-600 ...) become WeKan's red ..., teal
//                            (no WeKan name) and custom colors stay '#rrggbb'
// One WeKan import makes one board, so from an all-data file the first board
// is imported and every other one is reported. What has no WeKan place is
// reported too: the background image (a file on the computer that exported
// it), the relative due date display, tags no card uses, the app settings.

export const MAX_KANRI_CARDS = 20000;
const TASKS_CHECKLIST = 'Tasks';
const DEFAULT_SWIMLANE = 'Default';
// Kanri's default card color: "no color".
const KANRI_DEFAULT_CARD = 'bg-elevation-2';

// Kanri's card palette (components/modal/EditCard.vue) and WeKan's names for
// it. Teal has no WeKan name and keeps Tailwind's teal-600.
const KANRI_TEAL = '#0d9488';
const CARD_CLASS_TO_WEKAN = {
  'bg-pink-600': 'pink',
  'bg-red-600': 'red',
  'bg-orange-600': 'orange',
  'bg-yellow-600': 'yellow',
  'bg-green-600': 'green',
  'bg-teal-600': KANRI_TEAL,
  'bg-blue-600': 'blue',
  'bg-purple-600': 'purple',
};
const WEKAN_TO_CARD_CLASS = Object.fromEntries(Object.entries(CARD_CLASS_TO_WEKAN).map(([cls, name]) => [name, cls]));

// WeKan's named colors as client/components/cards/labels.css draws them; a
// Kanri tag or custom card color only takes a hex value.
export const WEKAN_COLOR_HEX = {
  white: '#ffffff', green: '#3cb500', yellow: '#fad900', orange: '#ff9f19', red: '#eb4646',
  purple: '#a632db', blue: '#0079bf', sky: '#00c2e0', lime: '#51e898', pink: '#ff78cb',
  black: '#4d4d4d', silver: '#c0c0c0', peachpuff: '#ffdab9', crimson: '#dc143c', plum: '#dda0dd',
  darkgreen: '#006400', slateblue: '#6a5acd', magenta: '#ff00ff', gold: '#ffd700', navy: '#000080',
  gray: '#808080', saddlebrown: '#8b4513', paleturquoise: '#afeeee', mistyrose: '#ffe4e1', indigo: '#4b0082',
};
const HEX_TO_WEKAN = Object.fromEntries(Object.entries(WEKAN_COLOR_HEX).map(([name, hex]) => [hex, name]));

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => (typeof value === 'string' ? value : typeof value === 'number' && Number.isFinite(value) ? String(value) : '');

// '#rgb' or '#rrggbb' as lowercase '#rrggbb', otherwise undefined.
export function kanriHex(value) {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(value || '').trim());
  if (!match) return undefined;
  const hex = match[1].length === 3 ? match[1].split('').map(c => c + c).join('') : match[1];
  return `#${hex.toLowerCase()}`;
}

// A Kanri tag's color: its color field, or the background-color of its style.
export function kanriTagColor(tag) {
  if (!isObject(tag)) return undefined;
  if (typeof tag.color === 'string' && tag.color.trim()) return tag.color.trim();
  const style = /background-color\s*:\s*([^;]+)/i.exec(text(tag.style));
  return style ? style[1].trim() : undefined;
}

// A Kanri color as WeKan stores it: a palette name when the hex is exactly
// one WeKan draws, otherwise the hex itself.
function wekanColorOf(hex) {
  return HEX_TO_WEKAN[hex] || hex;
}

// A Kanri card color as a WeKan card color; null for Kanri's default (no
// color), undefined when it is not a color Kanri writes.
export function kanriCardColor(value) {
  const color = text(value).trim();
  if (!color || color === KANRI_DEFAULT_CARD) return null;
  if (CARD_CLASS_TO_WEKAN[color]) return CARD_CLASS_TO_WEKAN[color];
  const hex = kanriHex(color);
  return hex ? wekanColorOf(hex) : undefined;
}

function isoDate(value) {
  if (value === undefined || value === null || value === '') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function readInput(input) {
  if (typeof input === 'string') {
    try { return JSON.parse(input); } catch (error) { throw new Error('Kanri export is not valid JSON'); }
  }
  return input;
}

// input: the parsed JSON of a Kanri export (or its text). A board export is
// one board. The all-data export holds every board: each is read into a
// swimlane named after it, so "One board per project" on the import page
// (models/lib/importSplit.js) makes each its own WeKan board again, with the
// columns that board has (swimlane_columns).
export function parseKanri(input) {
  const data = readInput(input);
  if (!isObject(data)) throw new Error('Kanri export must be a JSON object');
  const unsupported = [];
  if (!Array.isArray(data.boards)) {
    const one = parseKanriBoard(data, '', DEFAULT_SWIMLANE, unsupported);
    return {
      board: { name: one.name },
      columns: one.columns.map(name => ({ title: name })),
      swimlanes: [{ name: DEFAULT_SWIMLANE }],
      tasks: one.tasks,
      warnings: [],
      unsupported,
    };
  }
  // All data: app settings and every board.
  if (!data.boards.length) throw new Error('Kanri export has no boards');
  const settings = ['activeTheme', 'colors', 'savedCustomTheme', 'pins', 'boardSortingOption', 'columnZoomLevel']
    .filter(key => data[key] !== undefined && data[key] !== null && !(Array.isArray(data[key]) && !data[key].length));
  if (settings.length) {
    unsupported.push({ path: '/', reason: `Kanri app settings (${settings.join(', ')}) belong to the app, not to a board, and are not imported` });
  }
  const columns = [];
  const tasks = [];
  const lanes = [];
  const swimlaneColumns = {};
  let cards = 0;
  data.boards.forEach((board, index) => {
    const at = `/boards/${index}`;
    if (!isObject(board)) { unsupported.push({ path: at, reason: 'a Kanri board that is not an object is not imported' }); return; }
    const base = text(board.title).trim() || `Kanri board ${index + 1}`;
    let lane = base;
    for (let n = 2; lanes.includes(lane); n += 1) lane = `${base} (${n})`;
    const one = parseKanriBoard(board, at, lane, unsupported, MAX_KANRI_CARDS - cards);
    cards += one.tasks.length;
    lanes.push(lane);
    swimlaneColumns[lane] = one.columns;
    one.columns.forEach(name => { if (!columns.includes(name)) columns.push(name); });
    tasks.push(...one.tasks);
  });
  if (!lanes.length) throw new Error('Kanri export has no boards');
  if (lanes.length === 1) {
    tasks.forEach(task => { task.swimlane_name = DEFAULT_SWIMLANE; });
    return { board: { name: lanes[0] }, columns: columns.map(name => ({ title: name })),
      swimlanes: [{ name: DEFAULT_SWIMLANE }], tasks, warnings: [], unsupported };
  }
  return {
    board: { name: 'Kanri' },
    columns: columns.map(name => ({ title: name })),
    swimlanes: lanes.map(name => ({ name })),
    swimlane_columns: swimlaneColumns,
    tasks,
    warnings: [],
    unsupported,
  };
}

// One Kanri board: its column titles, its cards as tasks in `lane`, and its
// name. Losses go to `unsupported`; `cardLimit` is what is left of the
// export's card limit.
function parseKanriBoard(board, at, lane, unsupported, cardLimit = MAX_KANRI_CARDS) {
  // KanbanElectron, which Kanri also imports, calls the columns "lists".
  const columnsIn = Array.isArray(board.columns) ? board.columns : Array.isArray(board.lists) ? board.lists : null;
  if (!columnsIn) throw new Error('Kanri board needs a columns array');
  const cardCount = columnsIn.reduce((sum, column) => sum + (Array.isArray(column && column.cards) ? column.cards.length : 0), 0);
  if (cardCount > cardLimit) throw new Error(`Kanri export has more than ${MAX_KANRI_CARDS} cards`);

  const background = isObject(board.background) ? text(board.background.src).trim() : '';
  if (background) {
    unsupported.push({ path: `${at}/background`,
      reason: `Kanri background image "${background}" is a file on the computer that exported it and is not imported` });
  }

  const columns = [];
  const tasks = [];
  const usedTags = new Set();
  columnsIn.forEach((column, columnIndex) => {
    const columnAt = `${at}/columns/${columnIndex}`;
    if (!isObject(column)) { unsupported.push({ path: columnAt, reason: 'a Kanri column that is not an object is not imported' }); return; }
    const base = text(column.title).trim() || 'Untitled';
    let title = base;
    for (let n = 2; columns.includes(title); n += 1) title = `${base} (${n})`;
    if (title !== base) unsupported.push({ path: `${columnAt}/title`, reason: `Kanri has two columns named "${base}"; this one is imported as "${title}"` });
    columns.push(title);
    (Array.isArray(column.cards) ? column.cards : []).forEach((card, cardIndex) => {
      const cardAt = `${columnAt}/cards/${cardIndex}`;
      if (!isObject(card)) { unsupported.push({ path: cardAt, reason: 'a Kanri card that is not an object is not imported' }); return; }
      const task = {
        title: text(card.name).trim(),
        description: text(card.description),
        column_name: title,
        swimlane_name: lane,
        tags: [],
      };
      if (text(card.id)) task.ref = text(card.id);
      const due = isoDate(card.dueDate);
      if (due) task.date_due = due;
      else if (due === undefined) unsupported.push({ path: `${cardAt}/dueDate`, reason: `Kanri due date "${text(card.dueDate)}" is not a date` });
      if (due && card.isDueDateCompleted === true) task.due_complete = true;
      if (due && card.isDueDateCounterRelative === true) {
        unsupported.push({ path: `${cardAt}/isDueDateCounterRelative`, reason: 'Kanri shows this due date as a countdown; WeKan shows the date' });
      }
      const color = kanriCardColor(card.color);
      if (color) task.color = color;
      else if (color === undefined) unsupported.push({ path: `${cardAt}/color`, reason: `Kanri card color "${text(card.color)}" is not a color WeKan can show` });
      for (const tag of Array.isArray(card.tags) ? card.tags : []) {
        const name = text(tag && tag.text).trim();
        if (!name || task.tags.some(t => t.name === name)) continue;
        const raw = kanriTagColor(tag);
        const hex = raw && kanriHex(raw);
        if (raw && !hex) unsupported.push({ path: `${cardAt}/tags`, reason: `Kanri tag "${name}" color "${raw}" is not a color WeKan can show` });
        task.tags.push(hex ? { name, color: wekanColorOf(hex) } : { name });
        usedTags.add(name);
      }
      const items = (Array.isArray(card.tasks) ? card.tasks : [])
        .filter(item => isObject(item) && text(item.name).trim())
        .map(item => ({ title: text(item.name).trim(), done: item.finished === true }));
      if (items.length) task.checklists = [{ title: TASKS_CHECKLIST, items }];
      tasks.push(task);
    });
  });
  const unused = (Array.isArray(board.globalTags) ? board.globalTags : [])
    .map(tag => text(tag && tag.text).trim()).filter(name => name && !usedTags.has(name));
  if (unused.length) {
    unsupported.push({ path: `${at}/globalTags`, reason: `Kanri tags no card uses are not imported: ${[...new Set(unused)].join(', ')}` });
  }
  return { name: text(board.title).trim() || 'Imported Kanri board', columns, tasks };
}

// A WeKan color as Kanri stores a card color: its palette class where Kanri
// has one, otherwise a hex value; '' for none.
export function kanriCardColorOf(color) {
  const value = text(color).trim().toLowerCase();
  if (!value) return '';
  if (WEKAN_TO_CARD_CLASS[value]) return WEKAN_TO_CARD_CLASS[value];
  return kanriHex(value) || WEKAN_COLOR_HEX[value] || '';
}

function tagFor(label) {
  const hex = kanriHex(label.color) || WEKAN_COLOR_HEX[text(label.color).toLowerCase()];
  // The style Kanri itself writes when a tag's color is set (stores/boards.ts):
  // a dark or light text color for contrast.
  const tag = { id: text(label._id) || text(label.name), text: text(label.name) };
  if (hex) {
    const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
    const light = (r * 299 + g * 587 + b * 114) / 1000 >= 128;
    tag.color = hex;
    tag.style = `background-color: ${hex}; color: ${light ? '#1e293b' : '#f4f4f5'}`;
  }
  return tag;
}

// A Kanri single-board export for a collected board
// (models/lib/externalExporters.js): what Kanri's Partial import reads.
export function formatKanri({ board, lists, items }, now = new Date()) {
  const labelsById = new Map((board && Array.isArray(board.labels) ? board.labels : [])
    .filter(label => label && text(label.name).trim()).map(label => [label._id, label]));
  const used = new Map();
  const columns = (Array.isArray(lists) ? lists : []).map(list => ({ id: text(list._id), title: text(list.title), cards: [] }));
  const byId = new Map(columns.map(column => [column.id, column]));
  for (const item of Array.isArray(items) ? items : []) {
    let column = byId.get(text(item.listId));
    if (!column) {
      // A card whose list is not exported (an archived list) gets a column of
      // its own list, so it is not lost.
      const key = text(item.listId) || 'no-list';
      column = { id: key, title: text(item.listTitle) || 'Untitled', cards: [] };
      columns.push(column);
      byId.set(key, column);
    }
    const tags = (Array.isArray(item.labelIds) ? item.labelIds : [])
      .map(id => labelsById.get(id)).filter(Boolean).map(label => {
        const tag = tagFor(label);
        used.set(tag.id, tag);
        return tag;
      });
    const due = isoDate(item.dueAt) || null;
    const card = {
      id: text(item.cardId),
      name: text(item.title).trim() || 'Untitled',
      description: text(item.description),
      color: kanriCardColorOf(item.color) || KANRI_DEFAULT_CARD,
      dueDate: due,
      isDueDateCounterRelative: false,
      isDueDateCompleted: Boolean(due && item.dueComplete),
      // Kanri has one task list per card: every checklist's items, in order.
      tasks: (Array.isArray(item.checklists) ? item.checklists : [])
        .flatMap(list => (Array.isArray(list.items) ? list.items : []))
        .filter(entry => text(entry.title).trim())
        .map((entry, index) => ({ id: `${text(item.cardId)}-task-${index + 1}`, name: text(entry.title).trim(), finished: Boolean(entry.done) })),
      tags,
    };
    column.cards.push(card);
  }
  const edited = isoDate(board && (board.modifiedAt || board.createdAt)) || now.toISOString();
  return {
    id: text(board && board._id) || 'wekan-board',
    title: text(board && board.title) || 'WeKan board',
    columns,
    background: null,
    globalTags: [...used.values()],
    lastEdited: edited,
    createdAt: isoDate(board && board.createdAt) || edited,
  };
}
