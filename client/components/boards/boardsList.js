import { ReactiveCache } from '/imports/reactiveCache';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';
const { notHelperBoardTitle } = require('/models/lib/helperBoards');
import { TAPi18n } from '/imports/i18n';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import getSlug from 'limax';
// The archived-at line on a tile in the Archive, in the reader's own format.
import { formatDateByUserPreference } from '/imports/lib/dateUtils';
// The All Boards URLs, and the slug path of a workspace in the tree.
// docs/Features/Page/All-Boards-URLs.md
import {
  ALL_BOARDS_SECTIONS,
  defaultSection,
  menuSectionOrder,
  workspaceIdForSlugPath,
  allBoardsPathForMenu,
  sectionTitleKey,
  SECTION_ARCHIVE,
  SECTION_REMAINING,
  SECTION_WORKSPACES,
} from '/models/lib/allBoardsUrls';
import TableVisibilityModeSettings from '/models/tableVisibilityModeSettings';
import { BoardMultiSelection } from '/client/lib/boardMultiSelection';
import {
  buildHeader,
  pageInfo,
  TABLE_PAGE_ROWS_PER_PAGE,
} from '/models/lib/tablePage';
import {
  allBoardsSearchVar,
  allBoardsMenuVar,
  allBoardsView,
  setAllBoardsView,
  isAllBoardsView,
} from '/client/lib/allBoardsView';
import { EscapeActions } from '/client/lib/escapeActions';
import { Blaze } from 'meteor/blaze';
import { Utils } from '/client/lib/utils';
import '/client/lib/dragDropTouch'; // touch -> HTML5 DnD so board icons drag by finger
// What a drag does to the workspaces tree - move before, after, or INTO another
// workspace - as pure functions, so the rules are testable without a browser.
// docs/Features/Page/Workspaces.md
const {
  BEFORE: DROP_BEFORE,
  AFTER: DROP_AFTER,
  INSIDE: DROP_INSIDE,
  dropPosition,
  hasChildren,
  moveWorkspace,
  isNoOpMove,
} = require('/models/lib/workspacesTree');
import {
  isDragReorderEnabled,
  computeSortIndexMapping,
} from '/models/lib/boardSortReorder';
// The sidebar the Search and Multi-Selection controls open. Its state is module
// scope, not a template instance: this bar and the sidebar are separate Blaze
// instances. docs/Features/Page/Search.md, docs/Features/Page/Multi-Selection.md
import {
  openAllBoardsSidebar,
  closeAllBoardsSidebar,
  toggleAllBoardsSidebar,
  isAllBoardsSidebarOpen,
} from '/client/lib/allBoardsSidebar';
import {
  SIDEBAR_SEARCH,
  SIDEBAR_MULTISELECTION,
} from '/models/lib/allBoardsSidebar';

// SubsManager removed for Meteor 3 migration

