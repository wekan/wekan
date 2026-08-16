'use strict';

// The All Boards page's URLs: one per left-menu entry, workspaces included.
//
// The page was three addresses - `/` (Starred), `/templates` and `/remaining` -
// and the workspaces tree had none at all. Which workspace you had open was a
// ReactiveVar, so a workspace could not be linked to a colleague, bookmarked,
// opened in a second tab or reached with the back button.
//
//   /allboards/starred
//   /allboards/templates
//   /allboards/remaining
//   /allboards/workspaces
//   /allboards/workspaces/engineering/backend
//
// A workspace is addressed by the SLUGS OF ITS NAMES along the tree, not by its
// id: the id is a random string, and a URL should say where you are. Names are
// slugified with the same `getSlug` (limax) that board URLs use, which is what
// makes `Renkaan Vaihto` into `renkaan-vaihto` and handles the scripts where a
// naive slugifier returns nothing.
//
// Pure: `slugify` is passed IN rather than imported, so this module has no
// dependencies at all and can be unit-tested with a stub. The client passes
// `getSlug`.

const SECTION_STARRED = 'starred';
const SECTION_TEMPLATES = 'templates';
const SECTION_REMAINING = 'remaining';
const SECTION_WORKSPACES = 'workspaces';
// Boards in Archive is a section of this page, not a page of its own: it is
// selected from the left menu and drawn beside it, so it needs an address in
// the same shape as the other four. docs/Features/Page/Archive.md
const SECTION_ARCHIVE = 'archive';
// The Home board - the one board that opens after login - shown as a section of
// its own so there is a PLACE that says which board that is. It holds exactly
// one board or none. docs/Features/Board/Home.md
const SECTION_HOME = 'home';

const ALL_BOARDS_SECTIONS = [
  SECTION_STARRED,
  SECTION_TEMPLATES,
  SECTION_REMAINING,
  SECTION_WORKSPACES,
  SECTION_ARCHIVE,
  SECTION_HOME,
];
// The section the page opens on, and the order of the first two rows, when the
// address names neither.
//
// Starred is the useful first stop only if anything IS starred; on an account
// with none it is an empty page with a full one behind it. So a user with no
// starred boards opens on Remaining and sees Remaining listed first, and one
// with starred boards opens on Starred and sees Starred listed first - the row
// you land on is the row at the top, either way.
//
// DEFAULT_SECTION stays as the answer when nothing is known about the user: the
// router resolves a bare `/allboards` before any user document has loaded, and
// it must answer something.
const DEFAULT_SECTION = SECTION_STARRED;

// Pure: a boolean in, a section name out. Whether the user has starred anything
// is the caller's to find out - this module has no Meteor and no collections.
function defaultSection(hasStarredBoards) {
  return hasStarredBoards ? SECTION_STARRED : SECTION_REMAINING;
}

// The rows of the left menu, in the order they are shown.
//
// The TOP row is the one the page opens on - Starred when anything is starred,
// Remaining when nothing is (see defaultSection) - and it is the top row
// whether or not a Home board is set. Home does not take the top: after login
// you are already IN the Home board, so the row that names it is a place to
// look, not the place to start.
//
// Home sits under the two board lists, above Templates and the Archive, and it
// is there whether or not there is a board at it - the place to drop a board
// onto has to exist before there is anything in it.
function menuSectionOrder(hasStarredBoards) {
  const boardLists = hasStarredBoards
    ? [SECTION_STARRED, SECTION_REMAINING]
    : [SECTION_REMAINING, SECTION_STARRED];
  return [...boardLists, SECTION_HOME, SECTION_TEMPLATES, SECTION_ARCHIVE];
}

const ALL_BOARDS_BASE = '/allboards';

// What the header bar calls a section: "All Boards / Starred". The page is four
// lists of boards under one name, so "All Boards" alone named the page and not
// the list you were looking at - and every one of them is the same address as
// far as the route name is concerned.
//
// The keys are the LEFT MENU's own, so the title and the menu row that is
// highlighted say the same words. A guard checks them against the menu markup.
const ALL_BOARDS_SECTION_TITLE_KEYS = {
  [SECTION_STARRED]: 'allboards.starred',
  [SECTION_TEMPLATES]: 'allboards.templates',
  [SECTION_REMAINING]: 'allboards.remaining',
  [SECTION_WORKSPACES]: 'allboards.workspaces',
  // "Archive", the same word the menu row shows. The two must agree - the
  // header's path names the section and the highlighted row names it too, and a
  // reader seeing different words for one place has to work out whether they
  // are one place.
  [SECTION_ARCHIVE]: 'archives',
  // "Home", an existing key translated in every language WeKan has, and the
  // same word the menu row shows.
  [SECTION_HOME]: 'home',
};

function sectionTitleKey(section) {
  const resolved = resolveSection(section);
  return ALL_BOARDS_SECTION_TITLE_KEYS[resolved] || '';
}

