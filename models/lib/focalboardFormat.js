// Focalboard (Mattermost Boards) board archive, as text: what one board of a
// `.boardarchive` holds in its `board.jsonl`, optionally after the archive's
// `{"version":1,...}` header line, which Focalboard's importer also reads as a
// file of its own (server/app/import.go in mattermost/focalboard). Import and
// export live together so tests/focalboard.test.cjs runs the round trip in
// plain Node - no Meteor import here.
//
// Each line is {"type": "...", "data": {...}}:
//   board        the board (model.Board): title, description and its
//                cardProperties - the property templates
//                [{ id, name, type, options: [{ id, value, color }] }]
//   block        a card, view or content block (model.Block): id, parentId,
//                type, title, fields, createAt, deleteAt; the first line may be
//                a board written as a block (older archives), with its
//                cardProperties in fields
//   boardMember  a Focalboard user's membership: Focalboard accounts are not
//                WeKan's, so these are reported, not imported
//
// A card maps to a card:
//   title                         -> title
//   the board view's group-by select property (or the first select)
//                                 -> list ("No <property>" without a value)
//   other select / multiSelect    -> labels "<property>:<option>"; a property
//                                    called Labels -> labels by their own name
//   the first date property       -> due date, or start and due for a range
//   text, number, email, url, phone, checkbox and later dates
//                                 -> custom fields
//   text and heading blocks       -> description, in the card's content order
//   checkbox blocks               -> a checklist
//   comment blocks                -> comments
//   createAt                      -> creation date
// Person properties, images and attachments (the archive's files) and card
// templates are reported, not imported. A deleted block is skipped.

export const MAX_FOCALBOARD_BLOCKS = 50000;
const CUSTOM_TYPES = new Set(['text', 'number', 'email', 'url', 'phone', 'checkbox']);
const COMPUTED_TYPES = new Set(['createdTime', 'updatedTime', 'createdBy', 'updatedBy']);

function readLines(text) {
  const lines = String(text == null ? '' : text).split(/\r\n|\r|\n/).map(line => line.trim()).filter(Boolean);
  if (lines.length > MAX_FOCALBOARD_BLOCKS) throw new Error(`Focalboard archive has more than ${MAX_FOCALBOARD_BLOCKS} lines`);
  const rows = [];
  lines.forEach((line, index) => {
    let row;
    try { row = JSON.parse(line); } catch (error) {
      throw new Error(`Focalboard line ${index + 1} is not JSON`);
    }
    // The archive header: {"version":1,"date":...}.
    if (index === 0 && row && typeof row === 'object' && !row.type && Number.isInteger(row.version)) return;
    if (!row || typeof row !== 'object' || typeof row.type !== 'string' || !row.data || typeof row.data !== 'object') {
      throw new Error(`Focalboard line ${index + 1} is not an archive line`);
    }
    rows.push({ ...row, line: index + 1 });
  });
  return rows;
}

const iso = ms => (Number.isFinite(Number(ms)) && Number(ms) > 0 ? new Date(Number(ms)).toISOString() : undefined);
// A date property's value: '{"from":ms,"to":ms}' (a JSON string).
function dateRange(value) {
  let range = value;
  if (typeof value === 'string') { try { range = JSON.parse(value); } catch (error) { return null; } }
  if (!range || typeof range !== 'object') return null;
  const from = iso(range.from), to = iso(range.to);
  return from ? { from, ...(to ? { to } : {}) } : null;
}
const flat = order => (Array.isArray(order) ? order.flatMap(item => (Array.isArray(item) ? flat(item) : [item])) : []);

