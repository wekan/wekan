// This is the publication used to display the board list. We publish all the
// non-archived boards:
// 1. that the user is a member of
// 2. the user has starred
import { ReactiveCache } from '/imports/reactiveCache';
import { publishComposite } from 'meteor/reywood:publish-composite';
import { findWhere } from '/imports/lib/collectionHelpers';
import Users from "../../models/users";
import Org from "../../models/org";
import Team from "../../models/team";
import Attachments from '../../models/attachments';
import Boards from '/models/boards';
import Cards from '/models/cards';
import { localizeBoardMemberAvatars } from '/server/lib/localizeAvatar';
import { collectAncestorIds } from '/server/lib/subtaskAncestors';
import {
  showsCardCounterList,
  countCardsByListId,
  buildBoardTileData,
} from '/models/lib/boardTileData';
const {
  effectiveBoardCardsMode,
  DEFAULT_LAZY_THRESHOLD,
} = require('/models/lib/cardsLoading');

// Card-loading mode (Admin Panel / Features): 'all' ships every card/checklist to
// minimongo; 'lazy' ships none (each list loads its visible window via the
// `boardCardsWindow` publication); 'auto' (default) decides PER BOARD by size (big
// boards lazy, small boards eager). See models/lib/cardsLoading.js.
const globalCardsMode = () =>
  (Meteor.settings.public && Meteor.settings.public.cardsLoading) || 'auto';
const globalLazyThreshold = () => {
  const n = Number(Meteor.settings.public && Meteor.settings.public.cardsLoadingLazyThreshold);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_LAZY_THRESHOLD;
};

publishComposite('boards', function() {
  const userId = this.userId;
  // Ensure that the user is connected. If it is not, we need to return an empty
  // array to tell the client to remove the previously published docs.
  if (!Match.test(userId, String) || !userId) {
    return [];
  }

  return {
    async find() {
      // Publish a *live* cursor matching the boards the user can see, rather
      // than a one-time snapshot of ids (`_id: { $in: [...] }`). A snapshot
      // never picks up boards created after the client subscribes (e.g. a
      // background Trello import), so they only appeared after a page reload.
      // This selector mirrors Boards.userBoards(): a board the user becomes a
      // member of is matched and streamed automatically.
      const user = await ReactiveCache.getUser(userId);
      if (!user) {
        return [];
      }
      const selector = {
        archived: false,
        // #5850: also publish the user's template boards (template-container) so
        // the All Boards / Templates view can list them; the client filters by
        // type per sub-view.
        type: { $in: ['board', 'template-container'] },
        $or: [
          { permission: 'public' },
          { members: { $elemMatch: { userId, isActive: true } } },
          { orgs: { $elemMatch: { orgId: { $in: user.orgIds() }, isActive: true } } },
          { teams: { $elemMatch: { teamId: { $in: user.teamIds() }, isActive: true } } },
          // #5850: domain-based board sharing.
          { domains: { $elemMatch: { domain: { $in: user.emailDomains() }, isActive: true } } },
        ],
      };
      return await ReactiveCache.getBoards(
        selector,
        {
          sort: { sort: 1 /* boards default sorting */ },
        },
        true,
      );
    },
    children: [
      {
        async find(board) {
          // Publish lists with extended fields for proper sync
          // Including swimlaneId, modifiedAt, and _updatedAt for list order changes
          return await ReactiveCache.getLists(
            { boardId: board._id, archived: false },
            {
              fields: {
                _id: 1,
                title: 1,
                boardId: 1,
                swimlaneId: 1,
                archived: 1,
                sort: 1,
                color: 1,
                modifiedAt: 1,
                _updatedAt: 1,  // Hidden field to trigger updates
              }
            },
            true,
          );
        }
      },
      {
        async find(board) {
          return await ReactiveCache.getCards(
            { boardId: board._id, archived: false },
            {
              fields: {
                _id: 1,
                boardId: 1,
                listId: 1,
                archived: 1,
                sort: 1
              }
            },
            true,
          );
        }
      }
    ]
  };
});

