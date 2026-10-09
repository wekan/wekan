// Vikunja's user data export (Settings > Data Export), read and written as
// plain data. The .zip itself is opened and written on the server
// (server/lib/vikunjaArchive.js); this module is plain JavaScript so
// tests/vikunjaFormat.test.cjs runs the round trip in Node.
//
// The export is a zip that Vikunja's "Vikunja Export" migrator imports back:
//
//   data.json     a JSON array of projects, each with its tasks, views,
//                 buckets, task_buckets and positions
//   filters.json  saved filters
//   VERSION       the Vikunja version that wrote it, e.g. v1.0.0; Vikunja
//                 refuses anything older than 0.20.1
//   files/<id>    attachment and background bytes, named by file id
//
// Two layouts exist. Since 0.24 a project has views; a kanban view owns its
// buckets (bucket.project_view_id), and task_buckets / positions say which
// bucket a task is in and where. Exports from 0.21-0.23 have no views: each
// bucket carries project_id, each task its bucket_id and kanban_position, and
// the done bucket is_done_bucket. Both are read, as Vikunja's own importer
// does. Dates are RFC 3339; Go's zero time, 0001-01-01T00:00:00Z, means none.
//
// A project maps to:
//   the first kanban view's buckets  -> lists, in bucket position order
//   tasks                            -> cards, in that view's task order
//   projects with tasks              -> one swimlane each when there are
//                                       several; under one parent project,
//                                       every child of it is a swimlane and
//                                       the board is named after the parent
// A task maps to:
//   title, description (HTML)        -> title, description as text; TipTap
//                                       task lists in it -> checklists, a
//                                       heading right above one -> its title
//   labels                           -> labels (by title)
//   assignees                        -> owner, then further assignees
//   created_by                       -> Requested by
//   start_date, due_date, end_date,
//   created                          -> start, due, end and created dates
//   done, done_at                    -> custom field Done; done_at is the end
//                                       date when end_date is not set
//   priority 1-5                     -> custom field Priority (Low, Medium,
//                                       High, Urgent, DO NOW), as Microsoft
//                                       Planner's priority is
//   percent_done                     -> custom field Percent Done (0-100)
//   hex_color                        -> card color
//   comments                         -> comments (HTML as text)
//   related_tasks subtask/parenttask -> parent card
//   blocking, blocked, related,
//   duplicateof, duplicates          -> card dependencies
// What has no WeKan place is reported, never invented: attachments (their
// bytes stay in files/<id>), reminders, repeats, precedes/follows/copied
// relations, label and project colors, WIP limits, project backgrounds and
// descriptions, reactions and saved filters.

import { markdownLinkTitle, markdownLinkUrl } from './markdownLink.js';

export const VIKUNJA_EXPORT_VERSION = 'v1.0.0';
export const VIKUNJA_MIN_VERSION = [0, 20, 1];
export const MAX_VIKUNJA_DATA_CHARS = 64 * 1024 * 1024;
export const MAX_VIKUNJA_TASKS = 20000;
export const VIKUNJA_PRIORITIES = ['', 'Low', 'Medium', 'High', 'Urgent', 'DO NOW'];
const ZERO_TIME = '0001-01-01T00:00:00Z';
const POSITION_STEP = 65536;
const DEFAULT_TITLE = 'Checklist';

// WeKan dependency types for Vikunja relation kinds (models/metadata/dependencies.js).
const RELATION_TYPES = {
  blocking: 'blocks',
  blocked: 'is-blocked-by',
  related: 'related-to',
  duplicateof: 'duplicates',
  duplicates: 'is-duplicated-by',
};
const INVERSE_TYPES = {
  blocks: 'is-blocked-by',
  'is-blocked-by': 'blocks',
  duplicates: 'is-duplicated-by',
  'is-duplicated-by': 'duplicates',
  'related-to': 'related-to',
};

const isObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const list = value => (Array.isArray(value) ? value : []);
const str = value => (typeof value === 'string' ? value : typeof value === 'number' && Number.isFinite(value) ? String(value) : '');
const num = value => (typeof value === 'number' && Number.isFinite(value) ? value : Number.isFinite(Number(value)) && value !== '' && value !== null ? Number(value) : undefined);

// ---------------------------------------------------------------- versions ---

// [major, minor, patch] of a VERSION file, or null when it is not a version.
export function parseVikunjaVersion(text) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:[-+.~][0-9A-Za-z.+~-]*)?$/.exec(String(text || '').trim());
  return match ? [+match[1], +match[2], +match[3]] : null;
}