export function parseFocalboard(text) {
  const rows = readLines(text);
  const unsupported = [];
  let board = null;
  const blocks = [];
  let members = 0;
  for (const row of rows) {
    const at = `/line/${row.line}`;
    if (row.type === 'board' || (!board && row.type === 'block' && row.data.type === 'board')) {
      if (board) { unsupported.push({ path: at, reason: 'a second board in one file is not imported' }); continue; }
      board = row.type === 'board' ? row.data
        : { ...row.data, description: row.data.fields?.description || '', cardProperties: row.data.fields?.cardProperties };
    } else if (row.type === 'block') blocks.push(row.data);
    else if (row.type === 'boardMember') members += 1;
    else unsupported.push({ path: at, reason: `archive line type ${row.type} has no WeKan field` });
  }
  if (!board) throw new Error('Focalboard archive has no board line');
  if (members) unsupported.push({ path: '/boardMember', reason: `${members} Focalboard member(s): Focalboard accounts are not WeKan's` });
  const properties = (Array.isArray(board.cardProperties) ? board.cardProperties : [])
    .filter(property => property && typeof property.id === 'string' && typeof property.name === 'string');
  const byId = new Map(properties.map(property => [property.id, property]));
  const live = blocks.filter(block => block && typeof block.id === 'string' && !(Number(block.deleteAt) > 0));
  const view = live.find(block => block.type === 'view' && block.fields?.viewType === 'board' &&
    byId.get(block.fields.groupById)?.type === 'select');
  const groupBy = view ? byId.get(view.fields.groupById) : properties.find(property => property.type === 'select');
  const option = (property, id) => (property.options || []).find(item => item && item.id === id);
  const children = new Map();
  for (const block of live) {
    if (!children.has(block.parentId)) children.set(block.parentId, []);
    children.get(block.parentId).push(block);
  }
  const tasks = [];
  live.filter(block => block.type === 'card').forEach(card => {
    const at = `/card/${card.id}`;
    if (card.fields?.isTemplate === true) {
      unsupported.push({ path: at, reason: 'a card template is not imported' });
      return;
    }
    const values = card.fields?.properties && typeof card.fields.properties === 'object' ? card.fields.properties : {};
    const tags = [], custom = {};
    let column = groupBy ? `No ${groupBy.name}` : 'Cards';
    let dates = null;
    for (const [id, value] of Object.entries(values)) {
      const property = byId.get(id);
      if (!property) { unsupported.push({ path: `${at}/properties/${id}`, reason: 'a value of a property the board does not define' }); continue; }
      if (property === groupBy) { column = option(property, value)?.value || column; continue; }
      // A property called Labels holds labels as they are named (what WeKan's
      // export writes); any other is "<property>:<option>".
      const tag = chosen => (/^labels$/i.test(property.name.trim()) ? chosen.value : `${property.name}:${chosen.value}`);
      if (property.type === 'select') { const chosen = option(property, value); if (chosen) tags.push(tag(chosen)); continue; }
      if (property.type === 'multiSelect') {
        for (const id2 of Array.isArray(value) ? value : [value]) {
          const chosen = option(property, id2);
          if (chosen) tags.push(tag(chosen));
        }
        continue;
      }
      if (property.type === 'date') {
        const range = dateRange(value);
        if (!range) unsupported.push({ path: `${at}/properties/${id}`, reason: `${property.name} is not a Focalboard date` });
        else if (!dates) dates = range;
        else custom[property.name] = range.from;
        continue;
      }
      if (CUSTOM_TYPES.has(property.type)) {
        if (value !== '' && value !== undefined && value !== null) custom[property.name] = String(value);
        continue;
      }
      if (COMPUTED_TYPES.has(property.type)) continue;
      unsupported.push({ path: `${at}/properties/${property.name}`,
        reason: `Focalboard ${property.type} property ${property.name} has no WeKan field` });
    }
    // Content, in the card's own order, then anything it does not list.
    const own = children.get(card.id) || [];
    const order = flat(card.fields?.contentOrder);
    const sorted = [...order.map(id => own.find(block => block.id === id)).filter(Boolean),
      ...own.filter(block => !order.includes(block.id)).sort((a, b) => Number(a.createAt) - Number(b.createAt))];
    const description = [], items = [], comments = [];
    for (const block of sorted) {
      const content = typeof block.title === 'string' ? block.title : '';
      if (block.type === 'text') { if (content) description.push(content); }
      else if (/^h[1-3]$/.test(block.type)) { if (content) description.push(`${'#'.repeat(Number(block.type[1]))} ${content}`); }
      else if (block.type === 'divider') description.push('---');
      else if (block.type === 'checkbox') { if (content) items.push({ title: content, done: block.fields?.value === true }); }
      else if (block.type === 'comment') { if (content) comments.push({ text: content, date: iso(block.createAt) }); }
      else if (['image', 'attachment'].includes(block.type)) {
        unsupported.push({ path: `${at}/${block.id}`, reason: `a Focalboard ${block.type}: the file is in the archive, not in board.jsonl` });
      } else unsupported.push({ path: `${at}/${block.id}`, reason: `Focalboard ${block.type} block has no WeKan field` });
    }
    // Comments are children of the card too.
    tasks.push({
      ref: card.id,
      title: typeof card.title === 'string' && card.title.trim() ? card.title.trim() : 'Imported card',
      description: description.join('\n\n'),
      column_name: column,
      swimlane_name: 'Default',
      tags,
      ...(dates ? (dates.to ? { date_started: dates.from, date_due: dates.to } : { date_due: dates.from }) : {}),
      ...(iso(card.createAt) ? { date_creation: iso(card.createAt) } : {}),
      ...(items.length ? { checklists: [{ title: 'Checklist', items }] } : {}),
      ...(comments.length ? { comments } : {}),
      ...(Object.keys(custom).length ? { custom_fields: custom } : {}),
    });
  });
  // Lists in the group-by property's own option order, then any others.
  const columns = [...new Set([...(groupBy ? (groupBy.options || []).map(item => item.value) : []),
    ...tasks.map(task => task.column_name)])].filter(title => tasks.some(task => task.column_name === title) || groupBy);
  return {
    board: { name: typeof board.title === 'string' && board.title.trim() ? board.title.trim() : 'Imported Focalboard',
      ...(typeof board.description === 'string' && board.description ? { description: board.description } : {}) },
    columns: columns.map(title => ({ title })),
    swimlanes: [{ name: 'Default' }],
    tasks,
    warnings: [],
    unsupported,
  };
}

