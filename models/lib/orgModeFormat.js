// Org mode (https://orgmode.org/manual/) TODO outlines, as Emacs, Orgzly,
// Beorg, organice and Logseq write them. Import and export live together so
// tests/orgMode.test.cjs runs the round trip in plain Node - no Meteor import
// here.
//
//   #+TITLE: Plant
//   #+TODO: TODO NEXT | DONE CANCELLED
//   * To Do
//   ** TODO [#A] Order valves                                :shop:urgent:
//      SCHEDULED: <2026-10-01 Thu> DEADLINE: <2026-10-10 Sat 14:30>
//      :PROPERTIES:
//      :CREATED:  [2026-09-01 Tue 12:00]
//      :END:
//      Two of them.
//      - [X] Measure
//      - [ ] Call the vendor
//   *** Fitting
//   **** DONE Seal
//
// A heading maps to:
//   level 1                 -> list
//   level 2                 -> card: the title without its keyword, priority
//                              and tags; a done keyword (DONE, or one after
//                              "|" in #+TODO) -> the `done` tag the markdown
//                              and outline imports use
//   [#A] [#B] [#C]          -> label "priority:A" ...
//   :tag1:tag2:             -> labels
//   SCHEDULED / DEADLINE / CLOSED -> start / due / end dates
//   :CREATED: property      -> creation date
//   body text               -> description; "- [ ]" / "- [X]" checkbox lines
//                              in it -> a checklist named after the card
//   level 3 with children   -> a checklist, its descendants the items
//   level 3 without         -> an item of the card's checklist
//   #+TITLE                 -> board title
// Timestamps carry no time zone in Org; they are read and written as UTC. A
// repeater (+1w) or warning delay (-2d) is dropped and reported, as are text
// under a list heading and before the first heading.

export const MAX_ORG_LENGTH = 16 * 1024 * 1024;
export const MAX_ORG_HEADINGS = 100000;
const DEFAULT_KEYWORDS = { todo: ['TODO'], done: ['DONE'] };
const HEADING = /^(\*+)\s+(.*)$/;
const TAGS = /\s+(:[^\s:]+(?::[^\s:]+)*:)\s*$/;
const PRIORITY = /^\[#([A-Z0-9])\]\s*/;
const TIMESTAMP = /[<[](\d{4})-(\d{2})-(\d{2})(?:\s+[^\s\d>\]]+)?(?:\s+(\d{1,2}):(\d{2})(?:-\d{1,2}:\d{2})?)?((?:\s+[.+]?\+\d+[hdwmy]|\s+-{1,2}\d+[hdwmy])*)\s*[>\]]/;
const CHECKBOX = /^\s*(?:[-+]|\d+[.)])\s+\[([ Xx-])\]\s+(.*)$/;
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// "<2026-10-10 Sat 14:30>" as ISO (UTC); { iso, extra } so a repeater can be reported.
export function orgTimestamp(text) {
  const match = TIMESTAMP.exec(String(text || ''));
  if (!match) return null;
  const date = new Date(Date.UTC(+match[1], +match[2] - 1, +match[3], +(match[4] || 0), +(match[5] || 0)));
  if (Number.isNaN(date.getTime()) || date.getUTCMonth() !== +match[2] - 1) return null;
  return { iso: date.toISOString(), extra: (match[6] || '').trim() };
}

function readKeywords(lines) {
  const todo = [];
  const done = [];
  for (const line of lines) {
    const match = /^#\+(?:TODO|SEQ_TODO|TYP_TODO):\s*(.*)$/i.exec(line.trim());
    if (!match) continue;
    const words = match[1].split(/\s+/).filter(Boolean).map(word => word.replace(/\(.*\)$/, ''));
    const bar = words.indexOf('|');
    if (bar === -1) { todo.push(...words.slice(0, -1)); if (words.length) done.push(words[words.length - 1]); } else {
      todo.push(...words.slice(0, bar)); done.push(...words.slice(bar + 1));
    }
  }
  return todo.length || done.length ? { todo, done } : DEFAULT_KEYWORDS;
}

