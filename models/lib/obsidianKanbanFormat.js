// Obsidian Kanban plugin boards (the plugin's own Markdown file), read and
// written in plain JavaScript so tests/obsidianKanban.test.cjs runs the round
// trip in Node. The grammar follows the plugin's parser and writer
// (src/parsers/formats/list.ts, parseMarkdown.ts and common.ts of
// mgmeyers/obsidian-kanban); docs/Features/ImportExport/Format-Coverage.md
// links them.
//
//   ---
//
//   kanban-plugin: board
//
//   ---
//
//   ## Doing (3)                    a lane; "(3)" is its card limit
//
//   **Complete**                    optional: this lane's cards are complete
//   - [ ] Title #tag @{2026-10-15} @@{14:30} 📅 2026-10-20 ⏫ key:: value
//       more lines, indented 4 spaces or a tab: the card's body
//
//
//
//   ***
//
//   ## Archive                      archived cards
//
//   %% kanban:settings
//   ```
//   {"kanban-plugin":"board","date-format":"YYYY-MM-DD"}
//   ```
//   %%
//
// A card maps to:
//   lane / "(N)"                -> list / its WIP limit
//   first line / body           -> title / description ("<br>" in the first
//                                  line starts the description)
//   [x] or a **Complete** lane  -> label "done", as the generic Markdown
//                                  import does
//   #tag                        -> label
//   @{date} @@{time}            -> due date (in the settings' date-format)
//   📅 🛫 ➕ ✅ (Tasks plugin)   -> due, start, created, end dates
//   ⏳ scheduled                -> start date when there is no 🛫
//   🔺⏫🔼🔽⏬                  -> custom field Priority (Highest .. Lowest)
//   🆔 id / ⛔ ids              -> source reference / "is blocked by" links
//   key:: value (Dataview)      -> custom field
//   - [ ] lines in the body     -> the card's checklist
//   Archive section             -> archived cards
// Reported: 🔁 recurrence, ❌ cancelled dates, other frontmatter keys and
// dates that do not match the date format. Wikilinks stay text.

const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD';
const PRIORITY = { '🔺': 'Highest', '⏫': 'High', '🔼': 'Medium', '🔽': 'Low', '⏬': 'Lowest' };
const PRIORITY_EMOJI = Object.fromEntries(Object.entries(PRIORITY).map(([emoji, name]) => [name, emoji]));
const TASK_DATES = { '📅': 'date_due', '🛫': 'date_started', '➕': 'date_creation', '✅': 'date_end', '⏳': 'scheduled', '❌': 'cancelled' };
const FRONTMATTER_KEY = 'kanban-plugin';
const BOARD_KINDS = ['board', 'basic', 'table', 'list'];
const COMPLETE = '**Complete**';
const ARCHIVE_BREAK = '***';
const LANE = /^##\s+(.*?)\s*$/;
const LANE_LIMIT = /^(.*?)\s*\((\d+)\)$/;
const CARD = /^[-*+]\s+\[(.)\]\s?(.*)$/;
const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
// Settings keys the plugin keeps in the frontmatter or footer (src/Settings.ts):
// layout and editor preferences, which WeKan has no place for and does not need.
const SETTING_KEY = /^(append-archive-date|archive-date-format|archive-date-separator|archive-with-date|date-colors|date-display-format|date-format|date-picker-week-start|date-trigger|link-date-to-daily-note|max-archive-size|move-dates|show-relative-date|time-format|time-trigger|full-list-lane-width|hide-card-count|lane-width|list-collapse|table-sizing|inline-metadata-position|metadata-keys|move-tags|move-task-metadata|tag-action|tag-colors|tag-sort|new-card-insertion-method|new-line-trigger|new-note-folder|new-note-template|show-add-list|show-archive-all|show-board-settings|show-checkboxes|show-search|show-set-view|show-view-as-markdown)$/;