function checkVersion(text, unsupported) {
  const value = String(text || '').trim();
  if (value === 'dev') {
    unsupported.push({ path: '/VERSION', reason: 'a Vikunja development build wrote this export; it is read as the current layout' });
    return;
  }
  const version = parseVikunjaVersion(value);
  if (!version) throw new Error(`Vikunja export VERSION "${value.slice(0, 40)}" is not a Vikunja version`);
  for (let i = 0; i < 3; i += 1) {
    if (version[i] > VIKUNJA_MIN_VERSION[i]) return;
    if (version[i] < VIKUNJA_MIN_VERSION[i]) {
      throw new Error(`Vikunja export version ${value} is older than ${VIKUNJA_MIN_VERSION.join('.')}, which Vikunja's own import refuses too`);
    }
  }
}

// ------------------------------------------------------------------- dates ---

// An ISO date, or undefined for Go's zero time, null and anything unreadable.
export function vikunjaDate(value) {
  if (typeof value !== 'string' || !value || value.startsWith('0001-01-01')) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

const vikunjaTime = value => vikunjaDate(value) || ZERO_TIME;

// -------------------------------------------------------------------- HTML ---
// Vikunja's descriptions and comments are TipTap HTML. They are read with a
// small tokenizer into WeKan's Markdown text; nothing here is rendered, and
// the result is sanitized again by the import boundary.

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };
function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-fA-F]{1,6}|#\d{1,7}|[a-zA-Z]{2,8}|#39);/g, (whole, name) => {
    if (name[0] === '#') {
      const code = name[1] === 'x' || name[1] === 'X' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }
    return Object.prototype.hasOwnProperty.call(ENTITIES, name) ? ENTITIES[name] : whole;
  });
}

