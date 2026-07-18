import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import getSlug from 'limax';
import TableVisibilityModeSettings from '/models/tableVisibilityModeSettings';
import { BoardMultiSelection } from '/client/lib/boardMultiSelection';
import { EscapeActions } from '/client/lib/escapeActions';
import { Utils } from '/client/lib/utils';
import {
  isDragReorderEnabled,
  computeReorderedSortIndex,
} from '/models/lib/boardSortReorder';

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

const DEFAULT_WORKSPACE_ICON = '📁';

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

Template.boardList.helpers({
  BoardMultiSelection() {
    return BoardMultiSelection;
  },
});

Template.boardListHeaderBar.events({
  'click .js-open-archived-board'() {
    Modal.open('archivedBoards');
  },
});

Template.boardList.events({});

Template.boardListHeaderBar.helpers({
  title() {
    //if (FlowRouter.getRouteName() === 'template-container') {
    //  return 'template-container';
    //} else {
    return FlowRouter.getRouteName() === 'home' ? 'my-boards' : 'public';
    //}
  },
  templatesBoardId() {
    return ReactiveCache.getCurrentUser()?.getTemplatesBoardId();
  },
  templatesBoardSlug() {
    return ReactiveCache.getCurrentUser()?.getTemplatesBoardSlug();
  },
});

Template.boardList.onCreated(function () {
  Meteor.subscribe('setting');
  Meteor.subscribe('tableVisibilityModeSettings');
  // Honor the URL-addressable sub-view (#5850). The route sets
  // Session 'boardListMenu' to 'starred', 'templates' or 'remaining'.
  this.selectedMenu = new ReactiveVar(Session.get('boardListMenu') || 'starred');
  this.selectedWorkspaceIdVar = new ReactiveVar(null);
  this.workspacesTreeVar = new ReactiveVar([]);
  // #5799: free-text search by board name. When non-empty it searches across
  // ALL the user's boards (Starred, Templates, Remaining and every workspace),
  // ignoring the selected-menu filter.
  this.boardSearchVar = new ReactiveVar('');
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

  this.reorderWorkspaces = (draggedSpaceId, targetSpaceId) => {
    const tree = this.workspacesTreeVar.get();

    // Helper to remove a space from tree
    const removeSpace = (nodes, id) => {
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === id) {
          const removed = nodes.splice(i, 1)[0];
          return { tree: nodes, removed };
        }
        if (nodes[i].children) {
          const result = removeSpace(nodes[i].children, id);
          if (result.removed) {
            return { tree: nodes, removed: result.removed };
          }
        }
      }
      return { tree: nodes, removed: null };
    };

    // Helper to insert a space after target
    const insertAfter = (nodes, targetId, spaceToInsert) => {
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === targetId) {
          nodes.splice(i + 1, 0, spaceToInsert);
          return true;
        }
        if (nodes[i].children) {
          if (insertAfter(nodes[i].children, targetId, spaceToInsert)) {
            return true;
          }
        }
      }
      return false;
    };

    // Clone the tree
    const newTree = EJSON.clone(tree);

    // Remove the dragged space
    const { tree: treeAfterRemoval, removed } = removeSpace(
      newTree,
      draggedSpaceId,
    );

    if (removed) {
      // Insert after target
      insertAfter(treeAfterRemoval, targetSpaceId, removed);

      // Save the new tree
      Meteor.call('setWorkspacesTree', treeAfterRemoval, (err) => {
        if (err) console.error(err);
      });
    }
  };

  // Load workspaces tree reactively; reset selection if selected workspace was deleted
  this.autorun(() => {
    const u = ReactiveCache.getCurrentUser();
    const tree = (u && u.profile && u.profile.boardWorkspacesTree) || [];
    this.workspacesTreeVar.set(tree);
    const sel = this.selectedMenu.get();
    if (sel && sel !== 'starred' && sel !== 'templates' && sel !== 'remaining') {
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
  currentMenuPath() {
    try {
      const tpl = Template.instance();
      const selectedMenuVar = tpl.selectedMenu;
      if (!selectedMenuVar || typeof selectedMenuVar.get !== 'function') {
        return { icon: '🗂️', text: 'Workspaces' };
      }
      const sel = selectedMenuVar.get();
      const currentUser = ReactiveCache.getCurrentUser();

      // Helper function to safely get translation or fallback
      const safeTranslate = (key, fallback) => {
        try {
          return TAPi18n.__(key) || fallback;
        } catch (e) {
          return fallback;
        }
      };

      // Helper to find space by id in tree
      const findSpaceById = (nodes, targetId, path = []) => {
        if (!nodes || !Array.isArray(nodes)) return null;
        for (const node of nodes) {
          if (node.id === targetId) {
            return [...path, node];
          }
          if (node.children && node.children.length > 0) {
            const result = findSpaceById(node.children, targetId, [
              ...path,
              node,
            ]);
            if (result) return result;
          }
        }
        return null;
      };

      if (sel === 'starred') {
        return { icon: '⭐', text: safeTranslate('allboards.starred', 'Starred') };
      } else if (sel === 'templates') {
        return { icon: '📋', text: safeTranslate('allboards.templates', 'Templates') };
      } else if (sel === 'remaining') {
        return { icon: '📂', text: safeTranslate('allboards.remaining', 'Remaining') };
      } else {
        // sel is a workspaceId, build path
        if (!tpl.workspacesTreeVar || typeof tpl.workspacesTreeVar.get !== 'function') {
          return { icon: '🗂️', text: safeTranslate('allboards.workspaces', 'Workspaces') };
        }
        const tree = tpl.workspacesTreeVar.get();
        const spacePath = findSpaceById(tree, sel);
        if (spacePath && spacePath.length > 0) {
          const pathText = spacePath.map((s) => s.name).join(' / ');
          return {
            icon: '🗂️',
            text: `${safeTranslate('allboards.workspaces', 'Workspaces')} / ${pathText}`,
          };
        }
        return { icon: '🗂️', text: safeTranslate('allboards.workspaces', 'Workspaces') };
      }
    } catch (error) {
      console.error('Error in currentMenuPath:', error);
      return { icon: '🗂️', text: 'Workspaces' };
    }
  },
  boards() {
    const tpl = Template.instance();
    let query = {
      $and: [
        { archived: false },
        { type: { $in: ['board', 'template-container'] } },
        { title: { $not: { $regex: /^\^.*\^$/ } } },
      ],
    };
    const membershipOrs = [];

    let allowPrivateVisibilityOnly = TableVisibilityModeSettings.findOne(
      'tableVisibilityMode-allowPrivateOnly',
    );

    // #5850: the All Boards sub-views are also reachable via their own routes
    // (/templates, /remaining), which must apply the same membership filtering
    // as the home route, otherwise their board list is empty (or falls into the
    // public-only branch below).
    const allBoardsRoutes = ['home', 'allboards-templates', 'allboards-remaining'];
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
        { title: { $not: { $regex: /^\^.*\^$/ } } },
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
    }
    return 0;
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
        { title: { $not: { $regex: /^\^.*\^$/ } } },
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
        { title: { $not: { $regex: /^\^.*\^$/ } } },
      ],
    };
    const allBoards = ReactiveCache.getBoards(query, {});

    return allBoards.filter((b) => assignments[b._id] === workspaceId).length;
  },
});