const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// A date in the board's date-format (YYYY, MM, M, DD, D tokens), as ISO.
export function obsidianDate(text, format = DEFAULT_DATE_FORMAT, time = '') {
  const tokens = [];
  const pattern = escapeRegExp(format).replace(/YYYY|MM|M|DD|D/g, token => {
    tokens.push(token);
    return token === 'YYYY' ? '(\\d{4})' : token.length === 2 ? '(\\d{2})' : '(\\d{1,2})';
  });
  const match = new RegExp(`^${pattern}$`).exec(String(text || '').trim());
  if (!match || !tokens.includes('YYYY') || !tokens.some(t => t[0] === 'M') || !tokens.some(t => t[0] === 'D')) return undefined;
  const part = letter => +match[tokens.findIndex(t => t[0] === letter) + 1];
  const [hours, minutes] = /^(\d{1,2}):(\d{2})$/.test(time) ? time.split(':').map(Number) : [0, 0];
  const date = new Date(Date.UTC(part('Y'), part('M') - 1, part('D'), hours, minutes));
  return date.getUTCMonth() === part('M') - 1 && date.getUTCDate() === part('D') ? date.toISOString() : undefined;
}

function readFrontmatter(lines, unsupported) {
  if ((lines[0] || '').trim() !== '---') throw new Error('An Obsidian Kanban board starts with its --- frontmatter');
  const end = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
  if (end === -1) throw new Error('The Obsidian Kanban frontmatter has no closing ---');
  const values = {};
  lines.slice(1, end).forEach(line => {
    const match = /^([\w-]+):\s*(.*?)\s*$/.exec(line);
    if (match) values[match[1]] = match[2].replace(/^["']|["']$/g, '');
  });
  if (!BOARD_KINDS.includes(values[FRONTMATTER_KEY])) {
    throw new Error('The frontmatter does not say kanban-plugin: board; this is not an Obsidian Kanban board');
  }
  Object.keys(values).filter(key => key !== FRONTMATTER_KEY && !SETTING_KEY.test(key))
    .forEach(key => unsupported.push({ path: `/frontmatter/${key}`, reason: `frontmatter "${key}" has no WeKan place` }));
  return { values, bodyStart: end + 1 };
}

// The %% kanban:settings ... %% footer, and where it starts.
function readSettings(lines) {
  const start = lines.findIndex(line => line.trim() === '%% kanban:settings');
  if (start === -1) return { settings: {}, end: lines.length };
  const json = lines.slice(start + 1).join('\n').replace(/%%\s*$/, '').replace(/```/g, '').trim();
  try { return { settings: JSON.parse(json) || {}, end: start }; } catch (e) { return { settings: {}, end: start }; }
}

function parseCard(first, body, { format, trigger, timeTrigger }, at, unsupported) {
  const custom = {};
  const tags = [];
  const card = {};
  const [titleLine, ...titleRest] = first.split(/<br\s*\/?>/i);
  let text = titleLine;
  const dateRe = new RegExp(`${escapeRegExp(trigger)}(?:\\{([^}]*)\\}|\\[\\[([^\\]]*)\\]\\])`);
  const timeRe = new RegExp(`${escapeRegExp(timeTrigger)}\\{([^}]*)\\}`);
  const time = timeRe.exec(text);
  if (time) text = text.replace(time[0], ' ');
  const date = dateRe.exec(text);
  if (date) {
    text = text.replace(date[0], ' ');
    const value = date[1] !== undefined ? date[1] : date[2];
    const iso = obsidianDate(value, format, time ? time[1] : '');
    if (iso) card.date_due = iso;
    else unsupported.push({ path: at, reason: `date "${value}" does not match the board's date format ${format}` });
  }
  for (const [emoji, field] of Object.entries(TASK_DATES)) {
    const match = new RegExp(`${emoji}\\uFE0F?\\s*(\\d{4}-\\d{2}-\\d{2})`).exec(text);
    if (!match) continue;
    text = text.replace(match[0], ' ');
    const iso = obsidianDate(match[1], DEFAULT_DATE_FORMAT);
    if (field === 'cancelled') unsupported.push({ path: at, reason: 'a cancelled date (❌) has no WeKan place' });
    else if (field === 'scheduled') { if (iso) card.scheduled = iso; } else if (iso && !card[field]) card[field] = iso;
  }
  if (card.scheduled) { if (!card.date_started) card.date_started = card.scheduled; delete card.scheduled; }
  for (const [emoji, name] of Object.entries(PRIORITY)) {
    if (text.includes(emoji)) { custom.Priority = name; text = text.split(emoji).join(' '); }
  }
  const repeat = /🔁️?\s*([^📅🛫➕✅⏳❌🆔⛔#]*)/u.exec(text);
  if (repeat) {
    text = text.replace(repeat[0], ' ');
    unsupported.push({ path: at, reason: `recurrence "🔁 ${repeat[1].trim()}" is imported once` });
  }
  const id = /🆔️?\s*([\w-]+)/u.exec(text);
  if (id) { card.ref = id[1]; text = text.replace(id[0], ' '); }
  const depends = /⛔️?\s*([\w-]+(?:\s*,\s*[\w-]+)*)/u.exec(text);
  if (depends) {
    card.dependencies = depends[1].split(',').map(ref => ({ ref: ref.trim(), type: 'is-blocked-by' }));
    text = text.replace(depends[0], ' ');
  }
  const block = /\s\^([\w-]+)\s*$/.exec(text);
  if (block) { if (!card.ref) card.ref = block[1]; text = text.slice(0, block.index); }
  text = text.replace(/(^|\s)#([^\s#]+)/g, (all, space, tag) => { tags.push(tag); return space; });
  const description = [...titleRest, ...body].join('\n');
  const fields = [];
  const items = [];
  const kept = description.split('\n').filter(line => {
    const match = /^\s*([\w][\w -]*?)::\s*(.+?)\s*$/.exec(line);
    if (match) { fields.push(match); return false; }
    // A task list inside the card's body is its checklist.
    const item = /^[-*+]\s+\[(.)\]\s+(.+?)\s*$/.exec(line);
    if (item) { items.push({ title: item[2], done: item[1] !== ' ' }); return false; }
    return true;
  });
  fields.forEach(match => { custom[match[1].trim()] = match[2]; });
  return {
    title: text.replace(/\s+/g, ' ').trim() || 'Untitled',
    description: kept.join('\n').trim(),
    tags,
    ...card,
    ...(Object.keys(custom).length ? { custom_fields: custom } : {}),
    ...(items.length ? { checklists: [{ title: 'Checklist', items }] } : {}),
  };
}

export function parseObsidianKanban(text) {
  const lines = String(text == null ? '' : text).replace(/^﻿/, '').split(/\r\n|\r|\n/);
  const unsupported = [];
  const { values, bodyStart } = readFrontmatter(lines, unsupported);
  const { settings, end } = readSettings(lines);
  const options = {
    format: settings['date-format'] || values['date-format'] || DEFAULT_DATE_FORMAT,
    trigger: settings['date-trigger'] || values['date-trigger'] || '@',
    timeTrigger: settings['time-trigger'] || values['time-trigger'] || '@@',
  };
  const columns = [];
  const tasks = [];
  let lane = null;
  let complete = false;
  let archived = false;
  let afterBreak = false;
  let card = null;
  let body = [];
  const flush = () => {
    if (!card) return;
    const task = parseCard(card.first, body, options, card.at, unsupported);
    task.column_name = card.lane;
    task.swimlane_name = 'Default';
    if (card.done && !task.tags.includes('done')) task.tags.push('done');
    if (card.archived) task.archived = true;
    tasks.push(task);
    card = null;
    body = [];
  };
  for (let index = bodyStart; index < end; index += 1) {
    const line = lines[index];
    const at = `/line/${index + 1}`;
    if (card && /^( {4}|\t)/.test(line)) { body.push(line.replace(/^( {4}|\t)/, '')); continue; }
    if (card && !line.trim()) { flush(); continue; }
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed === ARCHIVE_BREAK) { flush(); afterBreak = true; continue; }
    const laneMatch = LANE.exec(line);
    if (laneMatch) {
      flush();
      if (afterBreak) { archived = true; continue; }
      const limited = LANE_LIMIT.exec(laneMatch[1]);
      lane = { title: (limited ? limited[1] : laneMatch[1]) || 'Untitled', ...(limited ? { wip_limit: +limited[2] } : {}) };
      if (!columns.some(c => c.title === lane.title)) columns.push(lane);
      complete = false;
      continue;
    }
    if (trimmed === COMPLETE) { complete = true; continue; }
    const cardMatch = CARD.exec(line);
    if (cardMatch) {
      flush();
      if (!archived && !lane) {
        lane = { title: 'Untitled' };
        columns.push(lane);
      }
      const home = archived ? (lane || columns[0] || { title: 'Archive' }) : lane;
      if (archived && !columns.some(c => c.title === home.title)) columns.push(home);
      card = { first: cardMatch[2], at, lane: home.title, done: complete || cardMatch[1] !== ' ', archived };
      continue;
    }
    unsupported.push({ path: at, reason: 'line is not a lane, a card or a card\'s body' });
  }
  flush();
  return {
    board: { name: 'Imported Obsidian Kanban board' },
    columns,
    swimlanes: [{ name: 'Default' }],
    tasks,
    warnings: [],
    unsupported,
  };
}

const day = value => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};
const clock = value => {
  const date = new Date(value);
  const text = Number.isNaN(date.getTime()) ? '00:00' : date.toISOString().slice(11, 16);
  return text === '00:00' ? '' : text;
};