Meteor.publish('boardsReport', async function(searchTerm = '', limit, skip = 0) {
  check(searchTerm, Match.OneOf(String, null, undefined));
  check(limit, Number);
  check(skip, Match.OneOf(Number, null, undefined));
  const userId = this.userId;
  // Ensure that the user is connected. If it is not, we need to return an empty
  // array to tell the client to remove the previously published docs.
  if (!Match.test(userId, String) || !userId) return [];

  const query = { _id: { $in: await Boards.userBoardIds(userId, null) } };
  if (searchTerm) {
    query.title = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }

  // Publish the page MANUALLY (fetch + this.added + this.ready): a returned sorted+
  // limited cursor triggers a LIMITED live observe that hangs on FerretDB's OpLog,
  // leaving the report stuck on the loading spinner (same as attachmentsList). The
  // report re-subscribes on every page/search change, so it needs no live cursor.
  const boards = await ReactiveCache.getBoards(
    query,
    {
      fields: {
        _id: 1,
        boardId: 1,
        archived: 1,
        slug: 1,
        title: 1,
        description: 1,
        color: 1,
        backgroundImageURL: 1,
        members: 1,
        orgs: 1,
        teams: 1,
        permission: 1,
        type: 1,
        sort: 1,
      },
      sort: { sort: 1 /* boards default sorting */ },
      limit,
      skip: skip || 0,
    },
    false,
  );

  const userIds = [];
  const orgIds = [];
  const teamIds = [];
  boards.forEach(board => {
    if (board.members) {
      board.members.forEach(member => {
        userIds.push(member.userId);
      });
    }
    if (board.orgs) {
      board.orgs.forEach(org => {
        orgIds.push(org.orgId);
      });
    }
    if (board.teams) {
      board.teams.forEach(team => {
        teamIds.push(team.teamId);
      });
    }
  })

  const users = await ReactiveCache.getUsers({ _id: { $in: userIds } }, { fields: Users.safeFields }, false);
  const teams = await ReactiveCache.getTeams({ _id: { $in: teamIds } }, {}, false);
  const orgs = await ReactiveCache.getOrgs({ _id: { $in: orgIds } }, {}, false);

  for (const doc of boards) { const { _id, ...fields } = doc; this.added('boards', _id, fields); }
  for (const doc of users) { const { _id, ...fields } = doc; this.added('users', _id, fields); }
  for (const doc of teams) { const { _id, ...fields } = doc; this.added('team', _id, fields); }
  for (const doc of orgs) { const { _id, ...fields } = doc; this.added('org', _id, fields); }
  this.ready();
});