export function parseOrgMode(text) {
  const source = String(text == null ? '' : text);
  if (source.length > MAX_ORG_LENGTH) throw new Error('Org file is too large');
  const lines = source.replace(/^﻿/, '').split(/\r\n|\r|\n/);
  const keywords = readKeywords(lines);
  const unsupported = [];
  // Headings with the lines under them.
  const headings = [];
  let title = '';
  lines.forEach((line, index) => {
    const heading = HEADING.exec(line);
    if (heading) {
      if (headings.length >= MAX_ORG_HEADINGS) throw new Error('Org file has too many headings');
      headings.push({ level: heading[1].length, raw: heading[2], line: index + 1, body: [] });
    } else if (headings.length) headings[headings.length - 1].body.push(line);
    else {
      const meta = /^#\+TITLE:\s*(.*)$/i.exec(line.trim());
      if (meta) title = meta[1].trim();
      else if (line.trim() && !/^#\+/.test(line.trim())) {
        unsupported.push({ path: `/line/${index + 1}`, reason: 'text before the first heading has no WeKan field' });
      }
    }
  });
  if (!headings.length) throw new Error('Not an Org outline: no headings');

  const parseHeading = heading => {
    let rest = heading.raw;
    let keyword = null;
    const first = /^(\S+)(?:\s+|$)/.exec(rest);
    if (first && (keywords.todo.includes(first[1]) || keywords.done.includes(first[1]))) {
      keyword = first[1];
      rest = rest.slice(first[0].length);
    }
    let priority = null;
    const prio = PRIORITY.exec(rest);
    if (prio) { priority = prio[1]; rest = rest.slice(prio[0].length); }
    let tags = [];
    const tagMatch = TAGS.exec(rest);
    if (tagMatch) { tags = tagMatch[1].split(':').filter(Boolean); rest = rest.slice(0, tagMatch.index); }
    return { keyword, done: Boolean(keyword && keywords.done.includes(keyword)), priority, tags, title: rest.trim() };
  };

  // A heading's own lines: planning, drawers, then text and checkboxes.
  const readBody = (heading, at) => {
    const dates = {};
    const checkboxes = [];
    const text = [];
    let drawer = null;
    heading.body.forEach(line => {
      const trimmed = line.trim();
      if (drawer) {
        if (/^:END:$/i.test(trimmed)) { drawer = null; return; }
        const property = /^:CREATED:\s*(.*)$/i.exec(trimmed);
        if (drawer === 'PROPERTIES' && property && orgTimestamp(property[1])) dates.created = orgTimestamp(property[1]).iso;
        return;
      }
      const opening = /^:([A-Za-z_-]+):$/.exec(trimmed);
      if (opening) { drawer = opening[1].toUpperCase(); return; }
      if (!text.length && !checkboxes.length && /^(SCHEDULED|DEADLINE|CLOSED):/.test(trimmed)) {
        for (const [, word, stamp] of trimmed.matchAll(/(SCHEDULED|DEADLINE|CLOSED):\s*([<[][^>\]]*[>\]])/g)) {
          const parsed = orgTimestamp(stamp);
          if (!parsed) { unsupported.push({ path: `${at}/${word}`, reason: `Org ${word} is not a date` }); continue; }
          if (parsed.extra) unsupported.push({ path: `${at}/${word}`, reason: `Org repeater or delay ${parsed.extra} is not kept` });
          dates[word.toLowerCase()] = parsed.iso;
        }
        return;
      }
      const box = CHECKBOX.exec(line);
      if (box) { checkboxes.push({ title: box[2].trim(), done: /x/i.test(box[1]) }); return; }
      text.push(line.replace(/^ {0,3}/, ''));
    });
    return { dates, checkboxes, description: text.join('\n').replace(/^\n+|\n+$/g, '') };
  };

  // Build the tree.
  const roots = [];
  const stack = [];
  for (const heading of headings) {
    const node = { ...heading, ...parseHeading(heading), children: [] };
    while (stack.length && stack[stack.length - 1].level >= node.level) stack.pop();
    if (stack.length) stack[stack.length - 1].children.push(node); else roots.push(node);
    stack.push(node);
  }
  const descendants = node => node.children.flatMap(c => [c, ...descendants(c)]);

  const columns = [];
  const tasks = [];
  for (const listNode of roots) {
    const list = listNode.title || 'Imported';
    if (!columns.includes(list)) columns.push(list);
    if (listNode.body.some(line => line.trim() && !/^:[A-Za-z_-]+:$/.test(line.trim()))) {
      unsupported.push({ path: `/line/${listNode.line}`, reason: 'text under a list heading has no WeKan field' });
    }
    for (const cardNode of listNode.children) {
      const at = `/line/${cardNode.line}`;
      const body = readBody(cardNode, at);
      const loose = cardNode.children.filter(c => !c.children.length);
      const checklists = [
        ...(body.checkboxes.length || loose.length ? [{ title: cardNode.title || 'Checklist',
          items: [...body.checkboxes, ...loose.map(c => ({ title: c.title, done: c.done }))] }] : []),
        ...cardNode.children.filter(c => c.children.length).map(c => ({
          title: c.title,
          items: descendants(c).map(d => ({ title: d.title, done: d.done })),
        })),
      ];
      const tags = [
        ...(cardNode.priority ? [`priority:${cardNode.priority}`] : []),
        ...cardNode.tags,
        ...(cardNode.done ? ['done'] : []),
      ];
      tasks.push({
        title: cardNode.title || 'Imported heading',
        description: body.description,
        column_name: list,
        swimlane_name: 'Default',
        tags,
        ...(body.dates.deadline ? { date_due: body.dates.deadline } : {}),
        ...(body.dates.scheduled ? { date_started: body.dates.scheduled } : {}),
        ...(body.dates.closed ? { date_end: body.dates.closed } : {}),
        ...(body.dates.created ? { date_creation: body.dates.created } : {}),
        ...(checklists.length ? { checklists } : {}),
      });
    }
  }
  return {
    board: { name: title || 'Imported Org outline' },
    columns: columns.map(name => ({ title: name })),
    swimlanes: [{ name: 'Default' }],
    tasks,
    warnings: [],
    unsupported,
  };
}