// The board as the plugin writes it (boardToMd): frontmatter, each lane with a
// blank line, its cards and three blank lines, then the settings footer.
// WeKan exports no archived cards, so there is no Archive section.
export function formatObsidianKanban({ lists, items }) {
  const titles = (Array.isArray(lists) ? lists : []).map(list => list.title).filter(Boolean);
  for (const item of items || []) if (item.listTitle && !titles.includes(item.listTitle)) titles.push(item.listTitle);
  const limits = Object.fromEntries((Array.isArray(lists) ? lists : [])
    .filter(list => list.wipLimit && list.wipLimit.enabled && list.wipLimit.value > 0)
    .map(list => [list.title, list.wipLimit.value]));
  let out = '---\n\nkanban-plugin: board\n\n---\n\n';
  for (const title of titles) {
    out += `## ${title}${limits[title] ? ` (${limits[title]})` : ''}\n\n`;
    for (const item of (items || []).filter(it => it.listTitle === title)) {
      const labels = (Array.isArray(item.labels) ? item.labels : []).filter(Boolean);
      const done = labels.includes('done') || Boolean(item.endAt);
      const fields = item.customFields || {};
      const parts = [String(item.title || '').replace(/\s+/g, ' ').trim() || 'Untitled'];
      labels.filter(label => label !== 'done').forEach(label => parts.push(`#${String(label).trim().replace(/\s+/g, '-')}`));
      if (item.dueAt) {
        parts.push(`@{${day(item.dueAt)}}`);
        if (clock(item.dueAt)) parts.push(`@@{${clock(item.dueAt)}}`);
      }
      if (item.startAt) parts.push(`🛫 ${day(item.startAt)}`);
      if (item.endAt) parts.push(`✅ ${day(item.endAt)}`);
      if (PRIORITY_EMOJI[fields.Priority]) parts.push(PRIORITY_EMOJI[fields.Priority]);
      out += `- [${done ? 'x' : ' '}] ${parts.join(' ')}\n`;
      const body = [
        ...String(item.description || '').split(/\r\n|\r|\n/).filter((line, i, all) => line || i < all.length - 1),
        ...Object.entries(fields).filter(([name]) => name !== 'Priority').map(([name, value]) => `${name}:: ${value}`),
        ...(Array.isArray(item.checklists) ? item.checklists : []).flatMap(list => (Array.isArray(list.items) ? list.items : [])
          .map(entry => `- [${entry.done ? 'x' : ' '}] ${entry.title}`)),
      ].filter(line => line !== undefined);
      body.filter((line, i) => line || i < body.length - 1).forEach(line => { out += `    ${line}\n`; });
    }
    out += '\n\n\n';
  }
  out += `%% kanban:settings\n\`\`\`\n${JSON.stringify({ [FRONTMATTER_KEY]: 'board' })}\n\`\`\`\n%%\n`;
  return out;
}