Meteor.methods({
  async getBoardsReportCount(searchTerm = '') {
    check(searchTerm, Match.OneOf(String, null, undefined));
    const user = await ReactiveCache.getCurrentUser();
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized');
    }
    const query = { _id: { $in: await Boards.userBoardIds(this.userId, null) } };
    if (searchTerm) {
      query.title = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }
    const cursor = await ReactiveCache.getBoards(query, {}, true);
    return typeof cursor.countAsync === 'function' ? await cursor.countAsync() : cursor.count();
  },

  // #5799: compute one page of the current user's All Boards grid on the server,
  // so the client can render only the current page of board icons instead of all
  // of them. Returns the ordered board ids for the page plus the total count for
  // the active filter. Visibility, menu/workspace filtering, search and sort are
  // all resolved here against the *effective* current user — so it also works
  // when a GlobalAdmin impersonates a user (impersonate() calls this.setUserId(),
  // so this.userId / getCurrentUser() are the impersonated user).
  async getAllBoardsPage(params) {
    check(params, {
      search: Match.Optional(String),
      sortBy: Match.Optional(String),
      menu: Match.Optional(String),
      page: Match.Optional(Number),
      perPage: Match.Optional(Number),
    });

    const userId = this.userId;
    if (!Match.test(userId, String) || !userId) {
      return { ids: [], total: 0 };
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user) {
      return { ids: [], total: 0 };
    }

    const perPage = Math.min(200, Math.max(1, params.perPage || 25));
    const page = Math.max(1, params.page || 1);
    const search = (params.search || '').trim();
    const sortBy = ['title-asc', 'title-desc'].includes(params.sortBy)
      ? params.sortBy
      : 'title-asc';
    const menu = params.menu || 'remaining';

    // Same visibility selector as the live `boards` publication.
    const selector = {
      archived: false,
      type: { $in: ['board', 'template-container'] },
      $or: [
        { permission: 'public' },
        { members: { $elemMatch: { userId, isActive: true } } },
        { orgs: { $elemMatch: { orgId: { $in: user.orgIds() }, isActive: true } } },
        { teams: { $elemMatch: { teamId: { $in: user.teamIds() }, isActive: true } } },
        { domains: { $elemMatch: { domain: { $in: user.emailDomains() }, isActive: true } } },
      ],
    };
    if (search) {
      selector.title = new RegExp(
        search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i',
      );
    }

    // Lightweight fetch: only the fields needed to filter/sort/paginate. The
    // board icons themselves are rendered client-side from the live `boards`
    // subscription, keyed by the ids returned here.
    let boards = await ReactiveCache.getBoards(
      selector,
      { fields: { _id: 1, title: 1, type: 1 } },
      true,
    );
    boards = typeof boards.fetchAsync === 'function'
      ? await boards.fetchAsync()
      : (typeof boards.fetch === 'function' ? boards.fetch() : boards);

    // Menu / workspace filtering uses the user's profile maps. A search spans
    // every category, so it skips the menu filter (matching the client).
    const profile = user.profile || {};
    const assignments = profile.boardWorkspaceAssignments || {};
    const starred = profile.starredBoards || [];
    if (!search) {
      if (menu === 'starred') {
        boards = boards.filter(b => starred.includes(b._id));
      } else if (menu === 'templates') {
        boards = boards.filter(b => b.type === 'template-container');
      } else if (menu === 'remaining') {
        boards = boards.filter(
          b => !assignments[b._id] && b.type !== 'template-container',
        );
      } else {
        // menu is a workspace id
        boards = boards.filter(b => assignments[b._id] === menu);
      }
    }

    boards.sort((a, b) => {
      const cmp = (a.title || '').localeCompare(b.title || '', undefined, {
        sensitivity: 'base',
      });
      return sortBy === 'title-desc' ? -cmp : cmp;
    });

    const total = boards.length;
    const start = (page - 1) * perPage;
    const ids = boards.slice(start, start + perPage).map(b => b._id);
    return { ids, total };
  },

  // #5174 / #4825 (follow-up to #4214): the data behind the All Boards board
  // tiles — the per-list card-count line and the member avatar row. Computed
  // ONCE per request, entirely server-side (one boards query, one lists query,
  // one grouped card count), and returned as a plain map keyed by board id.
  // The client stores it in a ReactiveVar it sets exactly once, instead of the
  // old reactive getLists()/getCards() cursors inside the tile helpers that
  // caused the "icons random dance" (#4214) and were therefore stubbed out —
  // which in turn hid the counters/avatars for everyone.
  //
  // The per-board opt-in flags (allowsCardCounterList / allowsBoardMemberList,
  // board sidebar "Show at All Boards page") are resolved here with strict
  // semantics — missing flag means OFF — so every tile renders consistently
  // (#4825). The Admin Panel hideCardCounterList / hideBoardMemberList
  // settings remain enforced by the template on top of this.
  async getAllBoardsTileData() {
    const userId = this.userId;
    if (!Match.test(userId, String) || !userId) {
      return {};
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user) {
      return {};
    }

    // Same visibility selector as getAllBoardsPage / the `boards` publication,
    // restricted to real boards (template-container tiles never show these).
    const selector = {
      archived: false,
      type: 'board',
      $or: [
        { permission: 'public' },
        { members: { $elemMatch: { userId, isActive: true } } },
        { orgs: { $elemMatch: { orgId: { $in: user.orgIds() }, isActive: true } } },
        { teams: { $elemMatch: { teamId: { $in: user.teamIds() }, isActive: true } } },
        { domains: { $elemMatch: { domain: { $in: user.emailDomains() }, isActive: true } } },
      ],
    };

    let boards = await ReactiveCache.getBoards(
      selector,
      {
        fields: {
          _id: 1,
          members: 1,
          allowsCardCounterList: 1,
          allowsBoardMemberList: 1,
        },
      },
      true,
    );
    boards = typeof boards.fetchAsync === 'function'
      ? await boards.fetchAsync()
      : (typeof boards.fetch === 'function' ? boards.fetch() : boards);

    // Lists and card counts are only needed for boards that opted in to the
    // card-counter line.
    const countedBoardIds = boards
      .filter(board => showsCardCounterList(board))
      .map(board => board._id);

    let lists = [];
    const cardCounts = {};
    if (countedBoardIds.length) {
      lists = await ReactiveCache.getLists(
        { boardId: { $in: countedBoardIds }, archived: false },
        { fields: { _id: 1, boardId: 1, title: 1, sort: 1 } },
        true,
      );
      lists = typeof lists.fetchAsync === 'function'
        ? await lists.fetchAsync()
        : (typeof lists.fetch === 'function' ? lists.fetch() : lists);

      try {
        // One grouped count for all boards on the page instead of a count per
        // list (and instead of shipping every card to the client, which is
        // what the old reactive helpers effectively did).
        const rows = await Cards.rawCollection()
          .aggregate([
            { $match: { boardId: { $in: countedBoardIds }, archived: false } },
            { $group: { _id: '$listId', n: { $sum: 1 } } },
          ])
          .toArray();
        rows.forEach(row => {
          if (row && row._id) cardCounts[row._id] = row.n;
        });
      } catch (error) {
        // Aggregation may be unavailable on some storage backends; fall back
        // to fetching only the cards' listId and folding in memory.
        const cards = await Cards.find(
          { boardId: { $in: countedBoardIds }, archived: false },
          { fields: { listId: 1 } },
        ).fetchAsync();
        Object.assign(cardCounts, countCardsByListId(cards));
      }
    }

    return buildBoardTileData(boards, lists, cardCounts);
  },
});

