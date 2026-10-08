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
//
// A note on a list, and a link (url / htmlUrl / xmlUrl) have no WeKan field
// and are reported.
import { parseDocument } from 'htmlparser2';

export const MAX_OPML_LENGTH = 16 * 1024 * 1024;
// Deeper outlines than this are flattened into their level 3 checklist anyway,
// so the walk stops rather than recursing as deep as the file nests.
const MAX_OPML_DEPTH = 64;
export const MAX_OPML_NODES = 100000;
const LINKS = ['url', 'htmlUrl', 'xmlUrl'];

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
      children: [],
    };
    for (const name of LINKS) {
      if (attribs[name]) unsupported.push({ path: `${at}/@${name}`, reason: `OPML ${name} has no WeKan field` });
    }
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
  roots.forEach((listNode, li) => {
    if (listNode.note.trim()) unsupported.push({ path: `/outline/${li + 1}/@_note`, reason: 'a list note has no WeKan field' });
    listNode.children.forEach(cardNode => {
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
        description: cardNode.note,
        column_name: listNode.text || 'Imported',
        swimlane_name: 'Default',
        tags: cardNode.done ? ['done'] : [],
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
