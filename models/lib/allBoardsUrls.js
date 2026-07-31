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

const ALL_BOARDS_SECTIONS = [
  SECTION_STARRED,
  SECTION_TEMPLATES,
  SECTION_REMAINING,
  SECTION_WORKSPACES,
];
const DEFAULT_SECTION = SECTION_STARRED;

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
  ALL_BOARDS_SECTIONS,
  ALL_BOARDS_BASE,
  DEFAULT_SECTION,
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