// The same terminal-list heuristic as the other formatters.
const isClosed = listTitle => /done|closed|complete|archiv|finished/i.test(listTitle || '');

// "<2026-10-10 Sat>" or "<2026-10-10 Sat 14:30>"; brackets [] for inactive.
function stamp(value, active = true) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const day = date.toISOString().slice(0, 10);
  const time = date.toISOString().slice(11, 16);
  const inner = `${day} ${DAYS[date.getUTCDay()]}${time === '00:00' ? '' : ` ${time}`}`;
  return active ? `<${inner}>` : `[${inner}]`;
}

// A heading's text must not start a new heading or read as a keyword/tag.
const oneLine = value => String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
const orgTag = value => String(value).trim().replace(/[^\p{L}\p{N}_@#%]+/gu, '_').replace(/^_+|_+$/g, '');

export function formatOrgMode({ board, lists, items }) {
  const out = [`#+TITLE: ${oneLine(board && board.title)}`, '#+TODO: TODO | DONE', ''];
  const listTitles = (lists || []).map(l => l.title);
  for (const item of items || []) if (item.listTitle && !listTitles.includes(item.listTitle)) listTitles.push(item.listTitle);
  for (const listTitle of listTitles) {
    out.push(`* ${oneLine(listTitle) || 'List'}`);
    for (const item of (items || []).filter(i => i.listTitle === listTitle)) {
      const labels = Array.isArray(item.labels) ? item.labels : [];
      const priority = labels.map(name => /^priority:([A-Z0-9])$/.exec(name)).find(Boolean);
      const tags = labels.filter(name => !/^priority:[A-Z0-9]$/.test(name) && name !== 'done').map(orgTag).filter(Boolean);
      const done = isClosed(item.listTitle) || labels.includes('done');
      const title = oneLine(item.title) || 'Untitled';
      out.push(`** ${done ? 'DONE' : 'TODO'} ${priority ? `[#${priority[1]}] ` : ''}${title}${tags.length ? ` :${tags.join(':')}:` : ''}`);
      const planning = [
        item.startAt && `SCHEDULED: ${stamp(item.startAt)}`,
        item.dueAt && `DEADLINE: ${stamp(item.dueAt)}`,
        done && item.endAt && `CLOSED: ${stamp(item.endAt, false)}`,
      ].filter(Boolean);
      if (planning.length) out.push(`   ${planning.join(' ')}`);
      if (item.createdAt) out.push('   :PROPERTIES:', `   :CREATED:  ${stamp(item.createdAt, false)}`, '   :END:');
      if (item.description) {
        // A body line that would read as a heading is indented.
        for (const line of String(item.description).split(/\r\n|\r|\n/)) out.push(line ? `   ${line}` : '');
      }
      for (const checklist of Array.isArray(item.checklists) ? item.checklists : []) {
        const entries = Array.isArray(checklist.items) ? checklist.items : [];
        if (!entries.length) continue;
        out.push(`*** ${oneLine(checklist.title) || 'Checklist'}`);
        for (const entry of entries) out.push(`**** ${entry.done ? 'DONE' : 'TODO'} ${oneLine(entry.title) || 'Item'}`);
      }
    }
  }
  return `${out.join('\n')}\n`;
}
