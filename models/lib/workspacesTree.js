'use strict';

// The workspaces tree of the All Boards left menu: what a drag does to it.
//
// A workspace holds boards, and it holds other workspaces - to any depth. The
// tree is a plain array of `{ id, name, children }` on the user document
// (`profile.boardWorkspacesTree`), so every operation here is "given this tree,
// give me the tree it becomes", with no Meteor, no DOM and no collection.
//
// A drag of one workspace onto another used to mean exactly one thing: put it
// after the target, as a sibling. That is one of the three things a reader can
// mean, and the other two had no way to be said:
//
//   before  - dropped on the TOP edge of a row: becomes its previous sibling
//   after   - dropped on the BOTTOM edge:       becomes its next sibling
//   inside  - dropped on the MIDDLE of a row:   becomes its LAST CHILD, which
//             is how a sub-workspace is made
//
// `dropPosition()` turns a pointer's height within a row into one of those, so
// the rule is one line of arithmetic that can be tested rather than three
// branches in an event handler.
//
// Two moves are refused, and both would corrupt the tree rather than merely
// look odd:
//   * onto itself - nothing to do;
//   * into its own descendant - the subtree would be cut off from the root and
//     become unreachable, taking every workspace under it with it.
//
// Nothing here mutates its input: a move returns a new tree, so a caller can
// compare, discard, or hand it to the server without having already changed
// what is on screen.
//
// Design: docs/Features/Page/Workspaces.md

const BEFORE = 'before';
const AFTER = 'after';
const INSIDE = 'inside';
const POSITIONS = [BEFORE, INSIDE, AFTER];

// How much of a row's height, at each end, means "between the rows" rather than
// "into this one". A quarter each way leaves the middle HALF meaning `inside`,
// which is the gesture that needs the biggest target: reordering can also be
// done by aiming at the neighbouring gap, but nesting has only this one.
const EDGE_FRACTION = 0.25;

// Where in a row the pointer is, as one of the three positions.
//
// `offsetY` is measured from the TOP of the row and `height` is the row's own
// height. A row with no height yet - measured before layout - answers `inside`
// rather than dividing by zero.
function dropPosition(offsetY, height) {
  // `== null` catches both null and undefined BEFORE Number() does: `Number(null)`
  // is 0, which is a perfectly good offset meaning the very top of the row - so
  // a missing offset would have read as a deliberate "before".
  if (height == null || offsetY == null) return INSIDE;
  const h = Number(height);
  if (!Number.isFinite(h) || h <= 0) return INSIDE;
  const y = Number(offsetY);
  if (!Number.isFinite(y)) return INSIDE;
  const edge = h * EDGE_FRACTION;
  if (y < edge) return BEFORE;
  if (y > h - edge) return AFTER;
  return INSIDE;
}

function asNodes(nodes) {
  return Array.isArray(nodes) ? nodes : [];
}

// The node with this id, anywhere in the tree.
function findNode(nodes, id) {
  if (!id) return null;
  for (const node of asNodes(nodes)) {
    if (!node) continue;
    if (node.id === id) return node;
    const deeper = findNode(node.children, id);
    if (deeper) return deeper;
  }
  return null;
}

// Is `id` the node itself, or anywhere below it? This is the guard that keeps a
// subtree attached to the root: dropping a workspace into its own child would
// leave both of them - and everything under them - in a ring that the tree no
// longer reaches.
function isSelfOrDescendant(node, id) {
  if (!node || !id) return false;
  if (node.id === id) return true;
  return asNodes(node.children).some(child => isSelfOrDescendant(child, id));
}

// Every id in the tree, in the order they are drawn. Used by the callers that
// have to forget the state of workspaces that no longer exist.
function collectIds(nodes, out = []) {
  for (const node of asNodes(nodes)) {
    if (!node || !node.id) continue;
    out.push(node.id);
    collectIds(node.children, out);
  }
  return out;
}

function hasChildren(node) {
  return asNodes(node && node.children).length > 0;
}

// Take the node out of the tree it is in, wherever it is. Returns the node, or
// null when the id names nothing; the tree passed in is modified, so callers
// clone first.
function detach(nodes, id) {
  const list = asNodes(nodes);
  for (let i = 0; i < list.length; i += 1) {
    const node = list[i];
    if (!node) continue;
    if (node.id === id) return list.splice(i, 1)[0];
    const removed = detach(node.children, id);
    if (removed) return removed;
  }
  return null;
}

// Put `node` next to `targetId`, on the side `position` names. Returns true
// when the target was found.
function attachBeside(nodes, targetId, node, position) {
  const list = asNodes(nodes);
  for (let i = 0; i < list.length; i += 1) {
    const current = list[i];
    if (!current) continue;
    if (current.id === targetId) {
      list.splice(position === BEFORE ? i : i + 1, 0, node);
      return true;
    }
    if (attachBeside(current.children, targetId, node, position)) return true;
  }
  return false;
}

// Put `node` inside `targetId`, as its LAST child - the end of the list, where a
// thing you have just added is looked for. A target with no `children` yet gets
// one; this is what makes a plain workspace into a parent.
function attachInside(nodes, targetId, node) {
  const target = findNode(nodes, targetId);
  if (!target) return false;
  if (!Array.isArray(target.children)) target.children = [];
  target.children.push(node);
  return true;
}

// The tree after dragging `draggedId` onto `targetId` at `position`, or NULL
// when the move is refused or changes nothing. Null rather than the tree it was
// given, so a caller can tell "nothing to save" from "here is the new tree"
// without comparing two trees.
function moveWorkspace(tree, draggedId, targetId, position) {
  const nodes = asNodes(tree);
  if (!draggedId || !targetId || draggedId === targetId) return null;
  if (!POSITIONS.includes(position)) return null;

  const dragged = findNode(nodes, draggedId);
  const target = findNode(nodes, targetId);
  if (!dragged || !target) return null;
  // Into itself or its own descendant: refused. See isSelfOrDescendant.
  if (isSelfOrDescendant(dragged, targetId)) return null;

  // Deep copy, so the tree on screen is untouched until the caller says so.
  // JSON round-trip rather than a library: these nodes are plain data - ids,
  // names, colours, children - which is exactly what it preserves.
  const next = JSON.parse(JSON.stringify(nodes));
  const moved = detach(next, draggedId);
  if (!moved) return null;

  const placed = position === INSIDE
    ? attachInside(next, targetId, moved)
    : attachBeside(next, targetId, moved, position);
  if (!placed) return null;
  return next;
}

// Would this move change anything? A drop that puts a workspace back exactly
// where it already was is a no-op, and saving it would write the same tree to
// the server and re-render for nothing.
function isNoOpMove(tree, draggedId, targetId, position) {
  const next = moveWorkspace(tree, draggedId, targetId, position);
  if (!next) return true;
  return JSON.stringify(next) === JSON.stringify(asNodes(tree));
}

module.exports = {
  BEFORE,
  AFTER,
  INSIDE,
  POSITIONS,
  EDGE_FRACTION,
  dropPosition,
  findNode,
  isSelfOrDescendant,
  collectIds,
  hasChildren,
  moveWorkspace,
  isNoOpMove,
};
