// Basecamp, as models/lib/apiImport/basecamp.js fetches it, read into the
// normalized board the generalized importer creates (models/kanboardCreator.js).
//
// One project is one board:
//   each card table   -> a swimlane named after it; its columns (Triage,
//                        ordinary columns, Done, Not now) -> lists, titles kept
//   each card         -> a card: content as plain text, due_on, assignees,
//                        steps as a "Steps" checklist, comments
//   the to-do lists   -> a swimlane "To-dos", each to-do list a list
//   each to-do        -> a card: description, starts_on, due_on, assignees,
//                        comments; a completed to-do is archived
// Basecamp writes rich text as HTML; it is read as plain text.

export const MAX_BASECAMP_TASKS = 20000;
const TODO_SWIMLANE = 'To-dos';
const STEPS_CHECKLIST = 'Steps';

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => (typeof value === 'string' ? value : typeof value === 'number' && Number.isFinite(value) ? String(value) : '');

function isoDate(value) {
  if (value === undefined || value === null || value === '') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

// Basecamp's rich text (HTML) as plain text: line breaks for <br>, the end of
// a paragraph, block or list item, every other tag dropped, the common
// entities decoded.
export function basecampText(html) {
  let out = text(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|blockquote|pre)\s*>/gi, '\n');
  // Until nothing changes: removing one tag can splice the text around it
  // into another ("<<b>b>").
  let prev;
  do {
    prev = out;
    out = out.replace(/<[^>]*>/g, '');
  } while (out !== prev);
  return out
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, name) => {
      if (name[0] === '#') {
        const code = name[1].toLowerCase() === 'x' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
        return Number.isInteger(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
      }
      return ENTITIES[name.toLowerCase()] ?? whole;
    })
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function readInput(input) {
  if (typeof input === 'string') {
    try { return JSON.parse(input); } catch (error) { throw new Error('Basecamp data is not valid JSON'); }
  }
  return input;
}

const personName = person => (isObject(person) ? text(person.name).trim() || text(person.email_address).trim() : '');

