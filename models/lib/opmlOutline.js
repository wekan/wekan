// OPML outlines (http://opml.org/spec2.opml): what Workflowy, Dynalist,
// OmniOutliner, Logseq and most other outliners export and import. The import
// side; opmlOutlineFormat.js is the export. Pure - no Meteor import - so
// tests/opmlOutline.test.cjs runs the round trip in plain Node. Server-only
// (server/lib/opmlImport.js loads it), so the XML parser never reaches the
// client bundle.
//
// An OPML file is <opml><head><title>...</title></head><body> with nested
// <outline text="..."> elements. Outliners add their own attributes: the
// note under an item is `_note` (Workflowy, Dynalist, Logseq), and a finished
// item is `_complete="true"` (Workflowy) or `complete="true"` (Dynalist).
//
//   level 1 outline         -> list
//   level 2 outline         -> card (text = title, _note = description,
//                              complete = the `done` tag the markdown and Leo
//                              imports use)
//   level 3 outline         -> checklist, its descendants the items (complete
//                              = finished); a level 3 outline with no children
//                              is an item of a checklist named after the card
//   head/title              -> board title
// and, on a card (OPML 2.0 and the outliners' own):
//   created                 -> creation date (an RFC 822 date)
//   category                -> labels, one per comma-separated category, its
//                              leading "/" taken off
//   url / htmlUrl / xmlUrl  -> a link line at the end of the description
//   any other attribute     -> a custom field of that name (OmniOutliner
//                              writes its columns this way)
//
// A note on a list, and an attribute of a list or a checklist item other than
// text and complete, have no WeKan field and are reported. type, isComment and
// isBreakpoint are how an outliner draws a row, not data.
import { parseDocument } from 'htmlparser2';

export const MAX_OPML_LENGTH = 16 * 1024 * 1024;
// Deeper outlines than this are flattened into their level 3 checklist anyway,
// so the walk stops rather than recursing as deep as the file nests.
const MAX_OPML_DEPTH = 64;
export const MAX_OPML_NODES = 100000;
const LINKS = ['url', 'htmlUrl', 'xmlUrl'];
// Read into a node's own fields, or only how an outliner draws it.
const READ = new Set(['text', 'title', '_note', '_complete', 'complete', 'created', 'category', ...LINKS]);
const DRAWING = new Set(['type', 'isComment', 'isBreakpoint']);

const elements = node => (node && node.children ? node.children.filter(c => c.type === 'tag') : []);
const child = (node, name) => elements(node).find(c => c.name === name);
const textOf = node => (node && node.children ? node.children.map(c =>
  (c.type === 'text' || c.type === 'cdata' ? (c.data != null ? c.data : textOf(c)) : '')).join('') : '');

function findTag(root, name) {
  const stack = [...elements(root)];
  while (stack.length) {
    const node = stack.shift();
    if (node.name === name) return node;
    stack.unshift(...elements(node));
  }
  return null;
}

const isComplete = attribs => ['_complete', 'complete'].some(name => String(attribs[name] || '').toLowerCase() === 'true');