Template.boardList.events({
  'click .js-select-menu'(evt, tpl) {
    const type = evt.currentTarget.getAttribute('data-type');
    tpl.selectedWorkspaceIdVar.set(null);
    tpl.selectedMenu.set(type);
  },
  'click .js-select-workspace'(evt, tpl) {
    const id = evt.currentTarget.getAttribute('data-id');
    tpl.selectedWorkspaceIdVar.set(id);
    tpl.selectedMenu.set(id);
  },
  'click .js-open-workspace-menu': Popup.open('workspaceActions'),
  'click .js-add-workspace'(evt, tpl) {
    evt.preventDefault();
    const name = prompt(
      TAPi18n.__('allboards.add-workspace-prompt') || 'New Space name',
    );
    if (name && name.trim()) {
      Meteor.call(
        'createWorkspace',
        { parentId: null, name: name.trim() },
        (err, res) => {
          if (err) console.error(err);
        },
      );
    }
  },
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
  'click .js-open-boards-sort': Popup.open('boardsSort'),
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
  // "Selected:" star action: star every multi-selected board that isn't yet
  // starred (so it becomes Starred, never toggled back off by this button).
  'click .js-star-selected'(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    const user = ReactiveCache.getCurrentUser();
    BoardMultiSelection.getSelectedBoardIds().forEach((id) => {
      if (user && !user.hasStarred(id)) {
        Meteor.call('toggleBoardStar', id);
      }
    });
  },
  // #2220 "Selected:" home action: set the first selected board as the Home
  // board (opened after login). Clicking it again when it is already Home clears
  // it (toggle), matching toggleDefaultBoard.
  'click .js-home-selected'(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    const ids = BoardMultiSelection.getSelectedBoardIds();
    if (ids.length) {
      Meteor.call('toggleDefaultBoard', ids[0]);
    }
  },
  // HTML5 DnD from boards to spaces
  // #5850: drag a (template) board onto an Org/Team/Domain target to share it.
  'dragover .js-share-target'(evt) {
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
  'dragstart .js-board'(evt) {
    const boardId = this._id;

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
    }
    // Highlight valid drop targets in the sidebar so users know where to drop
    document.querySelectorAll('.workspace-node').forEach((el) => {
      el.classList.add('board-drag-hint');
    });
    document.querySelectorAll('.js-select-menu').forEach((el) => {
      if (el.getAttribute('data-type') === 'remaining') {
        el.classList.add('board-drag-hint');
      }
    });
  },
  'dragend .js-board'() {
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
  'dragover .js-board'(evt, tpl) {
    if (!isDragReorderEnabled(currentAllBoardsSortBy())) return;
    // A multi-board drag is a share/assign gesture, not a reorder.
    const dt = evt.originalEvent.dataTransfer;
    if (dt && dt.getData('application/x-board-multi') === 'true') return;
    evt.preventDefault();
    evt.stopPropagation();
    if (dt) dt.dropEffect = 'move';
    evt.currentTarget.classList.add('board-reorder-over');
  },
  'dragleave .js-board'(evt) {
    evt.currentTarget.classList.remove('board-reorder-over');
  },
  'drop .js-board'(evt, tpl) {
    if (!isDragReorderEnabled(currentAllBoardsSortBy())) return;
    const dt = evt.originalEvent.dataTransfer;
    if (dt && dt.getData('application/x-board-multi') === 'true') return;
    const draggedId = dt ? dt.getData('text/plain') : '';
    if (!draggedId) return;
    evt.preventDefault();
    evt.stopPropagation();
    evt.currentTarget.classList.remove('board-reorder-over');
    const targetId = this._id;
    // #6442: current display order of the board grid. Read each board's _id from
    // its Blaze data context (the same source dragstart uses via `this._id`) —
    // NOT el.classList[0]. On `li.js-board(class="{{_id}} …")` Jade emits the
    // literal `js-board` class FIRST, so classList[0] is the string "js-board"
    // for every board; the old code therefore produced ['js-board','js-board',…],
    // computeReorderedSortIndex could not find the dragged/target ids among them,
    // returned null, and the drop silently did nothing (board snapped back).
    const orderedIds = Array.from(tpl.findAll('.js-board'))
      .map((el) => Blaze.getData(el)?._id)
      .filter(Boolean);
    const mapping = computeReorderedSortIndex(orderedIds, draggedId, targetId);
    if (!mapping) return;
    const currentUser = ReactiveCache.getCurrentUser();
    if (currentUser && typeof currentUser.setBoardSortIndexes === 'function') {
      currentUser.setBoardSortIndexes(mapping);
    }
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
    } else {
      BoardMultiSelection.activate();
    }
  },
  'click .js-multiselection-reset'(evt) {
    evt.preventDefault();
    // The reset X is now nested inside the activate button (matching the Swimlanes
    // view), so stop the click from bubbling to js-multiselection-activate — which
    // would otherwise immediately re-activate what we just disabled.
    evt.stopPropagation();
    BoardMultiSelection.disable();
  },
  'click .js-toggle-board-multi-selection'(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    const boardId = this._id;
    BoardMultiSelection.toogle(boardId);
  },
  'click .js-archive-selected-boards'(evt) {
    evt.preventDefault();
    const selectedBoards = BoardMultiSelection.getSelectedBoardIds();
    if (
      selectedBoards.length > 0 &&
      confirm(TAPi18n.__('archive-board-confirm'))
    ) {
      selectedBoards.forEach((boardId) => {
        Meteor.call('archiveBoard', boardId, (err) => {
          if (err) alert(err?.reason || err?.message || 'Failed to archive board');
        });
      });
      BoardMultiSelection.reset();
    }
  },
  'click .js-duplicate-selected-boards'(evt) {
    evt.preventDefault();
    const selectedBoards = BoardMultiSelection.getSelectedBoardIds();
    if (
      selectedBoards.length > 0 &&
      confirm(TAPi18n.__('duplicate-board-confirm'))
    ) {
      selectedBoards.forEach((boardId) => {
        const board = ReactiveCache.getBoard(boardId);
        if (board) {
          Meteor.call(
            'copyBoard',
            boardId,
            {
              sort: ReactiveCache.getBoards({ archived: false }).length,
              type: 'board',
              title: board.title,
            },
            (err, res) => {
              if (err) console.error(err);
            },
          );
        }
      });
      BoardMultiSelection.reset();
    }
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
    const workspaceId =
      evt.currentTarget.getAttribute('data-workspace-id');
    evt.originalEvent.dataTransfer.effectAllowed = 'move';
    evt.originalEvent.dataTransfer.setData(
      'application/x-workspace-id',
      workspaceId,
    );

    // Create a better drag image
    const dragImage = evt.currentTarget.cloneNode(true);
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-9999px';
    dragImage.style.opacity = '0.8';
    document.body.appendChild(dragImage);
    evt.originalEvent.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);

    evt.currentTarget.classList.add('dragging');
  },
  'dragend .workspace-node'(evt) {
    evt.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.workspace-node').forEach((el) => {
      el.classList.remove('drag-over');
    });
  },
  'dragover .workspace-node'(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    const draggingEl = document.querySelector('.workspace-node.dragging');
    const targetEl = evt.currentTarget;

    // Allow dropping boards on any space
    // Or allow dropping spaces on other spaces (but not on itself or descendants)
    if (
      !draggingEl ||
      (targetEl !== draggingEl && !draggingEl.contains(targetEl))
    ) {
      evt.originalEvent.dataTransfer.dropEffect = 'move';
      targetEl.classList.add('drag-over');
    }
  },
  'dragleave .workspace-node'(evt) {
    evt.currentTarget.classList.remove('drag-over');
  },
  'drop .workspace-node'(evt, tpl) {
    evt.preventDefault();
    evt.stopPropagation();

    const targetEl = evt.currentTarget;
    targetEl.classList.remove('drag-over');

    // Check what's being dropped - board or workspace
    const draggedWorkspaceId = evt.originalEvent.dataTransfer.getData(
      'application/x-workspace-id',
    );
    const isMultiBoard = evt.originalEvent.dataTransfer.getData(
      'application/x-board-multi',
    );
    const boardData =
      evt.originalEvent.dataTransfer.getData('text/plain');

    if (draggedWorkspaceId && !boardData) {
      // This is a workspace reorder operation
      const targetWorkspaceId =
        targetEl.getAttribute('data-workspace-id');

      if (draggedWorkspaceId !== targetWorkspaceId) {
        tpl.reorderWorkspaces(draggedWorkspaceId, targetWorkspaceId);
      }
    } else if (boardData) {
      // This is a board assignment operation
      // Get the workspace ID directly from the dropped workspace-node's data-workspace-id attribute
      const workspaceId = targetEl.getAttribute('data-workspace-id');

      if (workspaceId) {
        if (isMultiBoard) {
          // Multi-board drag
          try {
            const boardIds = JSON.parse(boardData);
            boardIds.forEach((boardId) => {
              Meteor.call('assignBoardToWorkspace', boardId, workspaceId);
            });
          } catch (e) {
            // Error parsing multi-board data
          }
        } else {
          // Single board drag
          Meteor.call('assignBoardToWorkspace', boardData, workspaceId);
        }
      }
    }
  },
  'dragover .js-select-menu'(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    const menuType = evt.currentTarget.getAttribute('data-type');
    // Only allow drop on "remaining" menu to unassign boards from spaces
    if (menuType === 'remaining') {
      evt.originalEvent.dataTransfer.dropEffect = 'move';
      evt.currentTarget.classList.add('drag-over');
    }
  },
  'dragleave .js-select-menu'(evt) {
    evt.currentTarget.classList.remove('drag-over');
  },
  'drop .js-select-menu'(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    const menuType = evt.currentTarget.getAttribute('data-type');
    evt.currentTarget.classList.remove('drag-over');

    // Only handle drops on "remaining" menu
    if (menuType !== 'remaining') return;

    const isMultiBoard = evt.originalEvent.dataTransfer.getData(
      'application/x-board-multi',
    );
    const boardData =
      evt.originalEvent.dataTransfer.getData('text/plain');

    if (boardData) {
      if (isMultiBoard) {
        // Multi-board drag - unassign all from workspaces
        try {
          const boardIds = JSON.parse(boardData);
          boardIds.forEach((boardId) => {
            Meteor.call('unassignBoardFromWorkspace', boardId);
          });
        } catch (e) {
          // Error parsing multi-board data
        }
      } else {
        // Single board drag - unassign from workspace
        Meteor.call('unassignBoardFromWorkspace', boardData);
      }
    }
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