export function parseBasecampApi(input) {
  const data = readInput(input);
  if (!isObject(data) || data.basecamp !== true) throw new Error('Basecamp data must be what the Basecamp import fetched');
  if (!isObject(data.project)) throw new Error('Basecamp data has no project');
  const cardTables = data.cardTables === undefined ? [] : data.cardTables;
  const todolists = data.todolists === undefined ? [] : data.todolists;
  if (!Array.isArray(cardTables) || !Array.isArray(todolists)) throw new Error('Basecamp data needs cardTables and todolists arrays');
  const count = cardTables.reduce((sum, table) => sum + (isObject(table) && Array.isArray(table.lists)
    ? table.lists.reduce((n, list) => n + (isObject(list) && Array.isArray(list.cards) ? list.cards.length : 0), 0) : 0), 0)
    + todolists.reduce((sum, list) => sum + (isObject(list) && Array.isArray(list.todos) ? list.todos.length : 0), 0);
  if (count > MAX_BASECAMP_TASKS) throw new Error(`Basecamp project has more than ${MAX_BASECAMP_TASKS} cards and to-dos`);

  const unsupported = [];
  const columns = [];
  const swimlanes = [];
  const swimlaneColumns = {};
  const tasks = [];
  const addLane = (base) => {
    let name = base;
    for (let n = 2; swimlanes.includes(name); n += 1) name = `${base} (${n})`;
    swimlanes.push(name);
    swimlaneColumns[name] = [];
    return name;
  };
  const addColumn = (lane, base) => {
    let title = base;
    for (let n = 2; swimlaneColumns[lane].includes(title); n += 1) title = `${base} (${n})`;
    swimlaneColumns[lane].push(title);
    if (!columns.includes(title)) columns.push(title);
    return title;
  };

  // What a card and a to-do share: people, dates, comments.
  const baseTask = (item, at, column, lane, description) => {
    const task = { title: text(item.title).trim() || 'Untitled', description, column_name: column, swimlane_name: lane, tags: [] };
    if (text(item.id)) task.ref = text(item.id);
    const people = (Array.isArray(item.assignees) ? item.assignees : []).map(personName).filter(Boolean);
    if (people.length) {
      task.owner_name = people[0];
      if (people.length > 1) task.assignees = [...new Set(people.slice(1))];
    }
    for (const [field, target] of [['due_on', 'date_due'], ['starts_on', 'date_started'], ['created_at', 'date_creation']]) {
      const date = isoDate(item[field]);
      if (date) task[target] = date;
      else if (date === undefined) unsupported.push({ path: `${at}/${field}`, reason: `Basecamp ${field} "${text(item[field])}" is not a date` });
    }
    const comments = (Array.isArray(item.comments) ? item.comments : [])
      .filter(isObject)
      .map(comment => {
        const author = personName(comment.creator);
        return { text: basecampText(comment.content), author, authorName: author, date: isoDate(comment.created_at) || undefined };
      })
      .filter(comment => comment.text);
    if (comments.length) task.comments = comments;
    return task;
  };

  cardTables.forEach((table, tableIndex) => {
    const at = `/cardTables/${tableIndex}`;
    if (!isObject(table)) { unsupported.push({ path: at, reason: 'a Basecamp card table that is not an object is not imported' }); return; }
    const lane = addLane(text(table.title).trim() || 'Card Table');
    (Array.isArray(table.lists) ? table.lists : []).forEach((list, listIndex) => {
      const listAt = `${at}/lists/${listIndex}`;
      if (!isObject(list)) { unsupported.push({ path: listAt, reason: 'a Basecamp column that is not an object is not imported' }); return; }
      const column = addColumn(lane, text(list.title).trim() || 'Untitled');
      (Array.isArray(list.cards) ? list.cards : []).forEach((card, cardIndex) => {
        const cardAt = `${listAt}/cards/${cardIndex}`;
        if (!isObject(card)) { unsupported.push({ path: cardAt, reason: 'a Basecamp card that is not an object is not imported' }); return; }
        const task = baseTask(card, cardAt, column, lane, basecampText(card.content ?? card.description));
        if (card.completed === true && task.date_due) task.due_complete = true;
        const items = (Array.isArray(card.steps) ? card.steps : [])
          .filter(step => isObject(step) && text(step.title).trim())
          .map(step => ({ title: text(step.title).trim(), done: step.completed === true }));
        if (items.length) task.checklists = [{ title: STEPS_CHECKLIST, items }];
        tasks.push(task);
      });
    });
  });

  if (todolists.length) {
    const lane = addLane(TODO_SWIMLANE);
    todolists.forEach((todolist, listIndex) => {
      const listAt = `/todolists/${listIndex}`;
      if (!isObject(todolist)) { unsupported.push({ path: listAt, reason: 'a Basecamp to-do list that is not an object is not imported' }); return; }
      const column = addColumn(lane, text(todolist.title).trim() || 'To-do list');
      (Array.isArray(todolist.todos) ? todolist.todos : []).forEach((todo, todoIndex) => {
        const todoAt = `${listAt}/todos/${todoIndex}`;
        if (!isObject(todo)) { unsupported.push({ path: todoAt, reason: 'a Basecamp to-do that is not an object is not imported' }); return; }
        // A to-do's name is its `content`; `title` is the same text.
        const task = baseTask({ ...todo, title: text(todo.title).trim() || basecampText(todo.content) }, todoAt, column, lane, basecampText(todo.description));
        if (todo.completed === true) {
          task.archived = true;
          if (task.date_due) task.due_complete = true;
        }
        tasks.push(task);
      });
    });
  }

  if (!swimlanes.length) throw new Error('Basecamp project has no card table and no to-do lists to import');
  return {
    board: { name: text(data.project.name).trim() || 'Imported Basecamp project' },
    columns: columns.map(title => ({ title })),
    swimlanes: swimlanes.map(name => ({ name })),
    swimlane_columns: swimlaneColumns,
    tasks,
    warnings: [],
    unsupported,
  };
}