// null when it is not a section, so a caller can tell "not a section" from "the
// default section".
function normalizeSection(section) {
  return ALL_BOARDS_SECTIONS.includes(section) ? section : null;
}

function resolveSection(section) {
  return normalizeSection(section) || DEFAULT_SECTION;
}

// A workspace node's own slug. Falls back to the node id when the name
// slugifies to nothing - an emoji-only name, say - so a workspace always has an
// address even when its name cannot make one.
function workspaceSlug(node, slugify) {
  if (!node) return '';
  const fromName = typeof slugify === 'function' ? slugify(node.name || '') : '';
  return fromName || String(node.id || '');
}

// The slugs from the root of the tree down to `workspaceId`, or null when the
// workspace is not in the tree.
function workspaceSlugPath(nodes, workspaceId, slugify, trail = []) {
  if (!Array.isArray(nodes) || !workspaceId) return null;
  for (const node of nodes) {
    if (!node) continue;
    const here = [...trail, workspaceSlug(node, slugify)];
    if (node.id === workspaceId) return here;
    const deeper = workspaceSlugPath(node.children, workspaceId, slugify, here);
    if (deeper) return deeper;
  }
  return null;
}

// The workspace a slug path names, or null. Matching is by slug at each level,
// so two sibling workspaces whose names slugify the same are ambiguous - the
// FIRST is taken, which is the same rule a duplicate board slug follows.
function workspaceIdForSlugPath(nodes, segments, slugify) {
  if (!Array.isArray(segments) || !segments.length) return null;
  let level = Array.isArray(nodes) ? nodes : [];
  let found = null;
  for (const segment of segments) {
    found = level.find(node => node && workspaceSlug(node, slugify) === segment) || null;
    if (!found) return null;
    level = Array.isArray(found.children) ? found.children : [];
  }
  return found ? found.id : null;
}

// The NAMES of the workspaces a slug path walks through, for the title bar:
// "All Boards / Workspaces / Engineering / Backend". The URL carries slugs,
// which are lowercase and hyphenated and are not what the workspace is called.
//
// Stops at the first segment that names nothing and returns what it walked so
// far, so a stale link titles the part of the trail that is still real rather
// than nothing at all. A node whose name is empty falls back to its slug, for
// the same reason workspaceSlug() falls back to the id: a workspace always has
// something to show.
function workspaceNamePath(nodes, segments, slugify) {
  if (!Array.isArray(segments)) return [];
  const names = [];
  let level = Array.isArray(nodes) ? nodes : [];
  for (const segment of segments) {
    const found = level.find(node => node && workspaceSlug(node, slugify) === segment);
    if (!found) break;
    names.push(found.name || segment);
    level = Array.isArray(found.children) ? found.children : [];
  }
  return names;
}

// Split the wildcard part of the URL into slugs. A trailing slash, a double
// slash or an empty tail must not become an empty segment that matches nothing.
function splitWorkspacePath(pathPart) {
  if (typeof pathPart !== 'string') return [];
  return pathPart.split('/').filter(Boolean);
}

// The URL of a section, and of a workspace within it.
function allBoardsPath(section, slugPath) {
  const resolved = resolveSection(section);
  const segments = Array.isArray(slugPath) ? slugPath.filter(Boolean) : [];
  if (resolved !== SECTION_WORKSPACES || !segments.length) {
    return `${ALL_BOARDS_BASE}/${resolved}`;
  }
  return `${ALL_BOARDS_BASE}/${SECTION_WORKSPACES}/${segments.join('/')}`;
}

// The URL of whatever the left menu has selected. The menu stores either a
// section name or a workspace id in one variable, which is why this takes one
// value and works out which it is.
function allBoardsPathForMenu(menuValue, tree, slugify) {
  if (normalizeSection(menuValue)) return allBoardsPath(menuValue, []);
  const slugPath = workspaceSlugPath(tree, menuValue, slugify);
  return slugPath
    ? allBoardsPath(SECTION_WORKSPACES, slugPath)
    : allBoardsPath(DEFAULT_SECTION, []);
}

module.exports = {
  SECTION_STARRED,
  SECTION_TEMPLATES,
  SECTION_REMAINING,
  SECTION_WORKSPACES,
  SECTION_ARCHIVE,
  SECTION_HOME,
  ALL_BOARDS_SECTIONS,
  ALL_BOARDS_BASE,
  DEFAULT_SECTION,
  defaultSection,
  menuSectionOrder,
  normalizeSection,
  resolveSection,
  ALL_BOARDS_SECTION_TITLE_KEYS,
  sectionTitleKey,
  workspaceSlug,
  workspaceSlugPath,
  workspaceNamePath,
  workspaceIdForSlugPath,
  splitWorkspacePath,
  allBoardsPath,
  allBoardsPathForMenu,
};