// The user's active-admin archived boards. #4255: only boards the user can
// actually delete (hasAdmin -> isActive && isAdmin). Paginated (limit/skip) so a
// long-lived instance's archive never loads every archived board at once.
function archivedBoardsSelector(userId, searchTerm) {
  const selector = {
    archived: true,
    type: { $nin: ['template-container', 'template-board'] },
    members: { $elemMatch: { userId, isActive: true, isAdmin: true } },
  };
  if (searchTerm) {
    selector.title = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }
  return selector;
}

Meteor.publish('archivedBoards', async function(searchTerm = '', limit = 30, skip = 0) {
  const userId = this.userId;
  if (!Match.test(userId, String)) return [];
  check(searchTerm, Match.OneOf(String, null, undefined));
  check(limit, Number);
  check(skip, Match.OneOf(Number, null, undefined));

  const ret = await ReactiveCache.getBoards(
    archivedBoardsSelector(userId, searchTerm),
    {
      fields: {
        _id: 1,
        archived: 1,
        slug: 1,
        title: 1,
        createdAt: 1,
        modifiedAt: 1,
        archivedAt: 1,
      },
      sort: { archivedAt: -1, modifiedAt: -1 },
      limit,
      skip: skip || 0,
    },
    true,
  );
  return ret;
});

Meteor.methods({
  async getArchivedBoardsCount(searchTerm = '') {
    if (!Match.test(this.userId, String)) return 0;
    check(searchTerm, Match.OneOf(String, null, undefined));
    const cursor = await ReactiveCache.getBoards(archivedBoardsSelector(this.userId, searchTerm), {}, true);
    return typeof cursor.countAsync === 'function' ? await cursor.countAsync() : cursor.count();
  },
});