// #5850: which sharing scopes (organizations/teams/domains) the admin enabled
// in Admin Panel > People > Shared Templates (stored in localStorage, like the
// Shared Templates admin UI). Used to gate the drag-to-share drop targets.
function loadSharedTemplatesScopes() {
  try {
    const raw = window.localStorage.getItem('sharedTemplatesScopes');
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

// #5850: share a (template) board with an Organization / Team / Domain by adding
// it to the board's groups, add-only (does not remove existing shares and does
// not add individual members). Called when a board is dropped on a share target.
function shareBoardWith(boardId, shareType, name, id) {
  const board = ReactiveCache.getBoard(boardId);
  if (!board || !boardId) {
    return;
  }
  if (shareType === 'org') {
    const orgs = (board.orgs || []).slice();
    if (!orgs.some(o => o.orgId === id)) {
      orgs.push({ orgId: id, orgDisplayName: name, isActive: true });
      Meteor.call('setBoardOrgs', orgs, boardId);
    }
  } else if (shareType === 'team') {
    const teams = (board.teams || []).slice();
    if (!teams.some(t => t.teamId === id)) {
      teams.push({ teamId: id, teamDisplayName: name, isActive: true });
      // Preserve the board's current members (group-only sharing adds no
      // individual members); setBoardTeams sets both members and teams.
      Meteor.call('setBoardTeams', teams, board.members || [], boardId);
    }
  } else if (shareType === 'domain') {
    const domains = (board.domains || []).slice();
    if (!domains.some(d => d.domain === id)) {
      domains.push({ domain: id, isActive: true });
      Meteor.call('setBoardDomains', domains, boardId);
    }
  }
}

// No emoji default: a workspace with no icon of its own renders the Font
// Awesome folder from boardsList.jade (`else` branch of `if icon`).
const DEFAULT_WORKSPACE_ICON = '';

// #5799: how many board icons to show per page in the sorted (non-custom) modes.
// Matches the Admin Panel > People page size.
const BOARDS_PER_PAGE = 25;

// #6439: the effective All Boards sort mode for the current user, defaulting to
// 'custom' (manual drag order) when unknown. Used to gate board drag-reordering.
function currentAllBoardsSortBy() {
  const cu = ReactiveCache.getCurrentUser();
  return cu && typeof cu.getAllBoardsSortBy === 'function'
    ? cu.getAllBoardsSortBy()
    : 'custom';
}

function getCurrentWorkspacesTree() {
  const currentUser = ReactiveCache.getCurrentUser();
  const tree =
    (currentUser &&
      currentUser.profile &&
      currentUser.profile.boardWorkspacesTree) ||
    [];
  return EJSON.clone(tree);
}

function findSpace(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findSpace(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

function updateSpaceInTree(nodes, id, updates) {
  return nodes.map((node) => {
    if (node.id === id) {
      return { ...node, ...updates };
    }
    if (node.children) {
      return {
        ...node,
        children: updateSpaceInTree(node.children, id, updates),
      };
    }
    return node;
  });
}
function addSubworkspace(parentId, name) {
  if (name && name.trim()) {
    Meteor.call(
      'createWorkspace',
      { parentId, name: name.trim() },
      (err) => {
        if (err) console.error(err);
      },
    );
  }
}

function saveWorkspace(workspaceId, { name, icon }) {
  if (!workspaceId || !name || !name.trim()) return;
  const tree = getCurrentWorkspacesTree();
  const updatedTree = updateSpaceInTree(tree, workspaceId, {
    name: name.trim(),
    icon: icon || DEFAULT_WORKSPACE_ICON,
  });
  Meteor.call('setWorkspacesTree', updatedTree, (err) => {
    if (err) console.error(err);
  });
}

// The count for one of the three board-list rows. A plain function as well as
// a helper, because `sectionCount` needs it and a Blaze helper cannot call a
// sibling helper - `this` there is the data context.
// Does this user have any starred boards? Both the section the page opens on
// and the order of the first two rows turn on it: Starred is the useful first
// stop only if anything IS starred, and on an account with none it is an empty
// page with a full one behind it.
function hasStarredBoards() {
  const user = ReactiveCache.getCurrentUser();
  // `profile.starredBoards`, not `user.starredBoards()`: the method runs a
  // Boards query, so its answer depends on the boards subscription and flips
  // from "none" to "some" partway through a cold load - which would draw
  // Remaining and then visibly jump to Starred. The profile field is part of
  // the user document itself and arrives in one piece with it.
  const starred = (user && user.profile && user.profile.starredBoards) || [];
  return starred.length > 0;
}

// The Home board's id, or null. `profile.defaultBoardId` - the field the Home
// board has always been stored in (#2220), which is what "opened after login"
// reads on its way past. Home is a VIEW of that one field, not a second copy of
// it, so setting a Home board from the menu and setting it from Multi-Selection
// cannot disagree. docs/Features/Board/Home.md
function homeBoardId() {
  const user = ReactiveCache.getCurrentUser();
  return (user && user.profile && user.profile.defaultBoardId) || null;
}

// A board picked up in the HOME section is marked as such on the drag itself.
//
// The mark is the PRESENCE OF A TYPE rather than a value, because it has to be
// readable in `dragover`, and `dragover` cannot call `getData()` - the drag
// data store is in protected mode until the drop, and only the list of types is
// exposed. So the fact lives in the type's NAME: if the drag carries
// `application/x-board-from-home`, it came from Home.
//
// dragover is where it matters. Dragging a board out of Home may only end at
// the Trash - the one gesture that takes it off Home - so every other target
// has to REFUSE the drop while it is still in the air, which means answering
// before the drop happens. docs/Features/Board/Home.md
const DRAG_FROM_HOME = 'application/x-board-from-home';
const DRAG_FROM_REMAINING = 'application/x-board-from-remaining';
const DRAG_FROM_WORKSPACE = 'application/x-board-from-workspace';
const ARCHIVED_MULTI_BOARD_DRAG = 'application/x-archived-board-multi';

// Reordering a bookmark carries its own type, so a bookmark and a board cannot
// be dropped on each other. Readable in `dragover` for the same reason
// DRAG_FROM_HOME is - a target has to decide whether to accept the drop before
// the drop happens. docs/Features/Board/Starred.md
const BOOKMARK_DRAG = 'application/x-wekan-bookmark';

function isBookmarkDrag(evt) {
  try {
    const types = evt.originalEvent.dataTransfer.types;
    if (!types) return false;
    return Array.prototype.indexOf.call(types, BOOKMARK_DRAG) !== -1;
  } catch (e) {
    return false;
  }
}

// Is a board from Home in the air right now? The remove target is drawn only
// while it is - the Android launcher's Remove bar, which appears at the top of
// the screen when you pick an icon up and is not there the rest of the time.
// An affordance that is only there when the gesture is possible explains
// itself; one that is always there is a button nobody dares press.
const draggingFromHome = new ReactiveVar(false);

function markDragFromHome(evt, section) {
  if (section !== 'home') return;
  try {
    evt.originalEvent.dataTransfer.setData(DRAG_FROM_HOME, '1');
  } catch (e) {}
  draggingFromHome.set(true);
}

// True while a board that was picked up in Home is being dragged. Works in
// dragover and in drop alike: `types` is readable throughout.
function isDragFromHome(evt) {
  try {
    const types = evt.originalEvent.dataTransfer.types;
    if (!types) return false;
    // A DOMStringList in older engines, an array in current ones.
    return Array.prototype.indexOf.call(types, DRAG_FROM_HOME) !== -1;
  } catch (e) {
    return false;
  }
}

function isArchivedMultiBoardDrag(evt) {
  try {
    const types = evt.originalEvent.dataTransfer.types;
    if (!types) return false;
    return Array.prototype.indexOf.call(types, ARCHIVED_MULTI_BOARD_DRAG) !== -1;
  } catch (e) {
    return false;
  }
}

function isDragFromRemaining(evt) {
  try {
    const types = evt.originalEvent.dataTransfer.types;
    if (!types) return false;
    return Array.prototype.indexOf.call(types, DRAG_FROM_REMAINING) !== -1;
  } catch (e) {
    return false;
  }
}

function isDragFromWorkspace(evt) {
  try {
    const types = evt.originalEvent.dataTransfer.types;
    if (!types) return false;
    return Array.prototype.indexOf.call(types, DRAG_FROM_WORKSPACE) !== -1;
  } catch (e) {
    return false;
  }
}

function isDragFromRemainingOrWorkspace(evt) {
  return isDragFromRemaining(evt) || isDragFromWorkspace(evt);
}

function menuItemCountOf(type) {
  const currentUser = ReactiveCache.getCurrentUser();
  const assignments =
    (currentUser &&
      currentUser.profile &&
      currentUser.profile.boardWorkspaceAssignments) ||
    {};

  // Get all boards for counting
  let query = {
    $and: [
      { archived: false },
      { type: { $in: ['board', 'template-container'] } },
      { $or: [{ 'members.userId': Meteor.userId() }] },
      { title: notHelperBoardTitle() },
    ],
  };
  const allBoards = ReactiveCache.getBoards(query, {});

  if (type === 'starred') {
    return allBoards.filter(
      (b) => currentUser && currentUser.hasStarred(b._id),
    ).length;
  } else if (type === 'templates') {
    return allBoards.filter((b) => b.type === 'template-container').length;
  } else if (type === 'remaining') {
    // Count boards not in any workspace AND not templates
    // Include starred boards (they appear in both Starred and Remaining)
    return allBoards.filter(
      (b) => !assignments[b._id] && b.type !== 'template-container',
    ).length;
  } else if (type === 'home') {
    // 0 or 1, and 1 only if the board is still there to open: a Home board that
    // was deleted or archived leaves the id behind, and a row that counts 1 with
    // nothing under it is a row that looks broken.
    const id = homeBoardId();
    return id && allBoards.some((b) => b._id === id) ? 1 : 0;
  }
  return 0;
}

Template.boardList.helpers({
  BoardMultiSelection() {
    return BoardMultiSelection;
  },
  // Whether to move the boards left, out from under the right sidebar. The
  // sidebar is a separate Blaze instance, so the state is module scope - the
  // page cannot read a ReactiveVar on it. docs/Features/Page/Search.md
  isSidebarOpen() {
    return isAllBoardsSidebarOpen();
  },
  // Which view is on. Registered on THIS template as well as on the header bar
  // and the popup: a Blaze helper belongs to one template, and `boardList` is
  // the one that chooses between the board icons and the Table with it - it
  // threw "No such function: isAllBoardsView" the moment the page rendered.
  isAllBoardsView(view) {
    return isAllBoardsView(view);
  },
});

// The All Boards controls' handlers. One events map for this template, not two:
// Blaze allows several, but then "where is the search handler" has two answers.
//
// Search and Multi-Selection are drawn by the SHARED templates in
// headerBarControls.jade, which carry no handlers of their own: a Blaze event
// map catches events from the templates rendered inside it, so these fire for
// this bar's copy and the board header's map fires for its own. That is what
// lets one piece of markup mean "search cards" on a board and "search boards"
// here. docs/Features/Page/Search.md, docs/Features/Page/Multi-Selection.md
// Sort and the view menu, which were buttons in this page's second header bar
// and are rows of the sidebar's home view now. A Blaze event map only sees
// events inside its OWN template, so they had to move with their markup.
// docs/Features/Page/All-Boards.md
Template.allBoardsHomeSidebar.events({
  // Titled "Sort Boards", from the key the app already has for that phrase -
  // the same reasoning as the starred-boards popup: a `boardsSortPopup-title`
  // of its own would be a second copy of one phrase in all 147 language files,
  // English in every one of them at first. A title also gives the popup its
  // header, and with it the close button; without one it renders as a
  // `no-title` pop-over with nothing to shut it but clicking away.
  'click .js-open-boards-sort': Popup.open('boardsSort', { titleKey: 'sort-boards' }),
});

Template.allBoardsHomeSidebar.helpers({
  isBoardsSort(mode) {
    const currentUser = ReactiveCache.getCurrentUser();
    const sortBy =
      currentUser && typeof currentUser.getAllBoardsSortBy === 'function'
        ? currentUser.getAllBoardsSortBy()
        : 'custom';
    return sortBy === mode;
  },
  isAllBoardsView(view) {
    return isAllBoardsView(view);
  },
});

// The page's four controls, in the FIRST top header bar. They were rows of the
// sidebar's home view, which meant opening a panel over the boards to reach the
// thing you came for - and that home view was the only reason All Boards had a
// hamburger at all.
//
// A Blaze event map only sees events inside its OWN template, so these are
// their own map rather than shared with the sidebar's: the same
// `js-all-boards-sidebar-search` markup exists in both places and each map
// fires for its own copy. docs/Features/Page/All-Boards.md
Template.allBoardsHeaderButtons.helpers({
  // Every template registers the helpers IT uses. `BoardMultiSelection` is also
  // a helper of boardList, but a Blaze template cannot see a sibling's helpers -
  // and the failure is a hard "No such function" at render, which is how
  // `isAllBoardsView` broke this page once before.
  BoardMultiSelection() {
    return BoardMultiSelection;
  },
  isBoardsSort(mode) {
    const currentUser = ReactiveCache.getCurrentUser();
    const sortBy =
      currentUser && typeof currentUser.getAllBoardsSortBy === 'function'
        ? currentUser.getAllBoardsSortBy()
        : 'custom';
    return sortBy === mode;
  },
  // Multi-Selection archives and duplicates boards, so somebody who may only
  // comment is not offered it.
  canMultiSelectBoards() {
    const currentUser = ReactiveCache.getCurrentUser();
    return currentUser && !currentUser.isCommentOnly();
  },
});

Template.allBoardsHeaderButtons.events({
  // Titled "Sort Boards", from the key the app already has for that phrase -
  // the same reasoning as the starred-boards popup: a `boardsSortPopup-title`
  // of its own would be a second copy of one phrase in all 147 language files,
  // English in every one of them at first. A title also gives the popup its
  // header, and with it the close button; without one it renders as a
  // `no-title` pop-over with nothing to shut it but clicking away.
  'click .js-open-boards-sort': Popup.open('boardsSort', { titleKey: 'sort-boards' }),
  // Search and Multi-Selection still open the sidebar - straight into their own
  // view, rather than into a home view that only listed them.
  'click .js-all-boards-sidebar-search'(evt) {
    evt.preventDefault();
    openAllBoardsSidebar(SIDEBAR_SEARCH);
  },
  'click .js-all-boards-sidebar-multiselection'(evt) {
    evt.preventDefault();
    BoardMultiSelection.activate();
    openAllBoardsSidebar(SIDEBAR_MULTISELECTION);
  },
  // The way OFF, beside the button that turned it on - the same pair the
  // board's own Multi-Selection has. `stopPropagation` because this X sits
  // inside the bar, and a click that also reached the button beside it would
  // turn multi-selection straight back on.
  'click .js-multiselection-reset'(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    BoardMultiSelection.disable();
    closeAllBoardsSidebar();
  },
});

Template.boardList.events({});

// Put the selected menu entry in the address bar. A section is its own name; a
// workspace is the slugs of its names down the tree, so the URL says where you
// are rather than carrying a random id. `go`, not `replace`, so Back returns to
// the previous entry. docs/Features/Page/All-Boards-URLs.md
function goToAllBoards(tpl, menuValue) {
  const path = allBoardsPathForMenu(menuValue, tpl.workspacesTreeVar.get(), getSlug);
  if (path && FlowRouter.current().path !== path) FlowRouter.go(path);
}

// The boards the page shows: the selected section, filtered by the search
// field, sorted and paged. Extracted from the `boards` helper so the Table
// view draws the SAME set - two copies of this would be two answers to
// "which boards am I looking at". docs/Features/Page/All-Boards.md
// How many archived boards the section shows at once. The publication is
// paginated and this is the page size it is asked for; the Archive is a place
// you go to find one board, not a list to scroll for ever.
const ARCHIVED_BOARDS_LIMIT = 60;

function boardsForView(tpl) {
  // The Archive shows ARCHIVED boards - the one section whose query is the
  // opposite of every other one's. docs/Features/Page/Archive.md
  const showsArchive = tpl.selectedMenu.get() === 'archive';
  let query = {
    $and: [
      { archived: showsArchive },
      { type: { $in: ['board', 'template-container'] } },
    ],
  };
  // Active helper boards stay out of ordinary board lists, but an archived
  // helper board must remain reachable here so its owner can restore or
  // permanently delete it (#6643).
  if (!showsArchive) query.$and.push({ title: notHelperBoardTitle() });
  const membershipOrs = [];

  let allowPrivateVisibilityOnly = TableVisibilityModeSettings.findOne(
    'tableVisibilityMode-allowPrivateOnly',
  );

  // #5850: the All Boards sub-views are also reachable via their own routes
  // (/templates, /remaining), which must apply the same membership filtering
  // as the home route, otherwise their board list is empty (or falls into the
  // public-only branch below).
  // 'allboards' is the URL-per-entry route (/allboards/starred, /allboards/
  // workspaces/...); the other three are the older addresses that redirect to
  // it, and 'home' is /. Leaving one out sends the page down the public-only
  // branch below, which shows PUBLIC boards instead of the user's own.
  const allBoardsRoutes = ['home', 'allboards', 'allboards-templates',
    'allboards-remaining'];
  if (allBoardsRoutes.includes(FlowRouter.getRouteName())) {
    membershipOrs.push({ 'members.userId': Meteor.userId() });

    const currUser = ReactiveCache.getCurrentUser();

    let orgIdsUserBelongs = currUser?.orgIdsUserBelongs() || '';
    if (orgIdsUserBelongs) {
      let orgsIds = orgIdsUserBelongs.split(',');
      membershipOrs.push({ 'orgs.orgId': { $in: orgsIds } });
    }

    let teamIdsUserBelongs = currUser?.teamIdsUserBelongs() || '';
    if (teamIdsUserBelongs) {
      let teamsIds = teamIdsUserBelongs.split(',');
      membershipOrs.push({ 'teams.teamId': { $in: teamsIds } });
    }

    // #5850: boards shared with the user's email domain.
    const emailDomains = currUser?.emailDomains?.() || [];
    if (emailDomains.length) {
      membershipOrs.push({ 'domains.domain': { $in: emailDomains } });
    }
    if (membershipOrs.length) {
      query.$and.splice(2, 0, { $or: membershipOrs });
    }
  } else if (
    allowPrivateVisibilityOnly !== undefined &&
    !allowPrivateVisibilityOnly.booleanValue
  ) {
    query = {
      archived: false,
      //type: { $in: ['board','template-container'] },
      type: 'board',
      permission: 'public',
      // ...and NOT the internal helper boards (`^Subtasks^`). Every other board
      // list excluded them; this one did not, so /public listed every public
      // subtasks board on the instance beside the real ones.
      title: notHelperBoardTitle(),
    };
  }

  const boards = ReactiveCache.getBoards(query, {});
  const currentUser = ReactiveCache.getCurrentUser();

  // #2220: the Home board (opened after login) always appears FIRST in the
  // Starred view, even when it has not been explicitly starred.
  const withHomeFirst = (arr) => {
    if (tpl.selectedMenu.get() !== 'starred') return arr;
    if ((tpl.boardSearchVar.get() || '').trim()) return arr;
    const homeId =
      currentUser && typeof currentUser.getDefaultBoardId === 'function'
        ? currentUser.getDefaultBoardId()
        : null;
    if (!homeId) return arr;
    const homeBoard = ReactiveCache.getBoard(homeId);
    if (!homeBoard || homeBoard.archived) return arr;
    return [homeBoard, ...arr.filter((b) => b && b._id !== homeId)];
  };

  // #5799: in a sorted (non-custom) mode the server already computed the
  // current page (filtered by menu/search and sorted), so render exactly that
  // ordered page of board icons. Custom (manual drag order) falls through to
  // the unpaginated client-side path below so drag-reordering keeps working.
  const sortMode =
    currentUser && typeof currentUser.getAllBoardsSortBy === 'function'
      ? currentUser.getAllBoardsSortBy()
      : 'custom';
  if (sortMode !== 'custom') {
    const paged = tpl.pagedBoardsVar.get();
    return withHomeFirst(
      (paged.ids || [])
        .map((id) => ReactiveCache.getBoard(id))
        .filter(Boolean),
    );
  }

  let list = boards;
  const assignments =
    (currentUser &&
      currentUser.profile &&
      currentUser.profile.boardWorkspaceAssignments) ||
    {};

  // #5799: when a board-name search is active, search across ALL the user's
  // boards (every menu/workspace) by title and skip the menu filter, so a
  // board in any category — Starred, Templates, Remaining or a (sub)workspace
  // — is found from a single search box.
  const search = (tpl.boardSearchVar.get() || '').trim().toLowerCase();
  if (search) {
    list = list.filter((b) => (b.title || '').toLowerCase().includes(search));
  } else {
    // Apply left menu filtering
    const sel = tpl.selectedMenu.get();
    if (sel === 'starred') {
      // Starred boards are always visible in Starred.
      list = list.filter((b) => currentUser && currentUser.hasStarred(b._id));
    } else if (sel === 'templates') {
      list = list.filter((b) => b.type === 'template-container');
    } else if (sel === 'remaining') {
      // Remaining only shows boards not assigned to any workspace.
      list = list.filter(
        (b) => !assignments[b._id] && b.type !== 'template-container',
      );
    } else if (sel === 'home') {
      // Exactly the Home board, wherever else it also lives. Like a star, Home
      // is a MARK on a board rather than a place a board is moved to, so the
      // board is still in Remaining or in its workspace as well.
      const id = homeBoardId();
      list = id ? list.filter((b) => b._id === id) : [];
    } else if (sel === 'archive') {
      // Everything the query already returned: they are archived, which is the
      // whole of what this section is. A workspace assignment survives
      // archiving, so filtering by it here would hide most of the archive.
      list = list.filter((b) => b.type !== 'template-container');
    } else {
      // Workspace view includes all boards in that workspace, including starred.
      list = list.filter((b) => assignments[b._id] === sel);
    }
  }

  if (currentUser && typeof currentUser.sortBoardsForUser === 'function') {
    return withHomeFirst(currentUser.sortBoardsForUser(list));
  }
  return withHomeFirst(
    list.slice().sort((a, b) => (a.title || '').localeCompare(b.title || '')),
  );
}

// Edit, Board title, Board description - the Table view's columns.
const ALL_BOARDS_COLUMNS = [
  { labelKey: 'edit' },
  { labelKey: 'title' },
  { labelKey: 'description' },
];


Template.allBoardsViewPopup.helpers({
  isAllBoardsView(view) {
    return isAllBoardsView(view);
  },
});

Template.allBoardsViewPopup.events({
  'click .js-all-boards-view-lists'() {
    setAllBoardsView('lists');
    Popup.back();
  },
  'click .js-all-boards-view-table'() {
    setAllBoardsView('table');
    Popup.back();
  },
});

Template.boardList.onCreated(function () {
  Meteor.subscribe('setting');
  Meteor.subscribe('tableVisibilityModeSettings');

  // How many boards are in the archive, for the count beside that menu row.
  //
  // Asked for as a NUMBER rather than counted client-side, because this page
  // does not subscribe to archived boards at all - its own query is
  // `archived: false` - and the archive's own publication is paginated to 30,
  // so counting whatever happened to be in minimongo would answer 0 on a fresh
  // load and something arbitrary later. `getArchivedBoardsCount` is the same
  // method the archive's pager already uses.
  this.archivedBoardsCount = new ReactiveVar(0);
  this.refreshArchivedBoardsCount = () => {
    Meteor.call('getArchivedBoardsCount', '', (err, count) => {
      if (!err) this.archivedBoardsCount.set(count || 0);
    });
  };
  this.refreshArchivedBoardsCount();

  // Honor the URL-addressable sub-view (#5850). The route sets
  // Session 'boardListMenu' to 'starred', 'templates' or 'remaining'.
  // Shared with the right sidebar, which is a SEPARATE Blaze instance (it is
  // rendered beside the page, not inside it) and carries this page's controls. Assigned onto the instance so every `tpl.selectedMenu` /
  // `tpl.boardSearchVar` already written here keeps working unchanged.
  // docs/Features/Page/All-Boards.md
  this.selectedMenu = allBoardsMenuVar;
  // Whatever the address named, else the section this user should land on:
  // Starred when anything is starred, Remaining when nothing is - opening on an
  // empty Starred with a full Remaining behind it is a page that looks broken.
  //
  // An AUTORUN, not a one-shot set: on a fresh load the user document arrives
  // after this runs, so a single read would answer "nothing is starred" for
  // every user and land everyone on Remaining. It settles once the document is
  // there.
  //
  // It stops mattering the moment the address names a section - clicking a row
  // navigates, and the route puts that name in the Session - so this cannot
  // fight a choice the reader has made. models/lib/allBoardsUrls.js
  this.autorun(() => {
    const named = Session.get('boardListMenu');
    this.selectedMenu.set(named || defaultSection(hasStarredBoards()));
  });
  this.selectedWorkspaceIdVar = new ReactiveVar(null);
  this.workspacesTreeVar = new ReactiveVar([]);
  // The workspace the URL names, as the slugs of its names down the tree:
  // /allboards/workspaces/engineering/backend. The ROUTER cannot resolve this -
  // the tree is on the user document, which it has no way to read before the
  // page has it - so it hands over the slugs and this waits for the tree.
  //
  // It runs whenever either changes, so a link followed while the page is
  // already open switches workspace, and a slug path that names nothing leaves
  // the Workspaces section selected rather than an empty board list.
  // docs/Features/Page/All-Boards-URLs.md
  this.autorun(() => {
    const slugPath = Session.get('boardListWorkspacePath') || [];
    const tree = this.workspacesTreeVar.get();
    if (!slugPath.length || !tree.length) return;
    const workspaceId = workspaceIdForSlugPath(tree, slugPath, getSlug);
    if (workspaceId && workspaceId !== this.selectedWorkspaceIdVar.get()) {
      this.selectedWorkspaceIdVar.set(workspaceId);
      this.selectedMenu.set(workspaceId);
    }
  });
  // #5799: free-text search by board name. When non-empty it searches across
  // ALL the user's boards (Starred, Templates, Remaining and every workspace),
  // ignoring the selected-menu filter.
  this.boardSearchVar = allBoardsSearchVar;

  // The archived boards themselves, while the Archive section is open. This
  // page's own query is `archived: false`, so without this the section would
  // have nothing to draw - the count comes from a method and says how many
  // there are, not what they are.
  //
  // AFTER `selectedMenu` and `boardSearchVar` are assigned: an autorun runs
  // once immediately, so placing it above them read `.get()` off undefined and
  // threw during onCreated.
  //
  // Subscribed only while that section is selected: an archive can be long, and
  // a page showing Starred has no use for it.
  this.autorun(() => {
    if (this.selectedMenu.get() !== 'archive') return;
    this.subscribe('archivedBoards', this.boardSearchVar.get() || '',
      ARCHIVED_BOARDS_LIMIT, 0);
  });
  this.autorun(() => {
    if (this.selectedMenu.get() !== 'templates' && !this.boardSearchVar.get()) return;
    this.subscribe('boardTemplates');
  });
  // The Table view's page. Client-side: the boards are already in minimongo for
  // the Lists view beside it, so paging them again on the server would be a round
  // trip for data the page is holding anyway.
  this.tablePageVar = new ReactiveVar(1);
  // #5799: server-side pagination state for the sorted (non-custom) modes.
  this.boardsPageVar = new ReactiveVar(1);
  this.pagedBoardsVar = new ReactiveVar({ ids: [], total: 0 });
  // #5850: the user's orgs/teams that have the per-org/team Shared Templates
  // flag set (plus email domains), fetched via a non-admin server method since
  // the org/team publications are admin-only. Gates the drag-to-share targets.
  this.shareableGroups = new ReactiveVar({ orgs: [], teams: [], domains: [] });
  Meteor.call('getMyShareableGroups', (err, res) => {
    if (!err && res) this.shareableGroups.set(res);
  });
  // #5174 / #4825: per-board tile data (per-list card counts + member ids) for
  // the All Boards tiles, computed server-side and fetched exactly ONCE here —
  // deliberately NOT inside an autorun and NOT from reactive getLists/getCards
  // cursors, so the #4214 "icons random dance" (a reactive re-render loop on
  // this page, which is why the old helpers were stubbed out) cannot return.
  this.boardTileDataVar = new ReactiveVar({});
  Meteor.call('getAllBoardsTileData', (err, res) => {
    if (!err && res) this.boardTileDataVar.set(res);
  });
  let currUser = ReactiveCache.getCurrentUser();
  let userLanguage;
  if (currUser && currUser.profile) {
    userLanguage = currUser.profile.language;
  }
  if (userLanguage) {
    TAPi18n.setLanguage(userLanguage);
  }

  // A workspace was dropped: before, after, or INTO another one. The tree it
  // becomes is worked out by the pure module - the guards that keep a subtree
  // attached to the root live there, with their own tests - and this only saves
  // the answer. docs/Features/Page/Workspaces.md
  this.moveWorkspaceInTree = (draggedId, targetId, position) => {
    const tree = this.workspacesTreeVar.get();
    // A drop that puts a workspace back where it already is writes the same tree
    // to the server and re-renders for nothing.
    if (isNoOpMove(tree, draggedId, targetId, position)) return;
    const next = moveWorkspace(tree, draggedId, targetId, position);
    if (!next) return;
    // On screen at once, saved behind it: the panel must not sit still while the
    // server answers, and the autorun below puts the server's tree back when it
    // arrives.
    this.workspacesTreeVar.set(next);
    Meteor.call('setWorkspacesTree', next, (err) => {
      if (err) console.error(err);
    });
  };

  // Load workspaces tree reactively; reset selection if selected workspace was deleted
  this.autorun(() => {
    const u = ReactiveCache.getCurrentUser();
    const tree = (u && u.profile && u.profile.boardWorkspacesTree) || [];
    this.workspacesTreeVar.set(tree);
    // Anything that is not a SECTION is taken to be a workspace id, and a
    // workspace that is no longer in the tree was deleted - so the selection
    // falls back to Remaining.
    //
    // The three section names used to be written out here. `archive` is a
    // section too now, so it was read as a workspace id, not found in the tree,
    // and clicking Boards in Archive highlighted Remaining instead. The list
    // comes from ALL_BOARDS_SECTIONS now: it is the same list the router and
    // the URLs use, so a sixth section cannot go missing from it.
    const sel = this.selectedMenu.get();
    if (sel && !ALL_BOARDS_SECTIONS.includes(sel)) {
      if (!findSpace(tree, sel)) {
        this.selectedMenu.set('remaining');
        this.selectedWorkspaceIdVar.set(null);
      }
    }
  });

  // Switch the sub-view live when the route changes (e.g. navigating to
  // /templates or /remaining while boardList is already rendered). Only the
  // three recognized menu values are honored so a workspace selection is not
  // clobbered (#5850).
  this.autorun(() => {
    const m = Session.get('boardListMenu');
    if (m === 'starred' || m === 'templates' || m === 'remaining') {
      this.selectedMenu.set(m);
      this.selectedWorkspaceIdVar.set(null);
    }
  });

  // #5799: reset to the first page whenever the active filter changes (search
  // text, selected menu/workspace or sort mode). Depends only on those signals,
  // not on boardsPageVar, so paging next/prev does not reset itself.
  this.autorun(() => {
    this.boardSearchVar.get();
    this.selectedMenu.get();
    const cu = ReactiveCache.getCurrentUser();
    if (cu && typeof cu.getAllBoardsSortBy === 'function') {
      cu.getAllBoardsSortBy();
    }
    this.boardsPageVar.set(1);
  });

  // #5799: fetch the current page of boards from the server for the sorted
  // (non-custom) modes, so only that page of icons is rendered. Custom (manual
  // drag order) stays unpaginated client-side so drag-reordering keeps working.
  // Uses the effective current user server-side, so it also works under
  // GlobalAdmin impersonation.
  this.autorun(() => {
    const cu = ReactiveCache.getCurrentUser();
    const sortBy =
      cu && typeof cu.getAllBoardsSortBy === 'function'
        ? cu.getAllBoardsSortBy()
        : 'custom';
    if (sortBy === 'custom') {
      this.pagedBoardsVar.set({ ids: [], total: 0 });
      return;
    }
    const search = (this.boardSearchVar.get() || '').trim();
    const menu = this.selectedMenu.get();
    const page = this.boardsPageVar.get();
    Meteor.call(
      'getAllBoardsPage',
      { search, sortBy, menu, page, perPage: BOARDS_PER_PAGE },
      (err, res) => {
        if (err) {
          console.error('getAllBoardsPage failed:', err);
          return;
        }
        if (res) this.pagedBoardsVar.set(res);
      },
    );
  });

  // The templates-container board is no longer auto-created at signup (#2339,
  // #5850), and it is no longer auto-created when the user merely opens the
  // Templates sub-view either: opening the view must not leave behind an empty
  // Template Container board the user never asked for. The container is created
  // only on demand -- either when the user explicitly adds one via the
  // "Add Template Board" flow (createTemplateContainerPopup), or lazily by
  // ensureTemplatesBoard right before a card/list/swimlane/board is actually
  // saved as a template. ensureTemplatesBoard remains idempotent (a no-op when
  // one already exists) so those save paths keep working.
});

Template.boardList.onRendered(function () {
  // Drag-to-scroll on the All Boards page is handled centrally for all
  // non-board pages by defaultLayout's route-aware autorun
  // (see client/components/main/layouts.js).

  // jQuery sortable is disabled in favor of HTML5 drag-and-drop for space management
  // The old sortable code has been removed to prevent conflicts
  /* OLD SORTABLE CODE - DISABLED
  const itemsSelector = '.js-board:not(.placeholder)';

  const $boards = this.$('.js-boards');
  $boards.sortable({
    connectWith: '.js-boards',
    tolerance: 'pointer',
    appendTo: '.board-list',
    helper: 'clone',
    distance: 7,
    items: itemsSelector,
    placeholder: 'board-wrapper placeholder',
    start(evt, ui) {
      ui.helper.css('z-index', 1000);
      ui.placeholder.height(ui.helper.height());
      EscapeActions.executeUpTo('popup-close');
    },
    async stop(evt, ui) {
      const prevBoardDom = ui.item.prev('.js-board').get(0);
      const nextBoardDom = ui.item.next('.js-board').get(0);
      const sortIndex = Utils.calculateIndex(prevBoardDom, nextBoardDom, 1);

      const boardDomElement = ui.item.get(0);
      const board = Blaze.getData(boardDomElement);
      $boards.sortable('cancel');
      const currentUser = ReactiveCache.getCurrentUser();
      if (currentUser && typeof currentUser.setBoardSortIndex === 'function') {
        await currentUser.setBoardSortIndex(board._id, sortIndex.base);
      }
    },
  });

  this.autorun(() => {
    if (Utils.isTouchScreenOrShowDesktopDragHandles()) {
      $boards.sortable({
        handle: '.board-handle',
      });
    }
  });
  */
});

Template.boardList.helpers({
  userHasTeams() {
    if (ReactiveCache.getCurrentUser()?.teams?.length > 0) return true;
    else return false;
  },
  teamsDatas() {
    const teams = ReactiveCache.getCurrentUser()?.teams;
    if (teams)
      return teams.sort((a, b) =>
        a.teamDisplayName.localeCompare(b.teamDisplayName),
      );
    else return [];
  },
  userHasOrgs() {
    if (ReactiveCache.getCurrentUser()?.orgs?.length > 0) return true;
    else return false;
  },
  orgsDatas() {
    const orgs = ReactiveCache.getCurrentUser()?.orgs;
    if (orgs)
      return orgs.sort((a, b) =>
        a.orgDisplayName.localeCompare(b.orgDisplayName),
      );
    else return [];
  },
  userHasOrgsOrTeams() {
    const tpl = Template.instance();
    const userHasOrgs = ReactiveCache.getCurrentUser()?.orgs?.length > 0;
    const userHasTeams = ReactiveCache.getCurrentUser()?.teams?.length > 0;
    return userHasOrgs || userHasTeams;
  },
  // The Table view of the same boards the Lists view draws. Ten per page, the
  // shared TABLE_PAGE_ROWS_PER_PAGE, and a rowTemplate because the Edit cell is a
  // control and the row carries the board's colours.
  // docs/Features/Page/All-Boards.md
  tablePageData() {
    const tpl = Template.instance();
    const all = boardsForView(tpl);
    const info = pageInfo(all.length, tpl.tablePageVar.get());
    const page = all.slice(info.skip, info.skip + TABLE_PAGE_ROWS_PER_PAGE);
    return {
      header: buildHeader(ALL_BOARDS_COLUMNS),
      rowTemplate: 'allBoardsRow',
      docs: page,
      rowCount: page.length,
      total: all.length,
      searchTerm: allBoardsSearchVar.get(),
      page: info.page,
      totalPages: info.totalPages,
      hasPrev: info.hasPrev,
      hasNext: info.hasNext,
      emptyKey: 'no-results',
    };
  },

  boards() {
    return boardsForView(Template.instance());
  },
  showsBoardSelectionControls() {
    const tpl = Template.instance();
    const namedSection = ['remaining', 'starred', 'home', 'templates', 'archive']
      .includes(tpl.selectedMenu.get());
    const workspace = Boolean(tpl.selectedWorkspaceIdVar.get());
    return (namedSection || workspace) && BoardMultiSelection.isActive();
  },
  // #5174 / #4825: the board tiles' per-list card-count line and member avatar
  // row. Data comes from the one-shot getAllBoardsTileData method fetch in
  // onCreated (see there) — NOT from reactive getLists/getCards cursors, which
  // caused the #4214 "icons random dance" and got these helpers stubbed to []
  // (hiding the counters/avatars for everyone). The show* helpers resolve the
  // per-board opt-in flags (allowsCardCounterList / allowsBoardMemberList,
  // board sidebar "Show at All Boards page"), strictly, server-side — so a
  // board with the checkbox off (or never set) consistently shows nothing.
  boardLists(boardId) {
    const tile = (Template.instance().boardTileDataVar.get() || {})[boardId];
    return (tile && tile.showLists && tile.lists) || [];
  },

  boardMembers(boardId) {
    const tile = (Template.instance().boardTileDataVar.get() || {})[boardId];
    return (tile && tile.showMembers && tile.memberIds) || [];
  },

  showCardCounterList(boardId) {
    const tile = (Template.instance().boardTileDataVar.get() || {})[boardId];
    return !!(tile && tile.showLists && tile.lists && tile.lists.length);
  },

  showBoardMemberList(boardId) {
    const tile = (Template.instance().boardTileDataVar.get() || {})[boardId];
    return !!(tile && tile.showMembers && tile.memberIds && tile.memberIds.length);
  },

  isStarred() {
    const user = ReactiveCache.getCurrentUser();
    return user && user.hasStarred(this._id);
  },

  // When this board was archived, in the reader's own date format. Shown only
  // in the Archive, where it is what one old board is told from another by.
  //
  // A board archived before `archivedAt` existed has none - the field was added
  // later - so it answers an em dash rather than "Invalid Date".
  archivedAtText() {
    if (!this.archivedAt) return '—';
    return formatDateByUserPreference(this.archivedAt);
  },
  // #2220: is this the user's Home board (the one opened after login)?
  isDefaultBoard() {
    const user = ReactiveCache.getCurrentUser();
    return user && user.isDefaultBoard(this._id);
  },
  isAdministrable() {
    const user = ReactiveCache.getCurrentUser();
    return user && user.isBoardAdmin(this._id);
  },

  hasOvertimeCards() {
    return this.hasOvertimeCards();
  },

  hasSpentTimeCards() {
    return this.hasSpentTimeCards();
  },

  isInvited() {
    const user = ReactiveCache.getCurrentUser();
    return user && user.isInvitedTo(this._id);
  },

  // Helpers for templates
  workspacesTree() {
    return Template.instance().workspacesTreeVar.get();
  },
  selectedWorkspaceId() {
    return Template.instance().selectedWorkspaceIdVar.get();
  },
  isSelectedMenu(type) {
    return Template.instance().selectedMenu.get() === type;
  },
  // #5850: drag-to-share drop targets — the user's organizations/teams/domains,
  // gated by the admin's Shared Templates scopes (localStorage). Shown in the
  // Templates view so a personal Template Board can be dragged onto one to share.
  shareTargets() {
    const scopes = loadSharedTemplatesScopes();
    const groups = Template.instance().shareableGroups.get() || {};
    const targets = [];
    if (scopes.includes('organizations')) {
      (groups.orgs || []).forEach(o => targets.push(o));
    }
    if (scopes.includes('teams')) {
      (groups.teams || []).forEach(t => targets.push(t));
    }
    if (scopes.includes('domains')) {
      (groups.domains || []).forEach(d => targets.push(d));
    }
    return targets;
  },
  isSpaceSelected(id) {
    return Template.instance().selectedWorkspaceIdVar.get() === id;
  },
  menuItemCount(type) {
    return menuItemCountOf(type);
  },
  // The four board-list rows of the left menu, in order. One place says what a
  // row looks like and one says what order they come in - the markup renders
  // whatever this returns. models/lib/allBoardsUrls.js
  menuSections() {
    const meta = {
      remaining: { icon: 'fa-folder', labelKey: 'allboards.remaining' },
      starred: { icon: 'fa-star', labelKey: 'allboards.starred' },
      templates: { icon: 'fa-clipboard', labelKey: 'allboards.templates' },
      // The archive row also opens the section AND refreshes its count, so it
      // carries a second class the others do not.
      archive: { icon: 'fa-archive', labelKey: 'archives',
        extraClass: 'js-open-archived-board' },
      // The Home row is also a drop target of its own - dropping a board on it
      // makes that board the one that opens after login - so it carries a
      // second class like the Archive does. docs/Features/Board/Home.md
      home: { icon: 'fa-home', labelKey: 'home', extraClass: 'js-home-menu' },
    };
    return menuSectionOrder(hasStarredBoards()).map(type => ({
      type,
      extraClass: '',
      ...meta[type],
    }));
  },

  // The heading at the top of the right pane: which list of boards you are
  // looking at.
  //
  // The same `paneTitle` template and the same `.admin-pane-title` class the
  // Admin Panel's panes use, so the two pages have ONE heading at one size and
  // colour rather than two that drift apart. Its words are the section's own
  // title key - the same key the first header bar names the page with, and the
  // same one the highlighted menu row carries - so all three say the same
  // thing. docs/Features/Page/All-Boards.md
  //
  // `{ titleKey }` for a section, `{ label }` for a workspace: a workspace's
  // name is what somebody typed, and a workspace called "starred" is not the
  // Starred section, so it must not go through the translator.
  allBoardsPaneTitle() {
    const tpl = Template.instance();
    const sel = tpl.selectedMenu.get();
    if (!sel || ALL_BOARDS_SECTIONS.includes(sel)) {
      return { titleKey: sectionTitleKey(sel) };
    }
    const node = findSpace(tpl.workspacesTreeVar.get() || [], sel);
    return node && node.name
      ? { label: node.name }
      // The tree has not arrived yet, or the workspace is gone: the section it
      // belongs to still names the pane, rather than leaving it blank.
      : { titleKey: sectionTitleKey(SECTION_WORKSPACES) };
  },

  // The bookmarks, drawn as tiles beside the starred boards. Only in Starred:
  // that is the list of places you keep, and a bookmark is one of them.
  // docs/Features/Board/Starred.md
  starredPages() {
    const user = ReactiveCache.getCurrentUser();
    return user && user.starredPages ? user.starredPages() : [];
  },

  // Is the Android-launcher Remove bar showing? Only in Home, and only while a
  // board from Home is actually in the air. docs/Features/Board/Home.md
  showsHomeRemoveTarget() {
    return Template.instance().selectedMenu.get() === 'home'
      && draggingFromHome.get();
  },

  // The "Add Board" tile, which belongs to the sections a board can be created
  // in. Not the Archive (a board cannot be created already archived) and not
  // Home (a new board is not the board that opens after login).
  showsAddBoardTile() {
    const sel = Template.instance().selectedMenu.get();
    return sel !== 'archive' && sel !== 'home';
  },

  // The count for a row. The three board lists count what the page can see; the
  // Archive's comes from the server, because this page does not subscribe to
  // archived boards unless that section is open.
  sectionCount(type) {
    if (type === 'archive') {
      const inst = Template.instance();
      return inst.archivedBoardsCount ? inst.archivedBoardsCount.get() : 0;
    }
    return menuItemCountOf(type);
  },

  // The count beside Boards in Archive. Its own helper rather than a branch of
  // menuItemCount: that one filters a list of NON-archived boards, so there is
  // nothing in it to count.
  archivedBoardsCount() {
    const inst = Template.instance();
    return inst.archivedBoardsCount ? inst.archivedBoardsCount.get() : 0;
  },
  workspaceCount(workspaceId) {
    const currentUser = ReactiveCache.getCurrentUser();
    const assignments =
      (currentUser &&
        currentUser.profile &&
        currentUser.profile.boardWorkspaceAssignments) ||
      {};

    // Get all boards for counting
    let query = {
      $and: [
        { archived: false },
        { type: { $in: ['board', 'template-container'] } },
        { $or: [{ 'members.userId': Meteor.userId() }] },
        { title: notHelperBoardTitle() },
      ],
    };
    const allBoards = ReactiveCache.getBoards(query, {});

    // Count boards directly assigned to this space (not including children)
    return allBoards.filter((b) => assignments[b._id] === workspaceId).length;
  },
  canModifyBoards() {
    const currentUser = ReactiveCache.getCurrentUser();
    return currentUser && !currentUser.isCommentOnly();
  },
  // #5799: current board-name search text (for the input value and the clear button).
  boardSearch() {
    return Template.instance().boardSearchVar.get();
  },
  // #5799: pagination controls (only shown in the sorted, non-custom modes).
  boardsPaginationActive() {
    const currentUser = ReactiveCache.getCurrentUser();
    const sortMode =
      currentUser && typeof currentUser.getAllBoardsSortBy === 'function'
        ? currentUser.getAllBoardsSortBy()
        : 'custom';
    if (sortMode === 'custom') return false;
    const total = Template.instance().pagedBoardsVar.get().total || 0;
    return total > BOARDS_PER_PAGE;
  },
  boardsCurrentPage() {
    return Template.instance().boardsPageVar.get();
  },
  boardsTotalPages() {
    const total = Template.instance().pagedBoardsVar.get().total || 0;
    return Math.max(1, Math.ceil(total / BOARDS_PER_PAGE));
  },
  hasBoardsPrevPage() {
    return Template.instance().boardsPageVar.get() > 1;
  },
  hasBoardsNextPage() {
    const tpl = Template.instance();
    const total = tpl.pagedBoardsVar.get().total || 0;
    const totalPages = Math.max(1, Math.ceil(total / BOARDS_PER_PAGE));
    return tpl.boardsPageVar.get() < totalPages;
  },
  // #5799: current All Boards sort mode ('custom' | 'title-asc' | 'title-desc').
  isBoardsSort(mode) {
    const currentUser = ReactiveCache.getCurrentUser();
    const current =
      currentUser && typeof currentUser.getAllBoardsSortBy === 'function'
        ? currentUser.getAllBoardsSortBy()
        : 'custom';
    return current === mode;
  },
  hasBoardsSelected() {
    return BoardMultiSelection.count() > 0;
  },
  boardWorkspaceDragHint() {
    const remaining = TAPi18n.__('allboards.remaining') || 'Remaining';
    const workspaces = TAPi18n.__('allboards.workspaces') || 'Workspaces';
    return (
      TAPi18n.__('drag-board-to-workspace', { remaining, workspaces }) ||
      `Drag board to assign to ${workspaces} (drop on workspace in left sidebar)`
    );
  },
  boardOpenAndMoveHint() {
    const remaining = TAPi18n.__('allboards.remaining') || 'Remaining';
    const workspaces = TAPi18n.__('allboards.workspaces') || 'Workspaces';
    return (
      TAPi18n.__(
        'board-open-and-move-between-remaining-and-workspaces',
        {
          remaining,
          workspaces,
        },
      ) ||
      `Click board icon to open board. Drag board between ${remaining} and ${workspaces}.`
    );
  },
});

// ── Where a dragged workspace would land, drawn on the row it is over ────────
//
// One class per position, so the CSS can open an empty slot above the row, below
// it, or light the row up to say "into this one". The class is also what the
// drop reads back: the pointer's position is worked out once, while the row is
// showing it, rather than a second time from a drop event that may land a pixel
// away from where the slot was drawn. docs/Features/Page/Workspaces.md
const WORKSPACE_DROP_CLASSES = {
  [DROP_BEFORE]: 'drop-before',
  [DROP_INSIDE]: 'drop-inside',
  [DROP_AFTER]: 'drop-after',
};

function clearWorkspaceDropMarks(only) {
  const rows = only ? [only] : document.querySelectorAll('.workspace-node');
  rows.forEach((el) => {
    el.classList.remove('drag-over', 'drop-before', 'drop-inside', 'drop-after');
  });
}

function markWorkspaceDropTarget(el, position) {
  const wanted = WORKSPACE_DROP_CLASSES[position];
  // Already showing this one: leave it alone. `dragover` fires many times a
  // second, and rewriting the class list every time restarts any transition on
  // the slot, which shows as a flicker under the pointer.
  if (el.classList.contains(wanted)) return;
  clearWorkspaceDropMarks();
  el.classList.add(wanted);
}

// What the row under the pointer is currently offering, for the drop to carry
// out. Defaults to INSIDE only if nothing was marked at all - which cannot
// normally happen, because a drop is preceded by the dragover that marked it.
function workspaceDropPositionOf(el) {
  const found = Object.keys(WORKSPACE_DROP_CLASSES)
    .find((position) => el.classList.contains(WORKSPACE_DROP_CLASSES[position]));
  return found || DROP_INSIDE;
}

Template.workspaceTree.helpers({
  workspaceCount(workspaceId) {
    const currentUser = ReactiveCache.getCurrentUser();
    const assignments =
      (currentUser &&
        currentUser.profile &&
        currentUser.profile.boardWorkspaceAssignments) ||
      {};

    let query = {
      $and: [
        { archived: false },
        { type: { $in: ['board', 'template-container'] } },
        { $or: [{ 'members.userId': Meteor.userId() }] },
        { title: notHelperBoardTitle() },
      ],
    };
    const allBoards = ReactiveCache.getBoards(query, {});

    return allBoards.filter((b) => assignments[b._id] === workspaceId).length;
  },

  // The caret, and what it says. `Template.currentData()` is the NODE inside the
  // `each`, which is what makes these read the row they are drawn on rather than
  // needing the id passed to each of them.
  // docs/Features/Page/Workspaces.md
  workspaceHasChildren() {
    return hasChildren(Template.currentData());
  },

  isWorkspaceCollapsed() {
    const node = Template.currentData();
    return !!(node && Utils.getWorkspaceCollapseState(node.id));
  },

  // Children are drawn when there ARE children and the row is not folded. One
  // helper rather than two nested blocks in the template: `..` counts block
  // levels, and another block between the `each` and the recursive inclusion is
  // another level for `../selectedWorkspaceId` to climb - which is how the
  // selected-workspace highlight was lost once already.
  workspaceShowsChildren() {
    const node = Template.currentData();
    if (!hasChildren(node)) return false;
    return !Utils.getWorkspaceCollapseState(node.id);
  },

  workspaceCollapseLabel() {
    const node = Template.currentData();
    const folded = !!(node && Utils.getWorkspaceCollapseState(node.id));
    const action = TAPi18n.__(folded ? 'uncollapse' : 'collapse');
    // Named with the workspace, because an `aria-label` REPLACES what is inside
    // the element and a tree of carets would otherwise announce the same two
    // words over and over with nothing to tell them apart.
    return node && node.name ? `${action}: ${node.name}` : action;
  },
});

Template.workspaceTree.events({
  'click .js-collapse-workspace'(evt) {
    // The row underneath opens the workspace; folding it is a different act on
    // a different control, so the click stops here.
    evt.preventDefault();
    evt.stopPropagation();
    const node = Blaze.getData(evt.currentTarget);
    if (!node || !node.id) return;
    Utils.setWorkspaceCollapseState(node.id, !Utils.getWorkspaceCollapseState(node.id));
  },
  // An anchor with no href is neither focusable nor answers a key by itself.
  // `tabindex` in the template gives it the focus; this gives it the two keys
  // `role="button"` beside them promises, so a tree can be walked without a
  // mouse.
  'keydown .js-collapse-workspace'(evt) {
    if (evt.key !== 'Enter' && evt.key !== ' ' && evt.key !== 'Spacebar') return;
    evt.preventDefault();
    evt.stopPropagation();
    const node = Blaze.getData(evt.currentTarget);
    if (!node || !node.id) return;
    Utils.setWorkspaceCollapseState(node.id, !Utils.getWorkspaceCollapseState(node.id));
  },
});

// #6521: HTML5 dragstart's `target` is the DRAGGABLE element (the whole
// `li.js-board`) in Chrome/Firefox, NOT the sub-element the pointer was on - so
// checking `dragstart.target.closest('.board-handle')` is always null and the
// handle-only drag gate cancelled EVERY handle drag. Record instead where the
// mousedown began (which does fire on the handle), and read that in dragstart.
let boardPressStartedOnHandle = false;

// The live drop-gap element (a plain div, not Blaze-managed) and which side of
// its reference tile it currently sits on.
let boardPlaceholderEl = null;
function ensureBoardPlaceholder() {
  if (!boardPlaceholderEl) {
    boardPlaceholderEl = document.createElement('li');
    boardPlaceholderEl.className = 'js-board-placeholder board-drop-placeholder';
  }
  return boardPlaceholderEl;
}
function showBoardPlaceholder(tile, after) {
  const ph = ensureBoardPlaceholder();
  const ref = after ? tile.nextSibling : tile;
  // Do not insert the gap immediately next to the dragged tile's own slot.
  if (ref === ph) return;
  tile.parentNode.insertBefore(ph, ref);
}
function removeBoardPlaceholder() {
  if (boardPlaceholderEl && boardPlaceholderEl.parentNode) {
    boardPlaceholderEl.parentNode.removeChild(boardPlaceholderEl);
  }
}
// Read the intended order from the DOM: every board id in list order, with the
// dragged id taken from its old slot and placed where the gap currently sits.
// Using the gap's real position is what makes releasing OVER the gap work - the
// drop does not have to land on a specific tile.
function orderFromDomWithPlaceholder(tpl, draggedId) {
  const nodes = Array.from(tpl.findAll('.js-board, .js-board-placeholder'));
  const ids = [];
  let placed = false;
  for (const el of nodes) {
    if (el.classList.contains('js-board-placeholder')) {
      ids.push(draggedId);
      placed = true;
    } else {
      const id = Blaze.getData(el) && Blaze.getData(el)._id;
      if (id && id !== draggedId) ids.push(id);
    }
  }
  // No gap shown (e.g. a drop with no prior dragover): leave the order untouched.
  return placed ? ids : null;
}
function persistBoardOrderFromDom(evt, tpl) {
  if (!isDragReorderEnabled(currentAllBoardsSortBy())) return;
  const dt = evt.originalEvent.dataTransfer;
  if (dt && dt.getData('application/x-board-multi') === 'true') return;
  const draggedId = dt ? dt.getData('text/plain') : '';
  if (!draggedId) return;
  evt.preventDefault();
  evt.stopPropagation();
  const order = orderFromDomWithPlaceholder(tpl, draggedId);
  removeBoardPlaceholder();
  if (!order) return;
  const before = (ReactiveCache.getCurrentUser()?.profile || {}).boardSortIndex || {};
  const mapping = computeSortIndexMapping(order);
  // No-op if the visible order did not actually change.
  const unchanged = order.every((id, i) => before[id] === i) &&
    Object.keys(mapping).length === order.length;
  if (unchanged) return;
  const currentUser = ReactiveCache.getCurrentUser();
  if (currentUser && typeof currentUser.setBoardSortIndexes === 'function') {
    currentUser.setBoardSortIndexes(mapping);
  }
}

Template.boardList.events({
  // Boards in Archive no longer NAVIGATES anywhere. It is a section of this
  // page, drawn beside the left menu by the generic `js-select-menu` click
  // below - selecting it from a menu row and then losing the menu is a menu
  // that throws itself away.
  //
  // What is left here is the count: the archive's size changes when a board is
  // dropped on this row, and it comes from a method call rather than a
  // subscription, so nothing refreshes it on its own.
  'click .js-open-archived-board'(evt, tpl) {
    if (tpl && tpl.refreshArchivedBoardsCount) tpl.refreshArchivedBoardsCount();
  },
  'mousedown .js-board'(evt) {
    boardPressStartedOnHandle = !!(evt.target && evt.target.closest &&
      evt.target.closest('.board-handle'));
  },
  'click .js-select-menu'(evt, tpl) {
    const type = evt.currentTarget.getAttribute('data-type');
    tpl.selectedWorkspaceIdVar.set(null);
    tpl.selectedMenu.set(type);
    goToAllBoards(tpl, type);
  },
  'click .js-select-workspace'(evt, tpl) {
    const id = evt.currentTarget.getAttribute('data-id');
    tpl.selectedWorkspaceIdVar.set(id);
    tpl.selectedMenu.set(id);
    goToAllBoards(tpl, id);
  },
  'click .js-open-workspace-menu': Popup.open('workspaceActions'),
  // #6524: opens a popup with a real input. This used to call window.prompt(),
  // which a browser may simply refuse to show - iOS Safari offers "don't allow
  // further prompts" and then suppresses every later one for that page, so the
  // "+" beside Workspaces did nothing at all and no input field ever appeared.
  'click .js-add-workspace': Popup.open('addWorkspace'),
  'click .js-add-board'(evt, tpl) {
    // Store the currently selected workspace/menu for board creation
    const selectedWorkspaceId = tpl.selectedWorkspaceIdVar.get();
    const selectedMenu = tpl.selectedMenu.get();

    if (selectedWorkspaceId) {
      Session.set('createBoardInWorkspace', selectedWorkspaceId);
    } else {
      Session.set('createBoardInWorkspace', null);
    }

    // Open different popup based on context
    if (selectedMenu === 'templates') {
      Popup.open('createTemplateContainer')(evt);
    } else {
      Popup.open('createBoard')(evt);
    }
  },
  // #5799: choose how the All Boards page is sorted.
  // Titled "Sort Boards", from the key the app already has for that phrase -
  // the same reasoning as the starred-boards popup: a `boardsSortPopup-title`
  // of its own would be a second copy of one phrase in all 147 language files,
  // English in every one of them at first. A title also gives the popup its
  // header, and with it the close button; without one it renders as a
  // `no-title` pop-over with nothing to shut it but clicking away.
  'click .js-open-boards-sort': Popup.open('boardsSort', { titleKey: 'sort-boards' }),
  // The Table view's own controls. Its search box is the shared one in the header
  // bar, so only the pager is here; the boards are already in minimongo, so a page
  // is a slice rather than a round trip.
  'click .js-table-page-prev'(evt, tpl) {
    evt.preventDefault();
    tpl.tablePageVar.set(Math.max(1, tpl.tablePageVar.get() - 1));
  },
  'click .js-table-page-next'(evt, tpl) {
    evt.preventDefault();
    tpl.tablePageVar.set(tpl.tablePageVar.get() + 1);
  },
  // Edit opens the SAME popup the Swimlanes view opens from its board menu; the
  // row's data context is the board, which is what the popup now reads.
  'click .js-edit-board-title-row': Popup.open('boardChangeTitle'),
  // #5799: search boards by name across all categories.
  'input .js-board-search-input'(evt, tpl) {
    tpl.boardSearchVar.set(evt.currentTarget.value);
  },
  'keydown .js-board-search-input'(evt, tpl) {
    // Esc clears the search.
    if (evt.keyCode === 27) {
      tpl.boardSearchVar.set('');
      evt.currentTarget.value = '';
    }
  },
  'click .js-board-search-clear'(evt, tpl) {
    evt.preventDefault();
    tpl.boardSearchVar.set('');
    const input = tpl.find('.js-board-search-input');
    if (input) {
      input.value = '';
      input.focus();
    }
  },
  // #5799: board grid pagination (sorted modes only).
  'click .js-boards-prev-page'(evt, tpl) {
    evt.preventDefault();
    const page = tpl.boardsPageVar.get();
    if (page > 1) tpl.boardsPageVar.set(page - 1);
  },
  'click .js-boards-next-page'(evt, tpl) {
    evt.preventDefault();
    const total = tpl.pagedBoardsVar.get().total || 0;
    const totalPages = Math.max(1, Math.ceil(total / BOARDS_PER_PAGE));
    const page = tpl.boardsPageVar.get();
    if (page < totalPages) tpl.boardsPageVar.set(page + 1);
  },
  'click .js-star-board'(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    const boardId = this._id;
    if (boardId) {
      Meteor.call('toggleBoardStar', boardId);
    }
  },
  // HTML5 DnD from boards to spaces
  // #5850: drag a (template) board onto an Org/Team/Domain target to share it.
  'dragover .js-share-target'(evt) {
    if (isArchivedMultiBoardDrag(evt)) return;
    evt.preventDefault();
    if (evt.originalEvent.dataTransfer) {
      evt.originalEvent.dataTransfer.dropEffect = 'copy';
    }
    evt.currentTarget.classList.add('board-drag-hint');
  },
  'dragleave .js-share-target'(evt) {
    evt.currentTarget.classList.remove('board-drag-hint');
  },
  'drop .js-share-target'(evt) {
    if (isArchivedMultiBoardDrag(evt)) return;
    evt.preventDefault();
    evt.stopPropagation();
    const target = evt.currentTarget;
    target.classList.remove('board-drag-hint');
    const dt = evt.originalEvent.dataTransfer;
    const data = dt.getData('text/plain');
    if (!data) {
      return;
    }
    const isMulti = dt.getData('application/x-board-multi') === 'true';
    let boardIds;
    if (isMulti) {
      try {
        boardIds = JSON.parse(data);
      } catch (e) {
        boardIds = [];
      }
    } else {
      boardIds = [data];
    }
    const shareType = target.getAttribute('data-share-type');
    const name = target.getAttribute('data-share-name');
    const id = target.getAttribute('data-share-id');
    boardIds.forEach(boardId => shareBoardWith(boardId, shareType, name, id));
  },
  'dragstart .js-board'(evt, tpl) {
    const boardId = this._id;
    // Picked up in Home? The drag says so - see DRAG_FROM_HOME.
    markDragFromHome(evt, tpl && tpl.selectedMenu && tpl.selectedMenu.get());

    // Honour the "Show desktop drag handles" setting here too. With handles ON
    // the handle is the ONLY drag source - the rest of the tile stays free, so a
    // finger dragging across it scrolls the board list instead of picking the
    // board up. That is the same contract swimlanes, lists and cards follow on a
    // board. With handles OFF there is no handle to grab, so the whole tile
    // drags, exactly as before.
    //
    // The `li` keeps `draggable="true"` either way: HTML5 drag-and-drop can only
    // start from a draggable element, and moving that attribute onto the handle
    // would drag the handle rather than the board. Instead the drag is cancelled
    // unless it began on the handle.
    // With handles ON, only a drag that BEGAN on the handle may reorder. The
    // mousedown handler above recorded that (dragstart.target is unreliable - it
    // is the whole li, not the handle). A drag that started elsewhere on the tile
    // is cancelled, leaving the rest of the tile free to scroll.
    if (Utils.showDragHandles() && !boardPressStartedOnHandle) {
      evt.preventDefault();
      return;
    }

    if (tpl && tpl.selectedMenu && tpl.selectedMenu.get() === SECTION_REMAINING) {
      try {
        evt.originalEvent.dataTransfer.setData(DRAG_FROM_REMAINING, '1');
      } catch (e) {}
    }
    if (
      tpl && tpl.selectedWorkspaceIdVar
      && tpl.selectedWorkspaceIdVar.get()
    ) {
      try {
        evt.originalEvent.dataTransfer.setData(DRAG_FROM_WORKSPACE, '1');
      } catch (e) {}
    }

    // While Multi-Selection is on in Archive, every board drag is a restore
    // gesture. Mark even an unselected tile dragged on its own, so Home cannot
    // become an accidental target merely because that tile was not checked.
    if (
      tpl && tpl.selectedMenu && tpl.selectedMenu.get() === SECTION_ARCHIVE
      && BoardMultiSelection.isActive()
    ) {
      try {
        evt.originalEvent.dataTransfer.setData(ARCHIVED_MULTI_BOARD_DRAG, '1');
      } catch (e) {}
    }

    // Support multi-drag
    if (
      BoardMultiSelection.isActive() &&
      BoardMultiSelection.isSelected(boardId)
    ) {
      const selectedIds = BoardMultiSelection.getSelectedBoardIds();
      try {
        evt.originalEvent.dataTransfer.setData(
          'text/plain',
          JSON.stringify(selectedIds),
        );
        evt.originalEvent.dataTransfer.setData(
          'application/x-board-multi',
          'true',
        );
      } catch (e) {}
    } else {
      try {
        evt.originalEvent.dataTransfer.setData('text/plain', boardId);
      } catch (e) {}
      if (isDragReorderEnabled(currentAllBoardsSortBy())) {
        const el = evt.currentTarget;
        // Centre the drag ghost on the cursor. dragover fires for whatever is
        // under the CURSOR, but the icon was grabbed off-centre (often at the
        // handle), so the ghost sat beside the cursor and the gap opened for the
        // wrong icon - you had to aim the target's left edge. With the ghost
        // centred on the cursor, the gap opens for the icon the ghost is over.
        try {
          const rect = el.getBoundingClientRect();
          evt.originalEvent.dataTransfer.setDragImage(
            el, rect.width / 2, rect.height / 2,
          );
        } catch (e) {}
        // Take the dragged icon OUT of the grid flow while dragging, so the other
        // icons reflow as if it were gone and the gap sits exactly where the icon
        // will land. On a timeout so the drag image is already captured (hiding it
        // synchronously in dragstart cancels the drag).
        setTimeout(() => el.classList.add('board-dragging-hidden'), 0);
      }
    }
    // Highlight valid drop targets in the sidebar so users know where to drop
    document.querySelectorAll('.workspace-node').forEach((el) => {
      el.classList.add('board-drag-hint');
    });
    document.querySelectorAll('.js-select-menu').forEach((el) => {
      // An archived multi-selection may be restored to Remaining or an
      // existing Workspace, but cannot become Home. Other live-board drags can
      // still use both Remaining and Home.
      const type = el.getAttribute('data-type');
      const archivedMulti =
        tpl && tpl.selectedMenu && tpl.selectedMenu.get() === SECTION_ARCHIVE
        && BoardMultiSelection.isActive();
      const fromRemaining =
        tpl && tpl.selectedMenu && tpl.selectedMenu.get() === SECTION_REMAINING;
      const fromWorkspace =
        tpl && tpl.selectedWorkspaceIdVar && tpl.selectedWorkspaceIdVar.get();
      if (
        type === 'remaining'
        || (!archivedMulti && type === 'home')
        || ((fromRemaining || fromWorkspace) &&
          (type === 'starred' || type === 'archive'))
      ) {
        el.classList.add('board-drag-hint');
      }
    });
  },
  'dragend .js-board'(evt) {
    boardPressStartedOnHandle = false;
    // The drag is over however it ended - dropped, cancelled with Escape, or
    // released over nothing - so the remove target goes away with it.
    draggingFromHome.set(false);
    removeBoardPlaceholder();
    if (evt && evt.currentTarget) {
      evt.currentTarget.classList.remove('board-dragging-hidden');
    }
    document.querySelectorAll('.js-board.board-dragging-hidden').forEach((el) =>
      el.classList.remove('board-dragging-hidden'));
    document.querySelectorAll('.workspace-node.board-drag-hint, .js-select-menu.board-drag-hint').forEach((el) => {
      el.classList.remove('board-drag-hint');
    });
    document.querySelectorAll('.js-board.board-reorder-over').forEach((el) => {
      el.classList.remove('board-reorder-over');
    });
  },
  // #6439: reorder boards on the All Boards page by dropping one board onto
  // another. Only active in the "custom" (manual drag order) sort mode — in the
  // sorted modes the order comes from the title, so a board is not a valid drop
  // target (which is why, before this, the browser showed the not-allowed cursor
  // and nothing persisted). The reorder decision/index math lives in the pure,
  // unit-tested models/lib/boardSortReorder.js.
  // #6439: live insertion placeholder. While a board is dragged, an empty gap
  // opens up before/after the tile under the cursor, showing exactly where the
  // board will land - the standard sortable feel - instead of only highlighting
  // a target. The gap is a plain DOM node inserted next to Blaze-managed tiles
  // and removed on dragend, so it never fights Blaze's reactive list.
  //
  // `after` (cursor past the tile's inline-centre) lets a board drop on either
  // side of a tile, so the end of the order is reachable by dropping past the
  // last tile - no separate end target needed.
  'dragover .js-board'(evt, tpl) {
    if (!isDragReorderEnabled(currentAllBoardsSortBy())) return;
    const dt = evt.originalEvent.dataTransfer;
    if (dt && dt.getData('application/x-board-multi') === 'true') return;
    evt.preventDefault();
    evt.stopPropagation();
    if (dt) dt.dropEffect = 'move';
    const tile = evt.currentTarget;
    // Hovering a tile opens the gap AT that tile's slot (insert before it), so a
    // board dropped anywhere on a card lands in that card's place - no need to
    // aim the card's left half. The only exception is the LAST tile: its trailing
    // half inserts AFTER it, so the end of the order stays reachable.
    // Exclude the hidden dragged tile: it is still in the DOM (display:none)
    // but not visually present, so it must not count as the last tile.
    const allTiles = Array.from(tile.parentNode.querySelectorAll('.js-board'))
      .filter((t) => !t.classList.contains('board-dragging-hidden'));
    const isLast = allTiles[allTiles.length - 1] === tile;
    let after = false;
    if (isLast) {
      const rect = tile.getBoundingClientRect();
      const ltr = getComputedStyle(tile).direction !== 'rtl';
      const mid = rect.left + rect.width / 2;
      const x = evt.originalEvent.clientX;
      after = ltr ? x > mid : x < mid;
    }
    showBoardPlaceholder(tile, after);
  },
  'drop .js-board'(evt, tpl) {
    persistBoardOrderFromDom(evt, tpl);
  },
  // Releasing OVER the gap must also drop: the placeholder is not a `.js-board`,
  // so without these the drop landed on nothing and the board snapped back.
  'dragover .js-board-placeholder'(evt) {
    if (!isDragReorderEnabled(currentAllBoardsSortBy())) return;
    const dt = evt.originalEvent.dataTransfer;
    if (dt && dt.getData('application/x-board-multi') === 'true') return;
    evt.preventDefault();
    evt.stopPropagation();
    if (dt) dt.dropEffect = 'move';
  },
  'drop .js-board-placeholder'(evt, tpl) {
    persistBoardOrderFromDom(evt, tpl);
  },
  'click .js-clone-board'(evt) {
    if (confirm(TAPi18n.__('duplicate-board-confirm'))) {
      let title =
        getSlug(ReactiveCache.getBoard(this._id).title) ||
        'cloned-board';
      Meteor.call(
        'copyBoard',
        this._id,
        {
          sort: ReactiveCache.getBoards({ archived: false }).length,
          type: 'board',
          title: ReactiveCache.getBoard(this._id).title,
        },
        (err, res) => {
          if (err) {
            console.error(err);
          } else {
            Session.set('fromBoard', null);
            Meteor.subscribe('board', res, false);
            FlowRouter.go('board', {
              id: res,
              slug: title,
            });
          }
        },
      );
      evt.preventDefault();
    }
  },
  'click .js-archive-board'(evt) {
    if (confirm(TAPi18n.__('archive-board-confirm'))) {
      const boardId = this._id;
      Meteor.call('archiveBoard', boardId, (err) => {
        if (err) alert(err?.reason || err?.message || 'Failed to archive board');
      });
      evt.preventDefault();
    }
  },
  'click .js-accept-invite'() {
    const boardId = this._id;
    Meteor.call('acceptInvite', boardId);
  },
  'click .js-decline-invite'() {
    const boardId = this._id;
    Meteor.call('quitBoard', boardId, (err, ret) => {
      if (!err && ret) {
        Meteor.call('acceptInvite', boardId);
        FlowRouter.go('home');
      }
    });
  },
  'click .js-multiselection-activate'(evt) {
    evt.preventDefault();
    if (BoardMultiSelection.isActive()) {
      BoardMultiSelection.disable();
      closeAllBoardsSidebar();
    } else {
      BoardMultiSelection.activate();
      openAllBoardsSidebar(SIDEBAR_MULTISELECTION);
    }
  },
  'click .js-multiselection-reset'(evt) {
    evt.preventDefault();
    // The reset X is now nested inside the activate button (matching the Swimlanes
    // view), so stop the click from bubbling to js-multiselection-activate — which
    // would otherwise immediately re-activate what we just disabled.
    evt.stopPropagation();
    BoardMultiSelection.disable();
    closeAllBoardsSidebar();
  },
  'click .js-toggle-board-multi-selection'(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    const boardId = this._id;
    BoardMultiSelection.toogle(boardId);
  },
  'click .js-board-select-all'(evt, tpl) {
    evt.preventDefault();
    // `boardsForView` is the exact list of icons being drawn: the section and
    // search have already narrowed it. Do not silently select a board that is
    // not visible on this page.
    BoardMultiSelection.add(boardsForView(tpl).map(board => board._id));
  },
  'click .js-board-select-none'(evt) {
    evt.preventDefault();
    BoardMultiSelection.reset();
  },
  'click #resetBtn'(event) {
    let allBoards = document.getElementsByClassName('js-board');
    let currBoard;
    for (let i = 0; i < allBoards.length; i++) {
      currBoard = allBoards[i];
      currBoard.style.display = 'block';
    }
  },
  'click #filterBtn'(event) {
    event.preventDefault();
    let selectedTeams = document.querySelectorAll(
      '#jsAllBoardTeams option:checked',
    );
    let selectedTeamsValues = Array.from(selectedTeams).map(
      function (elt) {
        return elt.value;
      },
    );
    let index = selectedTeamsValues.indexOf('-1');
    if (index > -1) {
      selectedTeamsValues.splice(index, 1);
    }

    let selectedOrgs = document.querySelectorAll(
      '#jsAllBoardOrgs option:checked',
    );
    let selectedOrgsValues = Array.from(selectedOrgs).map(function (elt) {
      return elt.value;
    });
    index = selectedOrgsValues.indexOf('-1');
    if (index > -1) {
      selectedOrgsValues.splice(index, 1);
    }

    if (selectedTeamsValues.length > 0 || selectedOrgsValues.length > 0) {
      const query = {
        $and: [{ archived: false }, { type: 'board' }],
      };
      const ors = [];
      if (selectedTeamsValues.length > 0) {
        ors.push({ 'teams.teamId': { $in: selectedTeamsValues } });
      }
      if (selectedOrgsValues.length > 0) {
        ors.push({ 'orgs.orgId': { $in: selectedOrgsValues } });
      }
      if (ors.length) {
        query.$and.push({ $or: ors });
      }

      let filteredBoards = ReactiveCache.getBoards(query, {});
      let allBoards = document.getElementsByClassName('js-board');
      let currBoard;
      if (filteredBoards.length > 0) {
        let currBoardId;
        let found;
        for (let i = 0; i < allBoards.length; i++) {
          currBoard = allBoards[i];
          currBoardId = currBoard.classList[0];
          found = filteredBoards.find(function (board) {
            return board._id == currBoardId;
          });

          if (found !== undefined) currBoard.style.display = 'block';
          else currBoard.style.display = 'none';
        }
      } else {
        for (let i = 0; i < allBoards.length; i++) {
          currBoard = allBoards[i];
          currBoard.style.display = 'none';
        }
      }
    }
  },
  'dragstart .workspace-node'(evt) {
    const workspaceId = evt.currentTarget.getAttribute('data-workspace-id');
    const dt = evt.originalEvent.dataTransfer;
    dt.effectAllowed = 'move';
    // CLEAR first. With the drag handles off the drag starts on an ANCHOR, and
    // a browser puts that anchor's own text into `text/plain` by itself - which
    // the drop handler below reads as "a board was dropped here", so the drop
    // did nothing and the row snapped back. Handles ON started the drag from a
    // span, which carries no text, which is why the same drop worked there.
    // docs/Features/Page/Workspaces.md
    if (typeof dt.clearData === 'function') dt.clearData();
    dt.setData('application/x-workspace-id', workspaceId);

    // Create a better drag image
    const dragImage = evt.currentTarget.cloneNode(true);
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-9999px';
    dragImage.style.opacity = '0.8';
    document.body.appendChild(dragImage);
    dt.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);

    evt.currentTarget.classList.add('dragging');
  },
  'dragend .workspace-node'(evt) {
    evt.currentTarget.classList.remove('dragging');
    clearWorkspaceDropMarks();
  },
  'dragover .workspace-node'(evt) {
    if (isDragFromHome(evt)) return;

    const draggingEl = document.querySelector('.workspace-node.dragging');
    const targetEl = evt.currentTarget;

    // A workspace may not be dropped into itself or into its own descendant:
    // the subtree would be cut off from the root, taking every workspace under
    // it. NOT calling preventDefault() is how HTML5 drag and drop REFUSES a
    // drop, so the cursor says no while it is still in the air rather than the
    // drop landing and quietly doing nothing.
    if (draggingEl && (targetEl === draggingEl || draggingEl.contains(targetEl))) {
      clearWorkspaceDropMarks();
      return;
    }
    evt.preventDefault();
    evt.stopPropagation();
    evt.originalEvent.dataTransfer.dropEffect = 'move';

    // A BOARD dropped on a workspace is assigned to it - there is no before or
    // after for that, so the whole row is one target and it keeps the plain
    // highlight it always had.
    if (!draggingEl) {
      clearWorkspaceDropMarks();
      targetEl.classList.add('drag-over');
      return;
    }

    // A WORKSPACE: which third of the row the pointer is in decides what the
    // drop means, and the row shows it - a slot above, a slot below, or the row
    // itself lit up to say "into this one".
    const rect = targetEl.getBoundingClientRect();
    const position = dropPosition(evt.originalEvent.clientY - rect.top, rect.height);
    markWorkspaceDropTarget(targetEl, position);
  },
  'dragleave .workspace-node'(evt) {
    // Only when the pointer has actually left the row: `dragleave` also fires
    // when it crosses onto a CHILD of the row - the name, the count - and
    // clearing there made the slot flicker as the pointer moved along a row.
    const to = evt.originalEvent && evt.originalEvent.relatedTarget;
    if (to && evt.currentTarget.contains(to)) return;
    clearWorkspaceDropMarks(evt.currentTarget);
  },
  'drop .workspace-node'(evt, tpl) {
    if (isDragFromHome(evt)) return;
    evt.preventDefault();
    evt.stopPropagation();

    const targetEl = evt.currentTarget;
    const position = workspaceDropPositionOf(targetEl);
    clearWorkspaceDropMarks();

    // Which of the two kinds of drag is this? The WORKSPACE id decides, and it
    // decides first: a workspace drag that began on an anchor also carries the
    // anchor's text in `text/plain`, and reading that first is what made this
    // handler treat a workspace as a board.
    const draggedWorkspaceId = evt.originalEvent.dataTransfer.getData(
      'application/x-workspace-id',
    );
    const targetWorkspaceId = targetEl.getAttribute('data-workspace-id');

    if (draggedWorkspaceId) {
      if (draggedWorkspaceId !== targetWorkspaceId) {
        tpl.moveWorkspaceInTree(draggedWorkspaceId, targetWorkspaceId, position);
      }
      return;
    }

    const isMultiBoard = evt.originalEvent.dataTransfer.getData(
      'application/x-board-multi',
    );
    const boardData = evt.originalEvent.dataTransfer.getData('text/plain');
    if (!boardData || !targetWorkspaceId) return;

    if (isMultiBoard) {
      // Multi-board drag
      try {
        const boardIds = JSON.parse(boardData);
        boardIds.forEach((boardId) => {
          const board = ReactiveCache.getBoard(boardId);
          if (board && board.archived) Meteor.call('restoreBoard', boardId);
          Meteor.call('assignBoardToWorkspace', boardId, targetWorkspaceId);
        });
      } catch (e) {
        // Error parsing multi-board data
      }
    } else {
      // Single board drag
      const board = ReactiveCache.getBoard(boardData);
      if (board && board.archived) Meteor.call('restoreBoard', boardData);
      Meteor.call('assignBoardToWorkspace', boardData, targetWorkspaceId);
    }
  },
  'dragover .js-select-menu'(evt) {
    // A board picked up in Home may only be dropped on the remove target. NOT
    // calling preventDefault() is what REFUSES a drop in HTML5 drag and drop,
    // so the cursor says no while the board is still in the air rather than the
    // drop landing and quietly doing nothing. docs/Features/Board/Home.md
    if (isDragFromHome(evt)) return;
    const menuType = evt.currentTarget.getAttribute('data-type');
    // Remaining accepts board drags generally. Starred additionally accepts a
    // board from Remaining or an existing Workspace. Home and Archive have
    // their own handlers.
    if (
      menuType !== 'remaining'
      && !(menuType === 'starred' && isDragFromRemainingOrWorkspace(evt))
    ) return;
    evt.preventDefault();
    evt.stopPropagation();

    evt.originalEvent.dataTransfer.dropEffect = 'move';
    evt.currentTarget.classList.add('drag-over');
  },
  'dragleave .js-select-menu'(evt) {
    evt.currentTarget.classList.remove('drag-over');
  },
  // Drop a board on Boards in Archive to archive it. The three lists above it
  // and the workspaces tree are all places a board icon can be dragged FROM,
  // and this row is the fourth place in that column, so dragging onto it is the
  // gesture already in the reader's hand - the alternative is Multi-Selection,
  // which is three clicks to archive one board.
  //
  // Same shape as the drop on Remaining below: the same two dataTransfer keys,
  // one board id in `text/plain` or a JSON array when a multi-selection is
  // being dragged.
  'dragover .js-open-archived-board'(evt) {
    if (isDragFromHome(evt)) return;
    if (isArchivedMultiBoardDrag(evt)) return;
    evt.preventDefault();
    evt.stopPropagation();
    evt.originalEvent.dataTransfer.dropEffect = 'move';
    evt.currentTarget.classList.add('drag-over');
  },
  'dragleave .js-open-archived-board'(evt) {
    evt.currentTarget.classList.remove('drag-over');
  },
  'drop .js-open-archived-board'(evt) {
    if (isDragFromHome(evt)) return;
    if (isArchivedMultiBoardDrag(evt)) return;
    evt.preventDefault();
    evt.stopPropagation();
    evt.currentTarget.classList.remove('drag-over');

    const boardData = evt.originalEvent.dataTransfer.getData('text/plain');
    if (!boardData) return;
    const isMultiBoard = evt.originalEvent.dataTransfer.getData(
      'application/x-board-multi',
    );

    let boardIds = [boardData];
    if (isMultiBoard) {
      try {
        boardIds = JSON.parse(boardData);
      } catch (e) {
        return;
      }
    }
    if (!boardIds.length) return;

    // Asked before doing, exactly as the Multi-Selection button asks. Archiving
    // takes a board off every one of these lists at once, and a drop is easy to
    // make by accident - a board dragged to reorder that lands one row low.
    if (!confirm(TAPi18n.__('archive-board-confirm'))) return;

    boardIds.forEach((boardId) => {
      Meteor.call('archiveBoard', boardId, (err) => {
        if (err) alert(err?.reason || err?.message || 'Failed to archive board');
      });
    });
    // The dragged boards are gone from this page, so a selection of them is
    // meaningless now.
    if (isMultiBoard) BoardMultiSelection.reset();
    // ...and the archive is that many boards bigger. The count comes from a
    // method call, which is not a reactive source, so it has to be asked again.
    const tpl = Template.instance();
    if (tpl && tpl.refreshArchivedBoardsCount) tpl.refreshArchivedBoardsCount();
  },
  // Unstar a bookmark from its own tile. The star in the header bar stars the
  // page you are ON, so a bookmark for somewhere else has no other way off the
  // list - going to the page just to unstar it is a trip for nothing.
  'click .js-unstar-bookmark'(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    const li = evt.currentTarget.closest('.js-bookmark');
    const url = li && li.getAttribute('data-url');
    if (!url) return;
    Meteor.call('toggleStarredPage', url, '', (err) => {
      if (err) console.error(err);
    });
  },

  // Reordering the bookmarks. The order is the reader's, and it is ONE order:
  // these tiles and the header dropdown's rows are two views of the same array,
  // so a tile dragged past another rearranges the menu too.
  //
  // Its own dataTransfer type, so a bookmark and a board cannot be dropped on
  // each other: they are different things, and a board dropped between two
  // bookmarks has no meaning to give it.
  'dragstart .js-bookmark'(evt) {
    const url = evt.currentTarget.getAttribute('data-url');
    if (!url) return;
    try {
      evt.originalEvent.dataTransfer.setData(BOOKMARK_DRAG, url);
      evt.originalEvent.dataTransfer.effectAllowed = 'move';
    } catch (e) {}
  },
  'dragover .js-bookmark'(evt) {
    if (!isBookmarkDrag(evt)) return;
    evt.preventDefault();
    evt.stopPropagation();
    evt.originalEvent.dataTransfer.dropEffect = 'move';
    evt.currentTarget.classList.add('bookmark-reorder-over');
  },
  'dragleave .js-bookmark'(evt) {
    evt.currentTarget.classList.remove('bookmark-reorder-over');
  },
  'dragend .js-bookmark'(evt) {
    document.querySelectorAll('.bookmark-reorder-over').forEach((el) =>
      el.classList.remove('bookmark-reorder-over'));
  },
  'drop .js-bookmark'(evt) {
    if (!isBookmarkDrag(evt)) return;
    evt.preventDefault();
    evt.stopPropagation();
    evt.currentTarget.classList.remove('bookmark-reorder-over');

    let url = '';
    try {
      url = evt.originalEvent.dataTransfer.getData(BOOKMARK_DRAG);
    } catch (e) {
      return;
    }
    const before = evt.currentTarget.getAttribute('data-url');
    if (!url || !before || url === before) return;
    Meteor.call('moveStarredPage', url, before, (err) => {
      if (err) console.error(err);
    });
  },

  // The Remove target: drop a board here to take it off Home.
  //
  // The launcher gesture - drag the icon to the bar that appeared at the top,
  // and the shortcut goes, while the app itself stays in the drawer. Here the
  // board stays in Remaining, or in its workspace, and only stops being the
  // board that opens after login.
  //
  // It is the ONLY place a board dragged out of Home may land: every other
  // target refuses the drop (see the isDragFromHome guards). One gesture, one
  // destination, and the destination is the thing that says what will happen.
  'dragover .js-home-remove'(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    evt.originalEvent.dataTransfer.dropEffect = 'move';
    evt.currentTarget.classList.add('is-over');
  },
  'dragleave .js-home-remove'(evt) {
    evt.currentTarget.classList.remove('is-over');
  },
  'drop .js-home-remove'(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    evt.currentTarget.classList.remove('is-over');
    draggingFromHome.set(false);

    const boardData = evt.originalEvent.dataTransfer.getData('text/plain');
    if (!boardData) return;
    const isMultiBoard = evt.originalEvent.dataTransfer.getData(
      'application/x-board-multi',
    );
    let boardIds = [boardData];
    if (isMultiBoard) {
      try {
        boardIds = JSON.parse(boardData);
      } catch (e) {
        return;
      }
    }
    if (!boardIds.length) return;

    // Asked before doing, the same way the drop on the Archive asks: a drop is
    // easy to make by accident, and the sentence says the board itself is not
    // going anywhere - which is the whole question a reader has when they see a
    // trash can under a board they care about.
    if (!confirm(TAPi18n.__('home-board-remove-confirm'))) return;

    boardIds.forEach((boardId) => {
      Meteor.call('clearDefaultBoard', boardId, (err) => {
        if (err) alert(err?.reason || err?.message || 'Failed to remove from Home');
      });
    });
    if (isMultiBoard) BoardMultiSelection.reset();
  },
  // Drop a board on Home to make it the board that opens after login. The row
  // is the fifth place in this column a board icon can be dragged onto, so the
  // gesture is the one already in the reader's hand; the alternative is
  // Multi-Selection, which is three clicks to set one board.
  //
  // Home holds ONE board, so a drop REPLACES whatever was there - there is no
  // "already at Home, so take it off again" here. That is what makes the drop
  // predictable: you drop a board on Home and that board is Home, whatever was
  // there before. Taking a board off Home is the opposite gesture - dragging it
  // out of the Home section - and clicking the row's Multi-Selection toggle
  // still toggles. docs/Features/Board/Home.md
  'dragover .js-home-menu'(evt) {
    if (isArchivedMultiBoardDrag(evt)) return;
    evt.preventDefault();
    evt.stopPropagation();
    evt.originalEvent.dataTransfer.dropEffect = 'link';
    evt.currentTarget.classList.add('drag-over');
  },
  'dragleave .js-home-menu'(evt) {
    evt.currentTarget.classList.remove('drag-over');
  },
  'drop .js-home-menu'(evt) {
    if (isArchivedMultiBoardDrag(evt)) return;
    evt.preventDefault();
    evt.stopPropagation();
    evt.currentTarget.classList.remove('drag-over');

    const boardData = evt.originalEvent.dataTransfer.getData('text/plain');
    if (!boardData) return;
    const isMultiBoard = evt.originalEvent.dataTransfer.getData(
      'application/x-board-multi',
    );

    let boardIds = [boardData];
    if (isMultiBoard) {
      try {
        boardIds = JSON.parse(boardData);
      } catch (e) {
        return;
      }
    }
    if (boardIds.length !== 1) {
      alert(TAPi18n.__('select-only-one-board'));
      return;
    }

    // Login can open one Home board. A multi-selection therefore cannot
    // silently choose its first id; it has to be narrowed to one before this
    // drop can change anything.
    Meteor.call('setDefaultBoard', boardIds[0], (err) => {
      if (err) alert(err?.reason || err?.message || 'Failed to set Home board');
    });
    if (isMultiBoard) BoardMultiSelection.reset();
  },
  'drop .js-select-menu'(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    const menuType = evt.currentTarget.getAttribute('data-type');
    evt.currentTarget.classList.remove('drag-over');

    // Home has its own handler.
    if (menuType === 'home') return;
    // Belt and braces: dragover already refused this drop by not calling
    // preventDefault, so it should never arrive.
    if (isDragFromHome(evt)) return;

    const isMultiBoard = evt.originalEvent.dataTransfer.getData(
      'application/x-board-multi',
    );
    const boardData =
      evt.originalEvent.dataTransfer.getData('text/plain');

    if (!boardData) return;

    let boardIds = [boardData];
    if (isMultiBoard) {
      try {
        boardIds = JSON.parse(boardData);
      } catch (e) {
        return;
      }
    }

    if (menuType === 'starred') {
      if (!isDragFromRemainingOrWorkspace(evt)) return;
      const user = ReactiveCache.getCurrentUser();
      boardIds.forEach((boardId) => {
        if (!user || !user.hasStarred(boardId)) {
          Meteor.call('toggleBoardStar', boardId);
        }
      });
      return;
    }

    // Everything below is what a drop on REMAINING means.
    if (menuType !== 'remaining') return;

    boardIds.forEach((boardId) => {
      // Dropping an ARCHIVED board on Remaining brings it back. That is what
      // Remaining means - the boards that are not in a workspace and not
      // archived - so dragging one there is the same gesture as dragging it out
      // of a workspace, and it is how a whole multi-selection comes back at
      // once instead of one board at a time through its own menu.
      const board = ReactiveCache.getBoard(boardId);
      if (board && board.archived) {
        Meteor.call('restoreBoard', boardId, (err) => {
          if (err) alert(err?.reason || err?.message || 'Failed to restore board');
        });
      }
      // ...and out of whatever workspace it was in, which is the other half of
      // what Remaining means. Harmless for a board that was in none.
      Meteor.call('unassignBoardFromWorkspace', boardId);
    });
    if (isMultiBoard) BoardMultiSelection.reset();
    const tpl = Template.instance();
    if (tpl && tpl.refreshArchivedBoardsCount) tpl.refreshArchivedBoardsCount();
  },
});

// #5799: All Boards sort popup — pick custom (manual drag order) or
// alphabetical A→Z / Z→A. The choice is stored per user.
Template.boardsSortPopup.helpers({
  isBoardsSort(mode) {
    const currentUser = ReactiveCache.getCurrentUser();
    const current =
      currentUser && typeof currentUser.getAllBoardsSortBy === 'function'
        ? currentUser.getAllBoardsSortBy()
        : 'custom';
    return current === mode;
  },
});

Template.boardsSortPopup.events({
  'click .js-boards-sort'(evt) {
    evt.preventDefault();
    const mode = evt.currentTarget.getAttribute('data-sort');
    if (mode) {
      Meteor.call('setAllBoardsSortBy', mode);
    }
    Popup.back();
  },
});

Template.workspaceActionsPopup.helpers({
  workspaceName() {
    return this.name || '';
  },
  workspaceIcon() {
    return this.icon || DEFAULT_WORKSPACE_ICON;
  },
});

Template.addWorkspacePopup.events({
  'submit .js-add-workspace-form'(evt) {
    evt.preventDefault();
    const input = evt.currentTarget.querySelector('.js-new-workspace-name');
    const name = (input && input.value ? input.value : '').trim();
    if (!name) {
      // Nothing typed: keep the popup open and the field focused rather than
      // silently closing, which is what a cancelled prompt() used to look like.
      if (input) input.focus();
      return;
    }
    Meteor.call('createWorkspace', { parentId: null, name }, err => {
      if (err) console.error(err);
    });
    Popup.back();
  },
});

Template.workspaceActionsPopup.events({
  'submit .js-workspace-actions-form'(evt) {
    evt.preventDefault();
    const workspaceId = evt.currentTarget.getAttribute('data-id');
    const name = evt.currentTarget.querySelector('.js-workspace-name').value;
    const icon = evt.currentTarget.querySelector('.js-workspace-icon').value;
    saveWorkspace(workspaceId, { name, icon });
    Popup.back();
  },
  'submit .js-workspace-subspace-form'(evt) {
    evt.preventDefault();
    const workspaceId = evt.currentTarget.getAttribute('data-id');
    const name = evt.currentTarget.querySelector('.js-subworkspace-name').value;
    addSubworkspace(workspaceId, name);
    Popup.back();
  },
  'click .js-delete-workspace'(evt, tpl) {
    evt.preventDefault();
    if (!confirm(TAPi18n.__('allboards.delete-workspace-confirm') || 'Delete this workspace and return its boards to Remaining?')) {
      return;
    }
    const workspaceId =
      (tpl.data && (tpl.data.id || tpl.data._id)) ||
      evt.currentTarget.getAttribute('data-id');
    if (!workspaceId) return;
    tpl.$('.js-delete-workspace').prop('disabled', true);
    Meteor.call('deleteWorkspace', workspaceId, (err) => {
      tpl.$('.js-delete-workspace').prop('disabled', false);
      if (err) {
        tpl.$('.js-workspace-delete-error').text(TAPi18n.__(err.reason || 'delete-workspace-failed'));
        return;
      }
      Popup.back();
    });
  },
});

Template.workspaceActionsPopup.onRendered(function() {
  this.$('.js-workspace-delete-error').text('');
});



// The All Boards view menu, in the FIRST header bar. Its handler and the helper
// that draws it follow it out of the sidebar. docs/Features/Page/Header.md
Template.allBoardsViewMenu.events({
  // Titled, so it has a header with the close ✕ in it - the same popup the
  // BOARD's view menu opens, and it is the same question: which view of this
  // page do you want. A popup with no title renders no header at all, so this
  // one had no way out but clicking off it.
  //
  // `boardChangeViewPopup-title` is the board's own key - "Board View", already
  // translated in every language - rather than an `allBoardsViewPopup-title`
  // that would say the same words in a second key nobody has translated yet.
  'click .js-open-all-boards-view': Popup.open('allBoardsView', {
    titleKey: 'boardChangeViewPopup-title',
  }),
});

Template.allBoardsViewMenu.helpers({
  isAllBoardsView(view) {
    return isAllBoardsView(view);
  },
});