// Deterministic Focalboard-style ids: a type letter and 26 base-36 characters,
// the same WeKan id always giving the same block id.
function blockId(prefix, source) {
  let out = '';
  for (let round = 0; out.length < 26; round += 1) {
    let h = 0x811c9dc5 ^ round;
    for (const ch of String(source)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
    out += h.toString(36).padStart(7, '0');
  }
  return prefix + out.slice(0, 26);
}
const ms = value => { const date = value ? new Date(value) : null; return date && !Number.isNaN(date.getTime()) ? date.getTime() : null; };

export function formatFocalboard({ board = {}, lists = [], items = [] }, { now = Date.now() } = {}) {
  const boardId = blockId('b', board._id || board.title || 'board');
  const status = { id: blockId('p', `${boardId}:status`), name: 'Status', type: 'select',
    options: [...new Set([...(lists || []).map(list => list.title), ...items.map(item => item.listTitle)].filter(Boolean))]
      .map(title => ({ id: blockId('o', `${boardId}:status:${title}`), value: title, color: 'propColorDefault' })) };
  const labelNames = [...new Set(items.flatMap(item => (Array.isArray(item.labels) ? item.labels : [])))];
  const labels = { id: blockId('p', `${boardId}:labels`), name: 'Labels', type: 'multiSelect',
    options: labelNames.map(name => ({ id: blockId('o', `${boardId}:label:${name}`), value: name, color: 'propColorDefault' })) };
  const due = { id: blockId('p', `${boardId}:due`), name: 'Due', type: 'date', options: [] };
  const fieldNames = [...new Set(items.flatMap(item => Object.keys(item.customFields || {})))];
  const fields = fieldNames.map(name => ({ id: blockId('p', `${boardId}:field:${name}`), name, type: 'text', options: [] }));
  const line = (type, data) => JSON.stringify({ type, data });
  const base = (id, parentId, type, title, fields2, created) => ({ id, parentId, boardId, createdBy: '', modifiedBy: '',
    schema: 1, type, title, fields: fields2, createAt: created || now, updateAt: created || now, deleteAt: 0 });
  const out = [JSON.stringify({ version: 1, date: now })];
  out.push(line('board', { id: boardId, teamId: '0', channelId: '', createdBy: '', modifiedBy: '', type: 'P',
    minimumRole: '', title: board.title || 'WeKan board', description: board.description || '', icon: '',
    showDescription: false, isTemplate: false, templateVersion: 0, properties: {},
    cardProperties: [status, labels, due, ...fields], createAt: now, updateAt: now, deleteAt: 0 }));
  out.push(line('block', base(blockId('v', `${boardId}:view`), boardId, 'view', 'Board view', {
    viewType: 'board', groupById: status.id, sortOptions: [], visiblePropertyIds: [labels.id, due.id],
    visibleOptionIds: [], hiddenOptionIds: [], collapsedOptionIds: [], filter: { operation: 'and', filters: [] },
    cardOrder: [], columnWidths: {}, columnCalculations: {}, kanbanCalculations: {}, defaultTemplateId: '' })));
  for (const item of items) {
    const cardId = blockId('c', item.cardId || item.title);
    const properties = {};
    const statusOption = status.options.find(choice => choice.value === item.listTitle);
    if (statusOption) properties[status.id] = statusOption.id;
    const chosen = (Array.isArray(item.labels) ? item.labels : [])
      .map(name => labels.options.find(choice => choice.value === name)?.id).filter(Boolean);
    if (chosen.length) properties[labels.id] = chosen;
    const from = ms(item.startAt), to = ms(item.dueAt);
    if (to !== null) properties[due.id] = JSON.stringify(from !== null && from < to ? { from, to } : { from: to });
    for (const field of fields) {
      const value = item.customFields?.[field.name];
      if (value !== undefined && value !== null && value !== '') properties[field.id] = String(value);
    }
    const content = [];
    const created = ms(item.createdAt) || now;
    if (item.description) {
      const id = blockId('a', `${cardId}:description`);
      content.push(line('block', base(id, cardId, 'text', item.description, {}, created)));
    }
    (Array.isArray(item.checklists) ? item.checklists : []).forEach((checklist, c) => {
      (Array.isArray(checklist.items) ? checklist.items : []).forEach((entry, i) => {
        content.push(line('block', base(blockId('x', `${cardId}:${c}:${i}`), cardId, 'checkbox', entry.title || '',
          { value: entry.isFinished === true || entry.done === true }, created)));
      });
    });
    const order = content.map(row => JSON.parse(row).data.id);
    out.push(line('block', base(cardId, boardId, 'card', item.title || 'Untitled',
      { icon: '', properties, contentOrder: order, isTemplate: false }, created)));
    out.push(...content);
    (Array.isArray(item.comments) ? item.comments : []).forEach((comment, i) => {
      if (comment && typeof comment.text === 'string' && comment.text.trim()) {
        out.push(line('block', base(blockId('m', `${cardId}:comment:${i}`), cardId, 'comment',
          comment.author ? `${comment.author}: ${comment.text}` : comment.text, {}, ms(comment.date) || created)));
      }
    });
  }
  return `${out.join('\n')}\n`;
}
