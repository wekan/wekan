// The Leo literate editor's .leo outline:
// the import side; leoOutlineFormat.js is the export. Pure - no Meteor import -
// so tests/leoOutline.test.cjs runs the round trip in plain Node, the way
// markdownKanbanFormat.js does. Server-only (server/lib/leoImport.js loads it),
// so the XML parser never reaches the client bundle.
//
// A .leo file is XML: the outline is nested <v t="gnx"><vh>headline</vh>...</v>
// nodes under <vnodes>, and each node's body text is a <t tx="gnx"> under
// <tnodes>, joined by the gnx. A node marked in Leo carries `a="M"`. A clone is
// the same gnx appearing again; Leo writes its children only the first time.
//
//   level 1 node            -> list
//   level 2 node            -> card (headline = title, body = description,
//                              marked = the `done` tag the markdown import uses)
//   level 3 node            -> checklist, its descendants' headlines the items
//                              (marked = finished); a level 3 node with no
//                              children is an item of a checklist named after
//                              the card
//
// A .leo file has no board title of its own, so the export writes the board as
// the lists at the top level and the import names the board from the file's
// <leo_header> `wekan_board` attribute when present (the export writes it; Leo
// ignores attributes it does not know).
import { parseDocument } from 'htmlparser2';

// The XML arrives as one DDP argument; well past any real outline, and far
// below the size at which building a DOM of it would hurt the server.
export const MAX_LEO_LENGTH = 16 * 1024 * 1024;
// Deeper nodes than this are flattened into their level 3 checklist anyway,
// so the walk stops rather than recursing as deep as the file nests.
const MAX_LEO_DEPTH = 64;
// Clones are expanded, so a small crafted file can describe an exponentially
// large tree; the expansion stops at this many nodes.
export const MAX_LEO_NODES = 100000;

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

export function parseLeo(text) {
  const source = String(text == null ? '' : text);
  if (source.length > MAX_LEO_LENGTH) throw new Error('Leo outline is too large');
  // xmlMode: no HTML entity table, no implied tags. htmlparser2 does not
  // resolve DTDs or external entities, so a <!DOCTYPE> or <!ENTITY> in the
  // upload is inert text, never a file or network read.
  const doc = parseDocument(source, { xmlMode: true, decodeEntities: true });
  const leoFile = findTag(doc, 'leo_file');
  const vnodes = leoFile && child(leoFile, 'vnodes');
  if (!vnodes) throw new Error('Not a Leo outline: no <leo_file><vnodes>');

  const bodies = new Map();
  elements(child(leoFile, 'tnodes')).filter(t => t.name === 't')
    .forEach(t => bodies.set(t.attribs.tx, textOf(t)));
  // Clones: the first occurrence of a gnx carries its children.
  const childrenOf = new Map();
  const headlines = new Map();
  const unsupported = [];

  let count = 0;
  const read = (v, depth, ancestors) => {
    count += 1;
    if (count > MAX_LEO_NODES) throw new Error('Leo outline has too many nodes');
    const gnx = v.attribs.t || '';
    let kids = elements(v).filter(c => c.name === 'v');
    if (kids.length && gnx && !childrenOf.has(gnx)) childrenOf.set(gnx, kids);
    // A clone of its own ancestor would loop; Leo forbids it, a crafted file may not.
    if (!kids.length && gnx && childrenOf.has(gnx) && !ancestors.has(gnx)) kids = childrenOf.get(gnx);
    // ...and its headline and mark: a later <v t="gnx"/> may carry neither.
    const vh = child(v, 'vh');
    if (vh && gnx && !headlines.has(gnx)) headlines.set(gnx, { headline: textOf(vh).trim(), marked: /M/.test(v.attribs.a || '') });
    const first = !vh && headlines.get(gnx);
    const node = {
      headline: first ? first.headline : textOf(vh).trim(),
      body: bodies.get(gnx) || '',
      marked: first ? first.marked : /M/.test(v.attribs.a || ''),
      children: [],
    };
    if (depth >= MAX_LEO_DEPTH) {
      if (kids.length) unsupported.push({ path: gnx, reason: `outline deeper than ${MAX_LEO_DEPTH} levels` });
      return node;
    }
    const inside = new Set(ancestors).add(gnx);
    node.children = kids.map(k => read(k, depth + 1, inside));
    return node;
  };
  const roots = elements(vnodes).filter(v => v.name === 'v').map(v => read(v, 1, new Set()));

  const descendants = node => node.children.flatMap(c => [c, ...descendants(c)]);
  const tasks = [];
  roots.forEach(listNode => {
    if (listNode.body.trim()) unsupported.push({ path: listNode.headline, reason: 'list body text has no WeKan field' });
    listNode.children.forEach(cardNode => {
      const loose = cardNode.children.filter(c => !c.children.length);
      const checklists = [
        ...(loose.length ? [{ title: cardNode.headline, items: loose.map(c => ({ title: c.headline, done: c.marked })) }] : []),
        ...cardNode.children.filter(c => c.children.length).map(c => ({
          title: c.headline,
          items: descendants(c).map(d => ({ title: d.headline, done: d.marked })),
        })),
      ];
      tasks.push({
        title: cardNode.headline || 'Imported node',
        description: cardNode.body,
        column_name: listNode.headline || 'Imported',
        swimlane_name: 'Default',
        tags: cardNode.marked ? ['done'] : [],
        ...(checklists.length ? { checklists } : {}),
      });
    });
  });

  const header = child(leoFile, 'leo_header');
  return {
    board: { name: (header && header.attribs.wekan_board) || 'Imported Leo outline' },
    columns: roots.map(r => ({ title: r.headline || 'Imported' })),
    swimlanes: [{ name: 'Default' }],
    tasks,
    warnings: [],
    unsupported,
  };
}