// OPTIMIZED BOARD PUBLICATION
//
// Performance improvements implemented to reduce N+1 query problem:
// - Batches card-related queries (comments, attachments, checklists) instead of querying per-card
// - Uses field projections to minimize data transfer
// - Removed automatic loading of entire linked boards (cardType-linkedBoard)
// - Only loads visible data: cards, comments, attachments, checklists for current board
//
// Estimated improvement:
// - Before: ~800-1000 queries for board with 100 cards
// - After: ~15-20 batched queries for same board (40-50x reduction)
//
// If isArchived = false, this will only return board elements which are not archived.
// If isArchived = true, this will only return board elements which are archived.
publishComposite('board', async function(boardId, isArchived) {
  check(boardId, String);
  check(isArchived, Boolean);

  // Best-effort, fire-and-forget: copy any board member's external avatar (Sandstorm
  // profile picture, LDAP/OAuth2/OIDC, a pasted URL) into WeKan's own files/avatars so
  // it displays without the identity provider and is carried by board export/import.
  // Idempotent (skips already-local avatars) and never blocks the publication.
  localizeBoardMemberAvatars(boardId).catch(() => {});

  const thisUserId = this.userId;
  const $or = [{ permission: 'public' }];

  let currUser = (!Match.test(thisUserId, String) || !thisUserId) ? 'undefined' : await ReactiveCache.getUser(thisUserId);
  let orgIdsUserBelongs = currUser !== 'undefined' && currUser.teams !== 'undefined' ? currUser.orgIdsUserBelongs() : '';
  let teamIdsUserBelongs = currUser !== 'undefined' && currUser.teams !== 'undefined' ? currUser.teamIdsUserBelongs() : '';
  let orgsIds = [];
  let teamsIds = [];
  // #5850: the user's email domain(s) for domain-based board sharing.
  let emailDomains = currUser !== 'undefined' && typeof currUser.emailDomains === 'function'
    ? currUser.emailDomains()
    : [];

  if (orgIdsUserBelongs && orgIdsUserBelongs != '') {
    orgsIds = orgIdsUserBelongs.split(',');
  }
  if (teamIdsUserBelongs && teamIdsUserBelongs != '') {
    teamsIds = teamIdsUserBelongs.split(',');
  }

  if (thisUserId) {
    $or.push({ members: { $elemMatch: { userId: thisUserId, isActive: true } } });
    $or.push({ 'orgs.orgId': { $in: orgsIds } });
    $or.push({ 'teams.teamId': { $in: teamsIds } });
    $or.push({ 'domains.domain': { $in: emailDomains } });
  }

  // Per-board adaptive card-loading decision. In 'auto' mode we count this board's
  // (non-archived) cards ONCE and decide lazy vs eager from the threshold; the
  // several child cursors below all read this memoized result so they agree. In
  // explicit 'all'/'lazy' mode the count is never taken.
  let _boardCardCount = null;
  const boardIsLazy = async board => {
    const mode = globalCardsMode();
    if (mode === 'lazy') return true;
    if (mode === 'all') return false;
    if (_boardCardCount === null) {
      _boardCardCount = await Cards.find(
        { boardId: { $in: [board._id, board.subtasksDefaultBoardId] }, archived: isArchived },
      ).countAsync();
    }
    return effectiveBoardCardsMode('auto', _boardCardCount, globalLazyThreshold()) === 'lazy';
  };

  return {
    async find() {
      return await ReactiveCache.getBoards(
        {
          _id: boardId,
          // Template boards are always accessible regardless of archived state.
          // $nor is used because $or is already taken by the access control below.
          $nor: [{ archived: true, type: { $nin: ['template-container', 'template-board'] } }],
          // If the board is not public the user has to be a member of it to see it.
          $or,
        },
        { limit: 1, sort: { sort: 1 /* boards default sorting */ } },
        true,
      );
    },
    children: [
      // Lists
      {
        async find(board) {
          return await ReactiveCache.getLists({ boardId: board._id, archived: isArchived }, {}, true);
        }
      },
      // Swimlanes
      {
        async find(board) {
          return await ReactiveCache.getSwimlanes({ boardId: board._id, archived: isArchived }, {}, true);
        }
      },
      // Integrations
      {
        async find(board) {
          return await ReactiveCache.getIntegrations(
            { boardId: board._id },
            { fields: { token: 0 } },
            true,
          );
        }
      },
      // CardCommentReactions at board level
      {
        async find(board) {
          return await ReactiveCache.getCardCommentReactions({ boardId: board._id }, {}, true);
        }
      },
      // CustomFields
      {
        async find(board) {
          return await ReactiveCache.getCustomFields(
            { boardIds: { $in: [board._id] } },
            { sort: { name: 1 } },
            true,
          );
        }
      },
      // Cards
      {
        async find(board) {
          // Lazy mode: cards (and their comments/attachments children) are
          // published per visible window by `boardCardsWindow`, not here.
          if (await boardIsLazy(board)) return null;
          const cardSelector = {
            boardId: { $in: [board._id, board.subtasksDefaultBoardId] },
            archived: isArchived,
          };

          // Check if current user has assigned-only permissions
          if (thisUserId && board.members) {
            const member = findWhere(board.members, { userId: thisUserId, isActive: true });
            if (member && (member.isNormalAssignedOnly || member.isCommentAssignedOnly || member.isReadAssignedOnly)) {
              // User with assigned-only permissions should only see cards assigned to them
              cardSelector.assignees = { $in: [thisUserId] };
            }
          }

          return await ReactiveCache.getCards(cardSelector, {}, true);
        },
        // NOTE: CardComments and Attachments are NOT published as per-card children
        // here. Doing so opened ONE live cursor per card (an N+1) — on a board with
        // many cards that multiplied live observers, and under FerretDB's poll-and-diff
        // that pinned FerretDB/SQLite CPU and made boards take minutes to open (#6480).
        // They are instead published below as single board-level cursors on their
        // denormalized boardId / meta.boardId — exactly like checklists and checklist
        // items — which still react to newly added cards (a new card's comment/
        // attachment carries the board id) but open ONE cursor per collection instead
        // of one per card.
      },
      // Checklists for the whole board — a single cursor on the denormalized
      // boardId, so checklists on newly added cards publish reactively without a
      // per-card-id snapshot that goes stale.
      {
        async find(board) {
          // Lazy mode: checklists are published per visible card by boardCardsWindow.
          if (await boardIsLazy(board)) return null;
          const boardIds = [board._id];
          if (board.subtasksDefaultBoardId) boardIds.push(board.subtasksDefaultBoardId);
          // Assigned-only members must not receive checklists for cards they are
          // not assigned to; boardId alone cannot express that, so fall back to
          // the assigned cards' ids for those members.
          if (thisUserId && board.members) {
            const member = findWhere(board.members, { userId: thisUserId, isActive: true });
            if (member && (member.isNormalAssignedOnly || member.isCommentAssignedOnly || member.isReadAssignedOnly)) {
              const cards = await ReactiveCache.getCards(
                { boardId: { $in: boardIds }, archived: isArchived, assignees: { $in: [thisUserId] } },
                { fields: { _id: 1 } },
                false,
              );
              const cardIds = (cards || []).map(c => c._id);
              return await ReactiveCache.getChecklists({ cardId: { $in: cardIds } }, {}, true);
            }
          }
          return await ReactiveCache.getChecklists({ boardId: { $in: boardIds } }, {}, true);
        }
      },
      // ChecklistItems for the whole board — single cursor on denormalized boardId
      {
        async find(board) {
          // Lazy mode: checklist items are published per visible card by boardCardsWindow.
          if (await boardIsLazy(board)) return null;
          const boardIds = [board._id];
          if (board.subtasksDefaultBoardId) boardIds.push(board.subtasksDefaultBoardId);
          if (thisUserId && board.members) {
            const member = findWhere(board.members, { userId: thisUserId, isActive: true });
            if (member && (member.isNormalAssignedOnly || member.isCommentAssignedOnly || member.isReadAssignedOnly)) {
              const cards = await ReactiveCache.getCards(
                { boardId: { $in: boardIds }, archived: isArchived, assignees: { $in: [thisUserId] } },
                { fields: { _id: 1 } },
                false,
              );
              const cardIds = (cards || []).map(c => c._id);
              return await ReactiveCache.getChecklistItems({ cardId: { $in: cardIds } }, {}, true);
            }
          }
          return await ReactiveCache.getChecklistItems({ boardId: { $in: boardIds } }, {}, true);
        }
      },
      // CardComments for the whole board — a single cursor on the denormalized
      // boardId (indexed), replacing the former one-cursor-per-card N+1 (#6480). New
      // cards' comments still publish reactively because they carry the board's id.
      {
        async find(board) {
          // Lazy mode: comments are published per visible card by boardCardsWindow.
          if (await boardIsLazy(board)) return null;
          const boardIds = [board._id];
          if (board.subtasksDefaultBoardId) boardIds.push(board.subtasksDefaultBoardId);
          // Assigned-only members must only receive comments for cards assigned to
          // them; boardId alone cannot express that, so fall back to the assigned
          // cards' ids for those members (same as checklists above).
          if (thisUserId && board.members) {
            const member = findWhere(board.members, { userId: thisUserId, isActive: true });
            if (member && (member.isNormalAssignedOnly || member.isCommentAssignedOnly || member.isReadAssignedOnly)) {
              const cards = await ReactiveCache.getCards(
                { boardId: { $in: boardIds }, archived: isArchived, assignees: { $in: [thisUserId] } },
                { fields: { _id: 1 } },
                false,
              );
              const cardIds = (cards || []).map(c => c._id);
              return await ReactiveCache.getCardComments({ cardId: { $in: cardIds } }, {}, true);
            }
          }
          return await ReactiveCache.getCardComments({ boardId: { $in: boardIds } }, {}, true);
        }
      },
      // Attachments for the whole board — a single cursor on the denormalized
      // meta.boardId (indexed), replacing the former one-cursor-per-card N+1 (#6480).
      {
        async find(board) {
          // Lazy mode: attachments are published per visible card by boardCardsWindow.
          if (await boardIsLazy(board)) return null;
          const boardIds = [board._id];
          if (board.subtasksDefaultBoardId) boardIds.push(board.subtasksDefaultBoardId);
          if (thisUserId && board.members) {
            const member = findWhere(board.members, { userId: thisUserId, isActive: true });
            if (member && (member.isNormalAssignedOnly || member.isCommentAssignedOnly || member.isReadAssignedOnly)) {
              const cards = await ReactiveCache.getCards(
                { boardId: { $in: boardIds }, archived: isArchived, assignees: { $in: [thisUserId] } },
                { fields: { _id: 1 } },
                false,
              );
              const cardIds = (cards || []).map(c => c._id);
              const scoped = await ReactiveCache.getAttachments({ 'meta.cardId': { $in: cardIds } }, {}, true);
              return scoped.cursor || scoped;
            }
          }
          const result = await ReactiveCache.getAttachments({ 'meta.boardId': { $in: boardIds } }, {}, true);
          return result.cursor || result;
        }
      },
      // Parent cards (for subtasks)
      {
        async find(board) {
          const cardSelector = {
            boardId: { $in: [board._id, board.subtasksDefaultBoardId] },
            archived: isArchived,
          };

          if (thisUserId && board.members) {
            const member = findWhere(board.members, { userId: thisUserId, isActive: true });
            if (member && (member.isNormalAssignedOnly || member.isCommentAssignedOnly || member.isReadAssignedOnly)) {
              cardSelector.assignees = { $in: [thisUserId] };
            }
          }

          const cards = await ReactiveCache.getCards(cardSelector, { fields: { _id: 1, parentId: 1 } }, false);
          if (!cards || cards.length === 0) return null;

          const parentIds = cards.filter(c => c.parentId).map(c => c.parentId);
          if (parentIds.length === 0) return null;

          // #3453: the 'prefix-with-full-path' subtask setting renders the
          // WHOLE ancestor chain (models/cards.js parentString()), and the
          // ancestors of a cross-board subtask live on the parent board, so
          // they are not covered by any other cursor of this publication.
          // Publishing only the direct parents truncated the path after a hard
          // refresh — walk every level so the full path survives F5.
          const ancestorIds = await collectAncestorIds(parentIds, ids =>
            ReactiveCache.getCards(
              { _id: { $in: ids } },
              { fields: { _id: 1, parentId: 1 } },
              false,
            ),
          );

          return await ReactiveCache.getCards({ _id: { $in: ancestorIds } }, {}, true);
        }
      },
      // Linked cards (cardType-linkedCard)
      {
        async find(board) {
          const cardSelector = {
            boardId: { $in: [board._id, board.subtasksDefaultBoardId] },
            archived: isArchived,
          };

          if (thisUserId && board.members) {
            const member = findWhere(board.members, { userId: thisUserId, isActive: true });
            if (member && (member.isNormalAssignedOnly || member.isCommentAssignedOnly || member.isReadAssignedOnly)) {
              cardSelector.assignees = { $in: [thisUserId] };
            }
          }

          const cards = await ReactiveCache.getCards(cardSelector, { fields: { _id: 1, type: 1, linkedId: 1 } }, false);
          if (!cards || cards.length === 0) return null;

          const linkedCardIds = cards.filter(c => c.type === 'cardType-linkedCard' && c.linkedId).map(c => c.linkedId);
          if (linkedCardIds.length === 0) return null;

          return await ReactiveCache.getCards({ _id: { $in: linkedCardIds }, archived: isArchived }, {}, true);
        }
      },
      // Comments for linked cards
      {
        async find(board) {
          const cardSelector = {
            boardId: { $in: [board._id, board.subtasksDefaultBoardId] },
            archived: isArchived,
          };

          if (thisUserId && board.members) {
            const member = findWhere(board.members, { userId: thisUserId, isActive: true });
            if (member && (member.isNormalAssignedOnly || member.isCommentAssignedOnly || member.isReadAssignedOnly)) {
              cardSelector.assignees = { $in: [thisUserId] };
            }
          }

          const cards = await ReactiveCache.getCards(cardSelector, { fields: { _id: 1, type: 1, linkedId: 1 } }, false);
          if (!cards || cards.length === 0) return null;

          const linkedCardIds = cards.filter(c => c.type === 'cardType-linkedCard' && c.linkedId).map(c => c.linkedId);
          if (linkedCardIds.length === 0) return null;

          return await ReactiveCache.getCardComments({ cardId: { $in: linkedCardIds } }, {}, true);
        }
      },
      // Attachments for linked cards
      {
        async find(board) {
          const cardSelector = {
            boardId: { $in: [board._id, board.subtasksDefaultBoardId] },
            archived: isArchived,
          };

          if (thisUserId && board.members) {
            const member = findWhere(board.members, { userId: thisUserId, isActive: true });
            if (member && (member.isNormalAssignedOnly || member.isCommentAssignedOnly || member.isReadAssignedOnly)) {
              cardSelector.assignees = { $in: [thisUserId] };
            }
          }

          const cards = await ReactiveCache.getCards(cardSelector, { fields: { _id: 1, type: 1, linkedId: 1 } }, false);
          if (!cards || cards.length === 0) return null;

          const linkedCardIds = cards.filter(c => c.type === 'cardType-linkedCard' && c.linkedId).map(c => c.linkedId);
          if (linkedCardIds.length === 0) return null;

          const result = await ReactiveCache.getAttachments({ 'meta.cardId': { $in: linkedCardIds } }, {}, true);
          return result.cursor || result;
        }
      },
      // Checklists for linked cards
      {
        async find(board) {
          const cardSelector = {
            boardId: { $in: [board._id, board.subtasksDefaultBoardId] },
            archived: isArchived,
          };

          if (thisUserId && board.members) {
            const member = findWhere(board.members, { userId: thisUserId, isActive: true });
            if (member && (member.isNormalAssignedOnly || member.isCommentAssignedOnly || member.isReadAssignedOnly)) {
              cardSelector.assignees = { $in: [thisUserId] };
            }
          }

          const cards = await ReactiveCache.getCards(cardSelector, { fields: { _id: 1, type: 1, linkedId: 1 } }, false);
          if (!cards || cards.length === 0) return null;

          const linkedCardIds = cards.filter(c => c.type === 'cardType-linkedCard' && c.linkedId).map(c => c.linkedId);
          if (linkedCardIds.length === 0) return null;

          return await ReactiveCache.getChecklists({ cardId: { $in: linkedCardIds } }, {}, true);
        }
      },
      // ChecklistItems for linked cards
      {
        async find(board) {
          const cardSelector = {
            boardId: { $in: [board._id, board.subtasksDefaultBoardId] },
            archived: isArchived,
          };

          if (thisUserId && board.members) {
            const member = findWhere(board.members, { userId: thisUserId, isActive: true });
            if (member && (member.isNormalAssignedOnly || member.isCommentAssignedOnly || member.isReadAssignedOnly)) {
              cardSelector.assignees = { $in: [thisUserId] };
            }
          }

          const cards = await ReactiveCache.getCards(cardSelector, { fields: { _id: 1, type: 1, linkedId: 1 } }, false);
          if (!cards || cards.length === 0) return null;

          const linkedCardIds = cards.filter(c => c.type === 'cardType-linkedCard' && c.linkedId).map(c => c.linkedId);
          if (linkedCardIds.length === 0) return null;

          return await ReactiveCache.getChecklistItems({ cardId: { $in: linkedCardIds } }, {}, true);
        }
      },
      // Board members/Users
      {
        async find(board) {
          if (board.members) {
            // Board members. This publication also includes former board members that
            // aren't members anymore but may have some activities attached to them in
            // the history.
            const memberIds = board.members.map(x => x.userId);

            // We omit the current user because the client should already have that data,
            // and sending it triggers a subtle bug:
            // https://github.com/wefork/wekan/issues/15
            return await ReactiveCache.getUsers(
              {
                _id: { $in: memberIds.filter(x => x !== thisUserId) },
              },
              {
                fields: {
                  username: 1,
                  'profile.fullname': 1,
                  'profile.avatarUrl': 1,
                  'profile.initials': 1,
                },
              },
              true,
            );
          }
          return null;
        }
      }
    ]
  };
});