// Linear on any input, as data.json is the uploader's: a tag runs to the next
// < or >, and an unclosed comment to the end of the text.
const TAG = /<!--[\s\S]*?(?:-->|$)|<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^<>]*)>|([^<]+)|</g;
const ATTRIBUTE = /([^\s=>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
const MAX_ATTRIBUTES_CHARS = 4096;

function attributes(text) {
  const out = {};
  let match;
  ATTRIBUTE.lastIndex = 0;
  // Only ul, li, a and img attributes are read, and a longer tag is not one
  // that an editor wrote.
  const source = String(text || '').slice(0, MAX_ATTRIBUTES_CHARS);
  while ((match = ATTRIBUTE.exec(source))) {
    out[match[1].toLowerCase()] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return out;
}

const BLOCK = new Set(['p', 'div', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'tr', 'hr']);
const INLINE_MARK = { strong: '**', b: '**', em: '_', i: '_', s: '~~', del: '~~', strike: '~~', code: '`' };

// { text, checklists }. With checklists: false, task lists stay in the text as
// "- [x] item" lines (a comment has no checklist of its own).
export function vikunjaHtmlToText(html, { checklists: wantChecklists = true } = {}) {
  const source = str(html);
  if (!source.trim()) return { text: '', checklists: [] };
  // Older Vikunja versions stored Markdown, not HTML.
  if (!/<[a-zA-Z!/]/.test(source)) return { text: source.trim(), checklists: [] };
  let out = '';
  const checklists = [];
  const lists = [];            // { ordered, task, count }
  let item = null;             // the task item being read, { title, done }
  let checklist = null;
  let taskDepth = 0;
  let pre = 0;
  let heading = null;          // { start, level } of the last heading
  let lastHeading = null;      // { start, end, text } when nothing followed it
  const links = [];
  // Trailing spaces off the text so far, without a regex over all of it.
  const trimTail = (chars = ' \t') => {
    let end = out.length;
    while (end && chars.includes(out[end - 1])) end -= 1;
    if (end !== out.length) out = out.slice(0, end);
  };
  const write = text => {
    if (item) item.title += text;
    else {
      out += text;
      if (text.trim()) lastHeading = null;
    }
  };
  const breakBlock = () => {
    if (item) { item.title += ' '; return; }
    trimTail();
    if (out && !out.endsWith('\n\n')) out += out.endsWith('\n') ? '\n' : '\n\n';
  };
  const newline = () => {
    if (item) { item.title += ' '; return; }
    trimTail();
    if (out && !out.endsWith('\n')) out += '\n';
  };
  let match;
  TAG.lastIndex = 0;
  while ((match = TAG.exec(source))) {
    const [whole, closing, rawName, rawAttributes, text] = match;
    if (text !== undefined || whole === '<') {
      const value = decodeEntities(text !== undefined ? text : whole);
      write(pre ? value : value.replace(/\s+/g, ' '));
      continue;
    }
    if (!rawName) continue; // a comment
    const name = rawName.toLowerCase();
    const attrs = closing ? {} : attributes(rawAttributes);
    if (name === 'ul' || name === 'ol') {
      if (closing) {
        const ended = lists.pop();
        if (ended && ended.task) {
          taskDepth -= 1;
          if (!taskDepth) {
            if (!wantChecklists) newline();
            checklist = null;
          }
        } else breakBlock();
        continue;
      }
      const task = attrs['data-type'] === 'taskList';
      lists.push({ ordered: name === 'ol', task, count: 0 });
      if (task) {
        taskDepth += 1;
        if (taskDepth === 1 && wantChecklists) {
          let title = DEFAULT_TITLE;
          // A heading with nothing after it names the list below it.
          if (lastHeading && lastHeading.text) {
            title = lastHeading.text;
            out = out.slice(0, lastHeading.start);
            trimTail(' \t\r\n');
          }
          checklist = { title, items: [] };
          checklists.push(checklist);
        } else if (taskDepth === 1) breakBlock();
      } else if (!item) newline();
      lastHeading = null;
      continue;
    }
    if (name === 'li') {
      const current = lists[lists.length - 1];
      if (current && current.task) {
        if (closing) {
          if (item) {
            const title = item.title.replace(/\s+/g, ' ').trim();
            if (title) {
              if (checklist) checklist.items.push({ title, done: item.done });
              else {
                out += `${'  '.repeat(Math.max(0, taskDepth - 1))}- [${item.done ? 'x' : ' '}] ${title}\n`;
              }
            }
            item = null;
          }
          continue;
        }
        // A nested task item ends the item it is inside of.
        if (item) {
          const title = item.title.replace(/\s+/g, ' ').trim();
          if (title) {
            if (checklist) checklist.items.push({ title, done: item.done });
            else out += `${'  '.repeat(Math.max(0, taskDepth - 2))}- [${item.done ? 'x' : ' '}] ${title}\n`;
          }
        }
        item = { title: '', done: attrs['data-checked'] === 'true' };
        continue;
      }
      if (closing) continue;
      if (current) current.count += 1;
      newline();
      const indent = '  '.repeat(Math.max(0, lists.filter(l => !l.task).length - 1));
      write(`${indent}${current && current.ordered ? `${current.count}.` : '-'} `);
      continue;
    }
    if (/^h[1-6]$/.test(name)) {
      if (!closing) {
        breakBlock();
        heading = { start: out.length, level: +name[1] };
        write(`${'#'.repeat(heading.level)} `);
      } else if (heading && !item) {
        const text = out.slice(heading.start).replace(/^#+\s*/, '').trim();
        lastHeading = { start: heading.start, text };
        heading = null;
        breakBlock();
      }
      continue;
    }
    if (name === 'br') { if (item) item.title += ' '; else out += '\n'; continue; }
    if (name === 'pre') {
      if (closing) { pre -= 1; write('\n```'); breakBlock(); } else { breakBlock(); write('```\n'); pre += 1; }
      continue;
    }
    if (name === 'a') {
      if (closing) {
        const href = links.pop();
        if (href) write(`](${markdownLinkUrl(href)})`);
      } else {
        const href = /^(https?:|mailto:)/i.test(attrs.href || '') ? attrs.href : '';
        links.push(href);
        if (href) write('[');
      }
      continue;
    }
    if (name === 'img') {
      const src = /^https?:/i.test(attrs.src || '') ? attrs.src : '';
      if (src) write(`![${markdownLinkTitle(attrs.alt || '')}](${markdownLinkUrl(src)})`);
      continue;
    }
    if (INLINE_MARK[name] && !(name === 'code' && pre)) { write(INLINE_MARK[name]); continue; }
    if (BLOCK.has(name)) {
      if (name === 'p' && item) { if (!closing && item.title) item.title += ' '; continue; }
      if (name === 'p' && lists.length) continue; // a list item's paragraph
      breakBlock();
      if (name === 'hr' && !closing) { write('---'); breakBlock(); }
      continue;
    }
    // label, input, span and anything else: their text only.
  }
  const text = out.split('\n').map(line => line.replace(/[ \t]+$/, '')).join('\n')
    .replace(/\n{3,}/g, '\n\n').trim();
  return { text, checklists: checklists.filter(c => c.items.length) };
}

const escapeHtml = value => String(value)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// WeKan text (and checklists) as the HTML Vikunja's editor stores: paragraphs,
// line breaks, and TipTap task lists - each under a heading with its title,
// except a single list with the default title.
export function vikunjaHtml(text, checklists = []) {
  const paragraphs = String(text || '').replace(/\r\n?/g, '\n').split(/\n{2,}/)
    .map(part => part.trim()).filter(Boolean)
    .map(part => `<p>${part.split('\n').map(escapeHtml).join('<br>')}</p>`);
  const lists = list(checklists).filter(c => list(c && c.items).length);
  lists.forEach(checklist => {
    const title = String(checklist.title || '').trim();
    if (title && !(lists.length === 1 && title === DEFAULT_TITLE)) paragraphs.push(`<h3>${escapeHtml(title)}</h3>`);
    paragraphs.push(`<ul data-type="taskList">${checklist.items
      .map(entry => `<li data-checked="${entry.done ? 'true' : 'false'}" data-type="taskItem"><p>${escapeHtml(String(entry.title || '').trim())}</p></li>`)
      .join('')}</ul>`);
  });
  return paragraphs.join('');
}

// ------------------------------------------------------------------ import ---

const username = user => (isObject(user) ? str(user.username).trim() || str(user.name).trim() : '');
const byPosition = (a, b) => (num(a.position) ?? 0) - (num(b.position) ?? 0);
const isKanban = view => isObject(view) && (view.view_kind === 'kanban' || view.view_kind === 3);

// The lists of one project and where each of its tasks goes.
function projectLayout(project, at, unsupported) {
  const views = list(project.views).filter(isObject);
  const buckets = list(project.buckets).filter(isObject);
  const kanbans = views.filter(isKanban).sort(byPosition);
  const view = kanbans[0];
  if (kanbans.length > 1) {
    unsupported.push({ path: `${at}/views`, reason: `only the first kanban view's buckets ("${str(view.title)}") become lists; ${kanbans.length - 1} other kanban view(s) are not imported` });
  }
  let own = [];
  if (view) {
    own = buckets.filter(bucket => bucket.project_view_id === view.id);
    // A bucket without a view in a file that has views: older than its views.
    if (!own.length) own = buckets.filter(bucket => !bucket.project_view_id);
  } else if (!views.length) {
    own = buckets; // the 0.21-0.23 layout: buckets belong to the project
  }
  own = own.slice().sort(byPosition);
  const titles = new Map();
  own.forEach(bucket => {
    const title = str(bucket.title).trim() || 'Untitled';
    titles.set(bucket.id, title);
    if (num(bucket.limit) > 0) {
      unsupported.push({ path: `${at}/buckets/${bucket.id}/limit`, reason: `bucket "${title}" has a limit of ${bucket.limit} tasks; WIP limits are not imported` });
    }
  });
  const doneBucket = (view && view.done_bucket_id) || (own.find(bucket => bucket.is_done_bucket) || {}).id;
  const defaultBucket = (view && view.default_bucket_id) || (own[0] && own[0].id);
  const bucketOf = new Map();
  const positionOf = new Map();
  if (view && Array.isArray(project.task_buckets)) {
    project.task_buckets.filter(isObject)
      .filter(link => link.project_view_id === undefined || link.project_view_id === view.id)
      .forEach(link => { if (!bucketOf.has(link.task_id)) bucketOf.set(link.task_id, link.bucket_id); });
  }
  if (view && Array.isArray(project.positions)) {
    project.positions.filter(isObject).filter(entry => entry.project_view_id === view.id)
      .forEach(entry => positionOf.set(entry.task_id, num(entry.position)));
  }
  const columnOf = task => {
    const bucket = bucketOf.has(task.id) ? bucketOf.get(task.id) : task.bucket_id;
    if (titles.has(bucket)) return titles.get(bucket);
    if (task.done && titles.has(doneBucket)) return titles.get(doneBucket);
    if (titles.has(defaultBucket)) return titles.get(defaultBucket);
    if (own.length) return titles.get(own[0].id);
    // A project without buckets: Vikunja's own default buckets.
    return task.done ? 'Done' : 'To-Do';
  };
  const positionOfTask = (task, index) => positionOf.get(task.id) ?? num(task.kanban_position) ?? num(task.position) ?? index;
  return { titles: [...new Set(titles.values())], columnOf, positionOfTask };
}

function relationKey(from, to, type) {
  if (type === 'related-to') return `related:${[from, to].sort().join(':')}`;
  return `${from}:${to}:${type}`;
}

// The shared task shape of models/kanboardCreator.js for a Vikunja task.
function parseTask(task, { at, swimlane, column, archived }, unsupported, state) {
  const title = str(task.title).trim();
  if (!title) {
    unsupported.push({ path: at, reason: 'a Vikunja task without a title is not imported' });
    return null;
  }
  const ref = task.id === undefined || task.id === null ? '' : String(task.id);
  const { text, checklists } = vikunjaHtmlToText(task.description);
  const people = list(task.assignees).map(username).filter(Boolean);
  const customFields = {};
  const priority = num(task.priority);
  if (priority) {
    if (VIKUNJA_PRIORITIES[priority]) customFields.Priority = VIKUNJA_PRIORITIES[priority];
    else unsupported.push({ path: `${at}/priority`, reason: `Vikunja priority ${task.priority} is not one of 0-5` });
  }
  const percent = num(task.percent_done);
  if (percent > 0) customFields['Percent Done'] = Math.round(Math.min(percent, 1) * 100);
  if (task.done === true) customFields.Done = true;
  const labels = list(task.labels).filter(isObject);
  if (labels.some(label => str(label.hex_color).trim())) state.labelColors = true;
  const end = vikunjaDate(task.end_date) || (task.done === true ? vikunjaDate(task.done_at) : undefined);
  const parsed = {
    title,
    description: text,
    column_name: column,
    swimlane_name: swimlane,
    tags: [...new Set(labels.map(label => str(label.title).trim()).filter(Boolean))],
    ...(ref ? { ref } : {}),
    ...(people.length ? { owner_username: people[0] } : {}),
    ...(people.length > 1 ? { assignees: people.slice(1) } : {}),
    ...(username(task.created_by) ? { requested_by: username(task.created_by) } : {}),
    ...(vikunjaDate(task.due_date) ? { date_due: vikunjaDate(task.due_date) } : {}),
    ...(vikunjaDate(task.start_date) ? { date_started: vikunjaDate(task.start_date) } : {}),
    ...(end ? { date_end: end } : {}),
    ...(vikunjaDate(task.created) ? { date_creation: vikunjaDate(task.created) } : {}),
    ...(str(task.hex_color).trim() ? { color: str(task.hex_color).trim().replace(/^#/, '') } : {}),
    ...(archived ? { archived: true } : {}),
    ...(Object.keys(customFields).length ? { custom_fields: customFields } : {}),
    ...(checklists.length ? { checklists } : {}),
  };
  const comments = list(task.comments).filter(isObject).map(comment => ({
    text: vikunjaHtmlToText(comment.comment, { checklists: false }).text,
    author: username(comment.author),
    date: vikunjaDate(comment.created),
  })).filter(comment => comment.text);
  if (comments.length) parsed.comments = comments;

  // Relations: subtask/parenttask make the card tree, the rest dependencies.
  const related = isObject(task.related_tasks) ? task.related_tasks : {};
  const dependencies = [];
  for (const [kind, others] of Object.entries(related)) {
    const ids = list(others).filter(isObject).map(other => other.id).filter(id => id !== undefined && id !== null).map(String);
    if (!ids.length) continue;
    if (kind === 'parenttask') {
      parsed.parent_ref = ids[0];
      if (ids.length > 1) unsupported.push({ path: `${at}/related_tasks/parenttask`, reason: `a card has one parent; ${ids.length - 1} further parent task(s) are not linked` });
    } else if (kind === 'subtask') {
      ids.forEach(child => { if (!state.parentOf.has(child)) state.parentOf.set(child, ref); });
    } else if (RELATION_TYPES[kind]) {
      const type = RELATION_TYPES[kind];
      ids.forEach(other => {
        if (!ref || state.relations.has(relationKey(ref, other, type)) || state.relations.has(relationKey(other, ref, INVERSE_TYPES[type]))) return;
        state.relations.add(relationKey(ref, other, type));
        dependencies.push({ ref: other, type });
      });
    } else {
      unsupported.push({ path: `${at}/related_tasks/${kind}`, reason: `Vikunja "${kind}" relations have no WeKan dependency type and are not imported` });
    }
  }
  if (dependencies.length) parsed.dependencies = dependencies;

  // What has no place on a WeKan card.
  list(task.attachments).filter(isObject).forEach(attachment => {
    const file = isObject(attachment.file) ? attachment.file : {};
    unsupported.push({ path: `${at}/attachments/${attachment.id ?? ''}`,
      reason: `attachment "${str(file.name) || `file ${file.id ?? ''}`}" is not imported; its bytes are files/${file.id ?? ''} in the export` });
  });
  const reminders = list(task.reminders).length + list(task.reminder_dates).length;
  if (reminders) unsupported.push({ path: `${at}/reminders`, reason: `${reminders} reminder(s) are not imported` });
  if (num(task.repeat_after) > 0 || num(task.repeat_mode) === 1) {
    unsupported.push({ path: `${at}/repeat_after`, reason: 'a repeating Vikunja task is imported once; its repeat is not imported' });
  }
  if (isObject(task.reactions) ? Object.keys(task.reactions).length : list(task.reactions).length) {
    unsupported.push({ path: `${at}/reactions`, reason: 'reactions are not imported' });
  }
  return parsed;
}

// input: the text of data.json, its parsed array, or what
// server/lib/vikunjaArchive.js reads from the zip: { version, data, files, filters }.
export function parseVikunjaExport(input) {
  let data = input;
  let version;
  let archive = null;
  if (isObject(input)) {
    archive = input;
    version = input.version;
    data = input.data;
  }
  if (typeof data === 'string') {
    if (!data.trim()) throw new Error('Vikunja export is empty');
    if (data.length > MAX_VIKUNJA_DATA_CHARS) throw new Error(`Vikunja data.json is larger than ${MAX_VIKUNJA_DATA_CHARS} characters`);
    try { data = JSON.parse(data); } catch (error) { throw new Error('Vikunja data.json is not valid JSON'); }
  }
  if (data === undefined || data === null) throw new Error('Vikunja export is empty');
  if (!Array.isArray(data)) throw new Error('Vikunja data.json must be an array of projects');
  const unsupported = [];
  if (archive && version !== undefined) checkVersion(version, unsupported);
  // -1 is Vikunja's Favorites pseudo project, which its own import skips too.
  const projects = data.filter(isObject).filter(project => project.id !== -1);
  if (!projects.length) throw new Error('Vikunja export has no projects');
  const taskCount = projects.reduce((sum, project) => sum + list(project.tasks).length, 0);
  if (taskCount > MAX_VIKUNJA_TASKS) throw new Error(`Vikunja export has more than ${MAX_VIKUNJA_TASKS} tasks`);

  let chosen = projects.filter(project => list(project.tasks).length);
  if (!chosen.length) chosen = projects.filter(project => list(project.buckets).length);
  if (!chosen.length) chosen = [projects[0]];
  // Projects under one parent are that parent's board, one swimlane each -
  // also the ones without tasks, so a board exported with several swimlanes
  // keeps them all.
  const byId = new Map(projects.map(project => [project.id, project]));
  const parents = new Set(chosen.map(project => project.parent_project_id || 0));
  const parentId = parents.size === 1 ? [...parents][0] : 0;
  const parent = parentId ? byId.get(parentId) : undefined;
  if (parent) chosen = projects.filter(project => project.parent_project_id === parentId);
  const imported = new Set(chosen);
  projects.filter(project => !imported.has(project) && project !== parent)
    .forEach(project => unsupported.push({ path: `/projects/${project.id}`,
      reason: `project "${str(project.title)}" ${list(project.tasks).length ? 'is not under the same parent project and is not imported' : 'has no tasks and is not imported'}` }));

  let boardName = str(chosen[0].title).trim();
  const swimlaneOf = new Map();
  if (parent || chosen.length > 1) {
    boardName = (parent && str(parent.title).trim()) || 'Imported Vikunja';
    const seen = new Map();
    chosen.forEach(project => {
      const title = str(project.title).trim() || `Project ${project.id}`;
      seen.set(title, (seen.get(title) || 0) + 1);
    });
    chosen.forEach(project => {
      const title = str(project.title).trim() || `Project ${project.id}`;
      swimlaneOf.set(project, seen.get(title) > 1 ? `${title} (${project.id})` : title);
    });
  } else {
    swimlaneOf.set(chosen[0], 'Default');
  }

  const columns = [];
  const columnSet = new Set();
  const addColumn = title => { if (!columnSet.has(title)) { columnSet.add(title); columns.push(title); } };
  const tasks = [];
  const state = { parentOf: new Map(), relations: new Set(), labelColors: false };
  chosen.forEach(project => {
    const at = `/projects/${project.id}`;
    const layout = projectLayout(project, at, unsupported);
    layout.titles.forEach(addColumn);
    if (str(project.hex_color).trim()) unsupported.push({ path: `${at}/hex_color`, reason: 'the project color is not imported' });
    if (str(project.description).trim()) unsupported.push({ path: `${at}/description`, reason: 'the project description is not imported' });
    if ((isObject(project.background_information) && project.background_information.id) || num(project.background_file_id) > 0) {
      unsupported.push({ path: `${at}/background_information`, reason: 'the project background image is not imported' });
    }
    if (project.is_archived === true) unsupported.push({ path: `${at}/is_archived`, reason: 'the project is archived; its tasks are imported as archived cards' });
    const projectTasks = list(project.tasks).filter(isObject)
      .map((task, index) => ({ task, index, position: layout.positionOfTask(task, index) }))
      .sort((a, b) => (a.position - b.position) || (a.index - b.index));
    projectTasks.forEach(({ task }) => {
      const column = layout.columnOf(task);
      addColumn(column);
      const parsed = parseTask(task, { at: `${at}/tasks/${task.id ?? ''}`, swimlane: swimlaneOf.get(project), column,
        archived: project.is_archived === true }, unsupported, state);
      if (parsed) tasks.push(parsed);
    });
  });
  tasks.forEach(task => {
    if (task.parent_ref === undefined && task.ref && state.parentOf.has(task.ref)) task.parent_ref = state.parentOf.get(task.ref);
  });
  if (state.labelColors) unsupported.push({ path: '/labels', reason: 'Vikunja label colors are not imported; labels get WeKan\'s default color' });
  if (archive && num(archive.filters) > 0) unsupported.push({ path: '/filters.json', reason: `${archive.filters} saved filter(s) are not imported` });
  return {
    board: { name: boardName || 'Imported Vikunja' },
    columns: (columns.length ? columns : ['To-Do']).map(title => ({ title })),
    swimlanes: [...new Set(chosen.map(project => swimlaneOf.get(project)))].map(name => ({ name })),
    tasks,
    warnings: [],
    unsupported,
  };
}

// ------------------------------------------------------------------ export ---

// Vikunja's priority number for a WeKan Priority custom field value: one of
// the names above, a number 0-5, or Microsoft Planner's names.
export function vikunjaPriority(value) {
  if (typeof value === 'number') return Number.isInteger(value) && value >= 0 && value <= 5 ? value : 0;
  const text = String(value || '').trim().toLowerCase();
  if (/^[0-5]$/.test(text)) return +text;
  const index = VIKUNJA_PRIORITIES.findIndex(name => name && name.toLowerCase() === text);
  if (index > 0) return index;
  return { important: 3, 'do now': 5 }[text] || 0;
}

// The collected board (models/lib/externalExporters.js) as Vikunja projects:
// one project named after the board, or - with several swimlanes - that
// project as the parent of one child project per swimlane. Each has Vikunja's
// four views; the kanban view's buckets are the lists (a list called Done is
// its done bucket), and labels, people, dates, Priority, Percent Done and
// Done custom fields, comments and parent cards go to their Vikunja fields.
// Descriptions and comments stay text here, so the export boundary checks
// them as text; vikunjaArchiveFiles() turns them into Vikunja's HTML.
export function formatVikunja({ board, lists, swimlanes, items }, now = new Date()) {
  const stamp = now.toISOString();
  const title = String((board && board.title) || 'WeKan board').trim() || 'WeKan board';
  const lanes = list(swimlanes).map(lane => String(lane.title || '').trim() || 'Default');
  const several = lanes.length > 1;
  const counters = { project: 0, view: 0, bucket: 0, comment: 0 };
  const id = kind => { counters[kind] += 1; return counters[kind]; };
  const users = new Map();
  const user = name => {
    const key = String(name || '').trim();
    if (!key) return null;
    if (!users.has(key)) users.set(key, { id: users.size + 1, name: '', username: key, created: stamp, updated: stamp });
    return users.get(key);
  };
  const labels = new Map();
  const label = name => {
    if (!labels.has(name)) labels.set(name, { id: labels.size + 1, title: name, description: '', hex_color: '', created: stamp, updated: stamp });
    return labels.get(name);
  };
  const listTitles = list(lists).map(entry => String(entry.title || '').trim() || 'Untitled');
  list(items).forEach(item => {
    const name = String(item.listTitle || '').trim() || 'Untitled';
    if (!listTitles.includes(name)) listTitles.push(name);
  });
  const wip = new Map(list(lists).map(entry => [String(entry.title || '').trim() || 'Untitled',
    entry.wipLimit && entry.wipLimit.enabled && Number(entry.wipLimit.value) > 0 ? Number(entry.wipLimit.value) : 0]));

  const projects = [];
  const parentId = several ? id('project') : 0;
  if (several) {
    projects.push({ id: parentId, title, description: '', identifier: '', hex_color: '', parent_project_id: 0,
      is_archived: false, background_information: null, position: POSITION_STEP, views: [], child_projects: null,
      tasks: [], buckets: [], task_buckets: [], positions: [], background_file_id: 0, created: stamp, updated: stamp });
  }
  const laneProjects = (several ? lanes : [title]).map((laneTitle, index) => {
    const projectId = id('project');
    const views = ['list', 'gantt', 'table', 'kanban'].map((kind, viewIndex) => ({
      id: id('view'),
      title: kind[0].toUpperCase() + kind.slice(1),
      project_id: projectId,
      view_kind: kind,
      filter: null,
      position: (viewIndex + 1) * 100,
      bucket_configuration_mode: kind === 'kanban' ? 'manual' : 'none',
      bucket_configuration: null,
      default_bucket_id: 0,
      done_bucket_id: 0,
      created: stamp,
      updated: stamp,
    }));
    const buckets = listTitles.map((bucketTitle, bucketIndex) => ({
      id: id('bucket'),
      title: bucketTitle,
      project_view_id: views[3].id,
      limit: wip.get(bucketTitle) || 0,
      position: (bucketIndex + 1) * POSITION_STEP,
      created: stamp,
      updated: stamp,
    }));
    const kanban = views[3];
    kanban.default_bucket_id = buckets.length ? buckets[0].id : 0;
    const done = buckets.find(bucket => /^done$/i.test(bucket.title));
    kanban.done_bucket_id = done ? done.id : 0;
    return { id: projectId, title: laneTitle, description: '', identifier: '', hex_color: '',
      parent_project_id: parentId, is_archived: false, background_information: null,
      position: (index + 1) * POSITION_STEP, views, child_projects: null, tasks: [], buckets,
      task_buckets: [], positions: [], background_file_id: 0, created: stamp, updated: stamp,
      kanbanId: kanban.id, doneBucketId: kanban.done_bucket_id };
  });

  const taskIdOf = new Map();
  const checklists = {};
  let taskId = 0;
  list(items).forEach(item => {
    taskId += 1;
    if (item.cardId && !taskIdOf.has(item.cardId)) taskIdOf.set(item.cardId, { taskId, task: null });
  });
  taskId = 0;
  list(items).forEach(item => {
    taskId += 1;
    const lane = several ? Math.max(0, lanes.indexOf(String(item.swimlaneTitle || '').trim() || 'Default')) : 0;
    const project = laneProjects[lane];

    const bucket = project.buckets.find(entry => entry.title === (String(item.listTitle || '').trim() || 'Untitled')) || project.buckets[0];
    const fields = item.customFields || {};
    const isDone = fields.Done === true || Boolean(bucket && bucket.id === project.doneBucketId);
    const percent = Number(fields['Percent Done']);
    const people = [item.owner, ...list(item.assignees)].map(user).filter(Boolean);
    const position = (project.tasks.length + 1) * POSITION_STEP;
    const task = {
      id: taskId,
      title: String(item.title || '').trim() || 'Untitled',
      description: item.description || '',
      done: isDone,
      done_at: isDone ? vikunjaTime(item.endAt || stamp) : ZERO_TIME,
      due_date: vikunjaTime(item.dueAt),
      start_date: vikunjaTime(item.startAt),
      end_date: vikunjaTime(item.endAt),
      reminders: [],
      repeat_after: 0,
      repeat_mode: 0,
      priority: vikunjaPriority(fields.Priority),
      assignees: [...new Set(people)],
      labels: [...new Set(list(item.labels).map(name => String(name).trim()).filter(Boolean))].map(label),
      hex_color: '',
      percent_done: Number.isFinite(percent) && percent > 0 ? Math.min(percent, 100) / 100 : 0,
      identifier: '',
      index: project.tasks.length + 1,
      project_id: project.id,
      related_tasks: {},
      attachments: [],
      cover_image_attachment_id: 0,
      is_favorite: false,
      bucket_id: bucket ? bucket.id : 0,
      position,
      created: vikunjaTime(item.createdAt || stamp),
      updated: stamp,
      ...(user(item.creator || item.requestedBy) ? { created_by: user(item.creator || item.requestedBy) } : {}),
      comments: list(item.comments).filter(comment => String(comment.text || '').trim()).map(comment => ({
        id: id('comment'),
        comment: String(comment.text || ''),
        ...(user(comment.author) ? { author: user(comment.author) } : {}),
        created: vikunjaTime(comment.date || stamp),
        updated: vikunjaTime(comment.date || stamp),
      })),
    };
    if (list(item.checklists).some(entry => list(entry.items).length)) {
      checklists[taskId] = list(item.checklists).map(entry => ({ title: String(entry.title || ''),
        items: list(entry.items).map(it => ({ title: String(it.title || ''), done: Boolean(it.done) })) }));
    }
    project.tasks.push(task);
    if (item.cardId && taskIdOf.get(item.cardId).taskId === taskId) taskIdOf.get(item.cardId).task = task;
    if (bucket) project.task_buckets.push({ bucket_id: bucket.id, task_id: taskId, project_view_id: project.kanbanId });
    project.positions.push({ task_id: taskId, project_view_id: project.kanbanId, position });
  });
  // Parent cards as Vikunja's subtask/parenttask pair, by id only: an id
  // that is not in the same project is dropped by Vikunja's import, never
  // duplicated as a new task.
  list(items).forEach(item => {
    const child = item.cardId && taskIdOf.get(item.cardId);
    const parent = item.parentCardId && taskIdOf.get(item.parentCardId);
    if (!child || !parent || !child.task || !parent.task || child.taskId === parent.taskId) return;
    const childTask = child.task;
    const parentTask = parent.task;
    childTask.related_tasks.parenttask = [{ id: parent.taskId }];
    (parentTask.related_tasks.subtask = parentTask.related_tasks.subtask || []).push({ id: child.taskId });
  });
  laneProjects.forEach(project => {
    delete project.kanbanId;
    delete project.doneBucketId;
    projects.push(project);
  });
  return { version: VIKUNJA_EXPORT_VERSION, projects, checklists };
}

// The files of the export zip for formatVikunja()'s result, descriptions and
// comments as Vikunja's HTML; server/lib/vikunjaArchive.js zips them.
export function vikunjaArchiveFiles({ version, projects, checklists } = {}) {
  const lists = isObject(checklists) ? checklists : {};
  const data = list(projects).map(project => ({
    ...project,
    tasks: list(project.tasks).map(task => ({
      ...task,
      description: vikunjaHtml(task.description, lists[task.id]),
      comments: list(task.comments).map(comment => ({ ...comment, comment: vikunjaHtml(comment.comment) })),
    })),
  }));
  return {
    'data.json': JSON.stringify(data),
    'filters.json': '[]',
    // Vikunja parses this file as it is: no trailing newline.
    VERSION: String(version || VIKUNJA_EXPORT_VERSION).trim(),
  };
}