export function parseOpml(text) {
  const source = String(text == null ? '' : text);
  if (source.length > MAX_OPML_LENGTH) throw new Error('OPML outline is too large');
  // xmlMode: no HTML entity table, no implied tags. htmlparser2 does not
  // resolve DTDs or external entities, so a <!DOCTYPE> or <!ENTITY> in the
  // upload is inert text, never a file or network read.
  const doc = parseDocument(source, { xmlMode: true, decodeEntities: true });
  const opml = findTag(doc, 'opml');
  const body = opml && child(opml, 'body');
  if (!body) throw new Error('Not an OPML outline: no <opml><body>');

  const unsupported = [];
  let count = 0;
  const read = (outline, depth, at) => {
    count += 1;
    if (count > MAX_OPML_NODES) throw new Error('OPML outline has too many items');
    const attribs = outline.attribs || {};
    const node = {
      text: String(attribs.text != null ? attribs.text : attribs.title || '').trim(),
      note: String(attribs._note || ''),
      done: isComplete(attribs),
      attribs,
      at,
      children: [],
    };
    const kids = elements(outline).filter(c => c.name === 'outline');
    if (depth >= MAX_OPML_DEPTH) {
      if (kids.length) unsupported.push({ path: at, reason: `outline deeper than ${MAX_OPML_DEPTH} levels` });
      return node;
    }
    node.children = kids.map((k, i) => read(k, depth + 1, `${at}/${i + 1}`));
    return node;
  };
  const roots = elements(body).filter(o => o.name === 'outline').map((o, i) => read(o, 1, `/outline/${i + 1}`));

  const descendants = node => node.children.flatMap(c => [c, ...descendants(c)]);
  const tasks = [];
  // What is left of an outline that is not a card: reported.
  const reportRest = (node, kept) => {
    for (const name of Object.keys(node.attribs)) {
      if (kept.has(name) || DRAWING.has(name) || !String(node.attribs[name]).trim()) continue;
      unsupported.push({ path: `${node.at}/@${name}`, reason: `OPML ${name} of "${node.text}" has no WeKan field` });
    }
  };
  roots.forEach((listNode, li) => {
    if (listNode.note.trim()) unsupported.push({ path: `/outline/${li + 1}/@_note`, reason: 'a list note has no WeKan field' });
    reportRest(listNode, new Set(['text', 'title', '_note']));
    listNode.children.forEach(cardNode => {
      descendants(cardNode).forEach(item => reportRest(item, new Set(['text', 'title', '_complete', 'complete'])));
      const attribs = cardNode.attribs;
      const created = attribs.created ? new Date(String(attribs.created)) : null;
      if (attribs.created && Number.isNaN(created.getTime())) {
        unsupported.push({ path: `${cardNode.at}/@created`, reason: `OPML created "${attribs.created}" is not a date` });
      }
      const categories = String(attribs.category || '').split(',')
        .map(name => name.trim().replace(/^\/+/, '').trim()).filter(Boolean);
      const links = LINKS.map(name => String(attribs[name] || '').trim()).filter(Boolean);
      const custom = Object.fromEntries(Object.entries(attribs)
        .filter(([name, value]) => !READ.has(name) && !DRAWING.has(name) && String(value).trim())
        .map(([name, value]) => [name.replace(/^_/, ''), String(value).trim()]));
      const loose = cardNode.children.filter(c => !c.children.length);
      const checklists = [
        ...(loose.length ? [{ title: cardNode.text || 'Checklist', items: loose.map(c => ({ title: c.text, done: c.done })) }] : []),
        ...cardNode.children.filter(c => c.children.length).map(c => ({
          title: c.text,
          items: descendants(c).map(d => ({ title: d.text, done: d.done })),
        })),
      ];
      tasks.push({
        title: cardNode.text || 'Imported item',
        description: [cardNode.note, ...links.filter(link => !cardNode.note.includes(link))].filter(Boolean).join('\n\n'),
        column_name: listNode.text || 'Imported',
        swimlane_name: 'Default',
        tags: [...new Set([...(cardNode.done ? ['done'] : []), ...categories])],
        ...(created && !Number.isNaN(created.getTime()) ? { date_creation: created.toISOString() } : {}),
        ...(Object.keys(custom).length ? { custom_fields: custom } : {}),
        ...(checklists.length ? { checklists } : {}),
      });
    });
  });

  const head = child(opml, 'head');
  const title = head && textOf(child(head, 'title')).trim();
  return {
    board: { name: title || 'Imported OPML outline' },
    columns: roots.map(r => ({ title: r.text || 'Imported' })),
    swimlanes: [{ name: 'Default' }],
    tasks,
    warnings: [],
    unsupported,
  };
}