Meteor.methods({
  async copyBoard(boardId, properties) {
    check(boardId, String);
    check(properties, Object);

    if (!this.userId) throw new Meteor.Error('not-authorized');
    const board = await ReactiveCache.getBoard(boardId);
    if (!board) throw new Meteor.Error('not-found');
    // Require board admin, matching the REST endpoint
    // POST /api/boards/:boardId/copy (checkAdminOrCondition with adminAccess).
    if (!board.hasAdmin(this.userId)) throw new Meteor.Error('not-authorized');

    // Strip fields the caller must not control on the copy
    const { members, permission, ...safeProperties } = properties;
    for (const key of Object.keys(safeProperties)) {
      board[key] = safeProperties[key];
    }

    return board.copy();
  },

  // Board status for the sidebar Status popup: accurate counts computed on the
  // server (so they are correct even in lazy mode, where the client's minimongo
  // only holds the visible card window), plus this board's effective card-loading
  // mode (lazy vs eager). Any board member (visible board) may read it.
  async boardStatus(boardId) {
    check(boardId, String);
    const board = await ReactiveCache.getBoard(boardId);
    if (!board || !board.isVisibleBy({ _id: this.userId })) {
      throw new Meteor.Error('not-authorized');
    }
    const boardIds = [board._id];
    if (board.subtasksDefaultBoardId) boardIds.push(board.subtasksDefaultBoardId);

    const cards = await Cards.find({ boardId: { $in: boardIds }, archived: false }).countAsync();
    const archivedCards = await Cards.find({ boardId: { $in: boardIds }, archived: true }).countAsync();
    const swimlanes = (await ReactiveCache.getSwimlanes({ boardId: board._id, archived: false })).length;
    const lists = (await ReactiveCache.getLists({ boardId: board._id, archived: false })).length;
    const customFields = (await ReactiveCache.getCustomFields({ boardIds: { $in: [board._id] } })).length;
    const labels = (board.labels || []).length;
    const members = (board.members || []).filter(m => m.isActive !== false).length;

    // Time-spent summary, in the style of the general task time reports: sum the
    // spentTime over the active cards that have any logged, how many cards that is,
    // and how many are flagged overtime. Only cards WITH time are fetched (spentTime
    // > 0), so this stays cheap even on a large board.
    const timeCards = await Cards.find(
      { boardId: { $in: boardIds }, archived: false, spentTime: { $gt: 0 } },
      { fields: { spentTime: 1, isOvertime: 1 } },
    ).fetchAsync();
    const timeSpentTotal = timeCards.reduce((sum, c) => sum + (Number(c.spentTime) || 0), 0);
    const cardsWithTimeSpent = timeCards.length;
    const overtimeCards = timeCards.filter(c => c.isOvertime).length;

    const mode = globalCardsMode();
    const lazy =
      mode === 'lazy' ||
      (mode !== 'all' &&
        effectiveBoardCardsMode('auto', cards, globalLazyThreshold()) === 'lazy');

    return {
      mode, lazy, swimlanes, lists, cards, archivedCards, labels, members, customFields,
      timeSpentTotal, cardsWithTimeSpent, overtimeCards,
    };
  },
});
