// This is the publication used to display the board list. We publish all the
// non-archived boards:
// 1. that the user is a member of
// 2. the user has starred
import { ReactiveCache } from '/imports/reactiveCache';
import { publishComposite } from 'meteor/reywood:publish-composite';
import { publishReportPage } from '/models/lib/reportPageIndex';
const { notHelperBoardTitle } = require('/models/lib/helperBoards');
import { findWhere } from '/imports/lib/collectionHelpers';
import Users from "../../models/users";
import Org from "../../models/org";
import Team from "../../models/team";
import Attachments from '../../models/attachments';
import Boards from '/models/boards';
import Cards from '/models/cards';
import { localizeBoardMemberAvatars } from '/server/lib/localizeAvatar';
import { collectAncestorIds } from '/server/lib/subtaskAncestors';
import { visibleBoardIds } from '/server/lib/visibleBoardIds';
import {
  showsCardCounterList,
  countCardsByListId,
  buildBoardTileData,
} from '/models/lib/boardTileData';
const {
  effectiveBoardCardsMode,
  DEFAULT_LAZY_THRESHOLD,
} = require('/models/lib/cardsLoading');
const { boardCardScope } = require('/models/lib/boardCardScope');
const { boardVisibilitySelectors } = require('/models/lib/boardVisibilitySelectors');

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

// Fields needed by All Boards, rule board pickers and the Sandstorm auto-open
// decision. The open-board `board` publication supplies the full document.
const BOARD_LIST_FIELDS = {
  title: 1,
  slug: 1,
  color: 1,
  backgroundImageURL: 1,
  description: 1,
  type: 1,
  permission: 1,
  members: 1,
  orgs: 1,
  teams: 1,
  domains: 1,
  sort: 1,
  archived: 1,
  createdAt: 1,
  modifiedAt: 1,
  dateLastActivity: 1,
  allowsCardCounterList: 1,
  allowsBoardMemberList: 1,
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
      const clauses = boardVisibilitySelectors({
        userId,
        orgIds: user.orgIds(),
        teamIds: user.teamIds(),
        emailDomains: user.emailDomains(),
        // Public means anybody may open the board, not that it belongs in this
        // user's All Boards list. `/public` and the singular board publication
        // retain public discovery and direct-link access.
        includePublic: false,
      });
      const selector = {
        archived: false,
        type: 'board',
        // GHSA-gwc4-fw7p-gw58: one builder answers "which boards may this user
        // see", everywhere. This used to be a hand-written copy of the same
        // array - and the `board` publication's copy was the one that forgot
        // isActive and served revoked shares.
        // Avoid a single-clause $or: FerretDB can push the direct membership
        // predicate into its backend when it remains at the top level.
        ...(clauses.length === 1 ? clauses[0] : { $or: clauses }),
      };
      return await ReactiveCache.getBoards(
        selector,
        {
          sort: { sort: 1 /* boards default sorting */ },
          fields: BOARD_LIST_FIELDS,
        },
        true,
      );
    },
  };
});

// Move/copy dialogs must not depend on the long-lived All Boards composite
// subscription being populated. Publish exactly what their client-side picker
// has always offered: non-archived boards where this user is an active member.
Meteor.publish('boardDestinations', async function() {
  const userId = this.userId;
  if (!Match.test(userId, String) || !userId) return [];
  return await ReactiveCache.getBoards(
    {
      archived: false,
      type: 'board',
      members: { $elemMatch: { userId, isActive: true } },
    },
    { sort: { sort: 1 }, fields: BOARD_LIST_FIELDS },
    true,
  );
});

// Template containers are numerous on long-lived LDAP instances and are only
// needed by All Boards / Templates. Keep this live so imports appear without a
// reload, but do not make every page poll and decode them.
Meteor.publish('boardTemplates', async function() {
  const userId = this.userId;
  if (!Match.test(userId, String) || !userId) return [];
  const user = await ReactiveCache.getUser(userId);
  if (!user) return [];
  return ReactiveCache.getBoards(
    {
      archived: false,
      type: 'template-container',
      $or: boardVisibilitySelectors({
        userId,
        orgIds: user.orgIds(),
        teamIds: user.teamIds(),
        emailDomains: user.emailDomains(),
      }),
    },
    { sort: { sort: 1 }, fields: BOARD_LIST_FIELDS },
    true,
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// /public — one page of the boards anybody may open.
// Design: docs/Features/Page/Public.md, which is the Table page design.
//
// The selector is built HERE and takes nothing from the client: a public board is
// public, so this needs no login, and a page that needs no login must not let the
// caller choose what it sees. The only thing the client says is which page it
// wants and what it is searching for.
// ─────────────────────────────────────────────────────────────────────────────

// The boards /public may show: public, not archived, a real board rather than a
// template container, and not one of WeKan's internal helper boards.
function publicBoardsSelector(searchTerm) {
  const query = {
    permission: 'public',
    archived: false,
    type: 'board',
    title: notHelperBoardTitle(),
  };
  if (searchTerm) {
    // The title clause is already taken by the helper-board exclusion, so the
    // search goes in as its own $and term rather than replacing it - a search
    // that dropped that exclusion would put the ^Subtasks^ boards back.
    query.$and = [
      { title: new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
    ];
  }
  return query;
}

Meteor.publish('publicBoards', async function(searchTerm = '', limit = 10, skip = 0) {
  check(searchTerm, Match.OneOf(String, null, undefined));
  check(limit, Number);
  check(skip, Match.OneOf(Number, null, undefined));

  const perPage = Math.max(1, Math.min(Math.floor(limit) || 10, 100));

  // Published MANUALLY (fetch + this.added + this.ready) for the same reason as
  // boardsReport below: a returned sorted+limited cursor triggers a LIMITED live
  // observe that hangs on FerretDB's OpLog and leaves the page on its spinner.
  // The pane re-subscribes on every page and search change, so it needs no live
  // cursor.
  // SIX fields, for a page of ten boards. Not the whole board document: the table
  // has two columns, and a board carries its members, its labels, its subtask and
  // card settings, its background and every allows* flag - none of which this page
  // draws, all of which would cross the wire for every row.
  //
  //   title, description  the two columns;
  //   slug                the link the row is;
  //   color, backgroundImageURL
  //                       the row's own colours, which is how a board is
  //                       recognised here the way it is on All Boards (#5157).
  //
  // `members` in particular is deliberately absent: it is the largest field on a
  // busy board and this page shows no avatars.
  const boards = await ReactiveCache.getBoards(
    publicBoardsSelector(searchTerm),
    {
      fields: {
        _id: 1,
        slug: 1,
        title: 1,
        description: 1,
        color: 1,
        backgroundImageURL: 1,
      },
      sort: { sort: 1 },
      limit: perPage,
      skip: skip || 0,
    },
    false,
  );

  for (const doc of boards) { const { _id, ...fields } = doc; this.added('boards', _id, fields); }
  // WHICH boards this page is, in this order: the visitor's own boards are in
  // minimongo whatever page is open, so the pane must render the named page only.
  publishReportPage(this, 'public-boards', boards);
  this.ready();
});

Meteor.methods({
  async getPublicBoardsCount(searchTerm = '') {
    check(searchTerm, Match.OneOf(String, null, undefined));
    // No authorization check, deliberately: this counts PUBLIC boards, which is
    // the same set the publication above will send to the same caller.
    const cursor = await ReactiveCache.getBoards(publicBoardsSelector(searchTerm), {}, true);
    return typeof cursor.countAsync === 'function'
      ? await cursor.countAsync()
      : cursor.count();
  },
});

Meteor.publish('boardsReport', async function(searchTerm = '', limit, skip = 0) {
  check(searchTerm, Match.OneOf(String, null, undefined));
  check(limit, Number);
  check(skip, Match.OneOf(Number, null, undefined));
  // An ADMIN report, over the whole instance - like the Cards report beside it in
  // Admin Panel / Problems. It used to publish `userBoardIds(this.userId)`, the
  // boards the ADMIN is personally a member of, which on any instance where the
  // admin is not a board member is nothing at all: the Boards report was empty
  // while the Cards report next to it listed cards from thousands of boards. That
  // also means the guard has to be `isAdmin` now, not merely "logged in": the
  // membership selector was what kept this publication honest before.
  if (!this.userId || !(await ReactiveCache.getUser(this.userId))?.isAdmin) {
    return this.ready();
  }

  const query = {};
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
  // WHICH boards this page is, in this order: the admin's own boards are in
  // minimongo whatever page is open, so the pane must render the named page only.
  publishReportPage(this, 'report-boards', boards);
  this.ready();
});

Meteor.methods({
  async getBoardsReportCount(searchTerm = '') {
    check(searchTerm, Match.OneOf(String, null, undefined));
    const user = await ReactiveCache.getCurrentUser();
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized');
    }
    // The same set the publication pages: every board on the instance, admin-only.
    const query = {};
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
    const clauses = boardVisibilitySelectors({
      userId,
      orgIds: user.orgIds(),
      teamIds: user.teamIds(),
      emailDomains: user.emailDomains(),
      includePublic: false,
    });
    const selector = {
      archived: false,
      type: search || menu === 'templates'
        ? { $in: ['board', 'template-container'] }
        : 'board',
      ...(clauses.length === 1 ? clauses[0] : { $or: clauses }),
    };
    if (search) {
      selector.title = new RegExp(
        search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i',
      );
    }

    // Encode the selected menu in Mongo before pagination. A search spans every
    // category, preserving the existing behavior.
    const profile = user.profile || {};
    const assignments = profile.boardWorkspaceAssignments || {};
    const starred = profile.starredBoards || [];
    if (!search) {
      if (menu === 'starred') {
        selector._id = { $in: starred };
      } else if (menu === 'templates') {
        selector.type = 'template-container';
      } else if (menu === 'remaining') {
        selector._id = { $nin: Object.keys(assignments) };
      } else {
        selector._id = {
          $in: Object.keys(assignments).filter(id => assignments[id] === menu),
        };
      }
    }

    const total = await Boards.find(selector).countAsync();
    const cursor = Boards.find(selector, {
      fields: { _id: 1 },
      sort: { title: sortBy === 'title-desc' ? -1 : 1, _id: 1 },
      skip: (page - 1) * perPage,
      limit: perPage,
    });
    const boards = await cursor.fetchAsync();
    const ids = boards.map(board => board._id);
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
      $or: boardVisibilitySelectors({
        userId,
        orgIds: user.orgIds(),
        teamIds: user.teamIds(),
        emailDomains: user.emailDomains(),
      }),
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
        // The Archive is drawn as board ICONS now, the same tiles Remaining
        // uses, so the fields a tile reads have to be here: its colour, what
        // kind of board it is, its description, and its members - the last for
        // the star and the multi-selection checkbox. Sending seven fields to a
        // template that reads twelve renders grey, nameless tiles.
        // docs/Features/Page/Archive.md
        color: 1,
        type: 1,
        description: 1,
        permission: 1,
        members: 1,
        stars: 1,
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
    // check() FIRST, then authorise. Meteor audits that every argument was
    // checked, and returning early for a signed-out caller skipped the check
    // entirely - so the method threw "Did not check() all arguments" instead of
    // answering 0. Nothing tripped it until All Boards began asking for this
    // count from onCreated, which can run before the user is established; the
    // archive page had always called it after its subscription was ready.
    //
    // Validating the shape of what you were given before deciding whether the
    // caller may have it is the right order anyway, and it is the order
    // getPublicBoardsCount above already uses.
    check(searchTerm, Match.OneOf(String, null, undefined));
    if (!Match.test(this.userId, String)) return 0;
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
publishComposite('board', async function(boardId, isArchived, generation) {
  // A subscription's arguments come from the CLIENT, so they can be anything -
  // including a null board id from a page that subscribed before it knew which
  // board it was on. `check()` throws for that, and a throw inside an ASYNC
  // publisher escapes as an unhandled promise rejection, which this app turns
  // into a process EXIT (SyncedCron treats UNHANDLED_REJECTION as fatal). One
  // subscription with a null id therefore took the whole server down, for
  // everyone - and any client can send one.
  //
  // Publishing nothing is the right answer to a subscription that names no
  // board: publishComposite treats a falsy return as "no publications" and
  // readies the subscription, so the client simply gets an empty result.
  //
  // `check(..., Match.Any)` first: this app runs with audit-argument-checks, which
  // fails a publisher that returns without having check()ed every argument -
  // "Did not check() all arguments during publisher 'board'". Match.test alone
  // does not count as checking, so the audit threw for every subscription. Any
  // marks them audited and never throws; the real validation is the two lines
  // below it.
  check(boardId, Match.Any);
  check(isArchived, Match.Any);
  check(generation, Match.Any);
  if (!Match.test(boardId, String) || !boardId) return;
  if (!Match.test(isArchived, Boolean)) return;
  if (generation !== undefined && !Match.test(generation, Number)) return;

  // Best-effort, fire-and-forget: copy any board member's external avatar (Sandstorm
  // profile picture, LDAP/OAuth2/OIDC, a pasted URL) into WeKan's own files/avatars so
  // it displays without the identity provider and is carried by board export/import.
  // Idempotent (skips already-local avatars) and never blocks the publication.
  localizeBoardMemberAvatars(boardId).catch(() => {});

  const thisUserId = this.userId;

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

  // GHSA-gwc4-fw7p-gw58: this used to match org/team/domain shares with a
  // dotted `'orgs.orgId': { $in: [...] }`, which says nothing about isActive -
  // the flag a board admin flips to REVOKE a share. A revoked user disappeared
  // from All Boards (that list uses the $elemMatch form) yet could still
  // subscribe here with a boardId they remembered and receive the whole private
  // board. Both now come from the one builder, which requires isActive: true.
  const $or = boardVisibilitySelectors({
    userId: thisUserId,
    orgIds: orgsIds,
    teamIds: teamsIds,
    emailDomains,
  });

  // The linked cards of this board, MINUS the ones whose board this subscriber
  // may not see.
  //
  // GHSA-jvv9-498p-hxrg was reported against the ancestor (parentId) cursor, and
  // the linked-card cursors below had the identical hole - worse, in fact, since
  // they publish the linked card's comments, attachments, checklists and
  // checklist items as well. A `cardType-linkedCard` names a card by id, that
  // card may live on any board, and creating one requires read access to that
  // board (server/models/cards.js) - but the person who created it is not the
  // person this publication is sending to. Every subscriber of THIS board was
  // getting the linked card's full document and all of its children, whether or
  // not they may see the board it lives on.
  //
  // A linked card whose source board the subscriber cannot see is simply not
  // sent, exactly as an invisible ancestor is not sent. Cards on THIS board are
  // their own answer - they are already going to this subscriber.
  //
  // The five cursors used to repeat this preamble verbatim; sharing it is also
  // what stops the next one from being written without the check.
  const cardScopeFor = board => {
    const cardSelector = {
      ...boardCardScope(board),
      archived: isArchived,
    };
    if (thisUserId && board.members) {
      const member = findWhere(board.members, { userId: thisUserId, isActive: true });
      if (member && (member.isNormalAssignedOnly || member.isCommentAssignedOnly || member.isReadAssignedOnly)) {
        cardSelector.assignees = { $in: [thisUserId] };
      }
    }
    return cardSelector;
  };

  // publishComposite passes the same parent document object to its sibling
  // child cursors during one evaluation. WeakMap shares their discovery work
  // only at that boundary: a later parent evaluation has a new document object
  // and therefore recomputes cards and authorization. There is deliberately no
  // TTL or board-id cache that could serve stale access after a revoke.
  const cardIndexByParent = new WeakMap();
  const visibleLinkedByParent = new WeakMap();

  const boardCardIndex = board => {
    let compute = cardIndexByParent.get(board);
    if (compute) return compute;

    compute = Promise.all([
      ReactiveCache.getCards(
        { ...cardScopeFor(board), type: 'cardType-linkedCard' },
        { fields: { _id: 1, linkedId: 1 } },
        false,
      ),
      ReactiveCache.getCards(
        { ...cardScopeFor(board), parentId: { $exists: true, $ne: null } },
        { fields: { _id: 1, parentId: 1 } },
        false,
      ),
    ]).then(([links, children]) => ({
      linkedIds: [...new Set((links || []).map(card => card.linkedId).filter(Boolean))],
      parentIds: [...new Set((children || []).map(card => card.parentId).filter(Boolean))],
    }));
    cardIndexByParent.set(board, compute);
    return compute;
  };

  const visibleLinkedCardIds = board => {
    let compute = visibleLinkedByParent.get(board);
    if (compute) return compute;

    compute = (async () => {
      const { linkedIds } = await boardCardIndex(board);
      if (linkedIds.length === 0) return [];

      const linked = await ReactiveCache.getCards(
        { _id: { $in: linkedIds } },
        { fields: { _id: 1, boardId: 1 } },
        false,
      );
      const linkedBoardIds = [...new Set((linked || []).map(c => c.boardId).filter(Boolean))];
      const allowedBoardIds = await visibleBoardIds(thisUserId, linkedBoardIds);
      allowedBoardIds.add(board._id);
      return (linked || []).filter(c => allowedBoardIds.has(c.boardId)).map(c => c._id);
    })();
    visibleLinkedByParent.set(board, compute);
    return compute;
  };

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
        { ...boardCardScope(board), archived: isArchived },
      ).countAsync();
    }
    return effectiveBoardCardsMode('auto', _boardCardCount, globalLazyThreshold()) === 'lazy';
  };

  return {
    async find() {
      return await ReactiveCache.getBoards(
        {
          _id: boardId,
          // An ARCHIVED board is published too. This used to exclude one unless
          // it was a template, so opening a board from the Archive answered
          // "board not found" - the document was withheld from a caller who had
          // asked for it by id and was entitled to see it.
          //
          // Archived is not a permission. What decides whether this board may be
          // sent is the `$or` below: public, or the user is a member. That is
          // unchanged, and it is the whole of the access control here.
          //
          // `isArchived` still governs the CONTENTS - the lists, swimlanes and
          // cards fetched by the children below - so an archived board opens
          // showing its live lists, exactly as it did before it was archived.
          // docs/Features/Page/Archive.md
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
            ...boardCardScope(board),
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
          const { parentIds } = await boardCardIndex(board);
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
          if (ancestorIds.length === 0) return null;

          // GHSA-jvv9-498p-hxrg: an ancestor may live on ANOTHER board, and
          // being able to write on THIS board says nothing about being allowed
          // to read that one. Anyone who can set a parentId (a member with
          // write access, or the REST API) could otherwise point a card at a
          // card on a private board and have this cursor publish that board's
          // full card documents - title, description, custom fields - to every
          // subscriber here. Publish only the ancestors whose board this
          // subscriber may actually see.
          const ancestors = await ReactiveCache.getCards(
            { _id: { $in: ancestorIds } },
            { fields: { _id: 1, boardId: 1 } },
            false,
          );
          const ancestorBoardIds = [...new Set((ancestors || []).map(c => c.boardId).filter(Boolean))];
          const allowedBoardIds = await visibleBoardIds(thisUserId, ancestorBoardIds);
          // This board is being published to this subscriber already, so its own
          // cards need no second decision.
          allowedBoardIds.add(board._id);

          const allowedAncestorIds = (ancestors || [])
            .filter(c => allowedBoardIds.has(c.boardId))
            .map(c => c._id);
          if (allowedAncestorIds.length === 0) return null;

          return await ReactiveCache.getCards({ _id: { $in: allowedAncestorIds } }, {}, true);
        }
      },
      // Linked cards (cardType-linkedCard)
      {
        async find(board) {
          // Only the linked cards whose board this subscriber may see
          // (GHSA-jvv9-498p-hxrg class).
          const linkedCardIds = await visibleLinkedCardIds(board);
          if (linkedCardIds.length === 0) return null;

          return await ReactiveCache.getCards({ _id: { $in: linkedCardIds }, archived: isArchived }, {}, true);
        }
      },
      // Source-board display metadata for linked cards. The source card itself
      // carries label ids and custom-field values, but their definitions live
      // on its board. Without these cursors a link looked complete only until
      // reload (while the board-picker subscription happened to remain alive).
      {
        async find(board) {
          const linkedCardIds = await visibleLinkedCardIds(board);
          if (linkedCardIds.length === 0) return null;
          const linkedCards = await ReactiveCache.getCards(
            { _id: { $in: linkedCardIds } },
            { fields: { boardId: 1 } },
            false,
          );
          const sourceBoardIds = [...new Set(linkedCards.map(card => card.boardId))];
          return await ReactiveCache.getBoards(
            { _id: { $in: sourceBoardIds } },
            { fields: { title: 1, slug: 1, labels: 1 } },
            true,
          );
        }
      },
      {
        async find(board) {
          const linkedCardIds = await visibleLinkedCardIds(board);
          if (linkedCardIds.length === 0) return null;
          const linkedCards = await ReactiveCache.getCards(
            { _id: { $in: linkedCardIds } },
            { fields: { boardId: 1 } },
            false,
          );
          const sourceBoardIds = [...new Set(linkedCards.map(card => card.boardId))];
          return await ReactiveCache.getCustomFields(
            { boardIds: { $in: sourceBoardIds } },
            { sort: { name: 1 } },
            true,
          );
        }
      },
      // Avatars used by source-card creator/member/assignee fields.
      {
        async find(board) {
          const linkedCardIds = await visibleLinkedCardIds(board);
          if (linkedCardIds.length === 0) return null;
          const linkedCards = await ReactiveCache.getCards(
            { _id: { $in: linkedCardIds } },
            { fields: { userId: 1, members: 1, assignees: 1 } },
            false,
          );
          const userIds = [...new Set(linkedCards.flatMap(card => [
            card.userId,
            ...(card.members || []),
            ...(card.assignees || []),
          ]).filter(id => id && id !== thisUserId))];
          if (userIds.length === 0) return null;
          return await ReactiveCache.getUsers(
            { _id: { $in: userIds } },
            { fields: {
              username: 1,
              'profile.fullname': 1,
              'profile.avatarUrl': 1,
              'profile.initials': 1,
            } },
            true,
          );
        }
      },
      // Subtasks displayed by a linked source card.
      {
        async find(board) {
          const linkedCardIds = await visibleLinkedCardIds(board);
          if (linkedCardIds.length === 0) return null;
          const linkedCards = await ReactiveCache.getCards(
            { _id: { $in: linkedCardIds } },
            { fields: { boardId: 1 } },
            false,
          );
          const sourceBoardIds = [...new Set(linkedCards.map(card => card.boardId))];
          return await ReactiveCache.getCards(
            {
              parentId: { $in: linkedCardIds },
              boardId: { $in: sourceBoardIds },
            },
            {},
            true,
          );
        }
      },
      // Cards named by the linked source card's dependency field. Constrain
      // them to the already-authorized source boards; a malformed dependency
      // id must not become a bridge into another private board.
      {
        async find(board) {
          const linkedCardIds = await visibleLinkedCardIds(board);
          if (linkedCardIds.length === 0) return null;
          const linkedCards = await ReactiveCache.getCards(
            { _id: { $in: linkedCardIds } },
            { fields: { boardId: 1, cardDependencies: 1 } },
            false,
          );
          const sourceBoardIds = [...new Set(linkedCards.map(card => card.boardId))];
          const dependencyIds = [...new Set(linkedCards.flatMap(card =>
            (card.cardDependencies || []).map(dependency =>
              typeof dependency === 'string' ? dependency : dependency && dependency.cardId,
            ),
          ).filter(Boolean))];
          if (dependencyIds.length === 0) return null;
          return await ReactiveCache.getCards(
            {
              _id: { $in: dependencyIds },
              boardId: { $in: sourceBoardIds },
            },
            {},
            true,
          );
        }
      },
      // Comments for linked cards
      {
        async find(board) {
          // Only the linked cards whose board this subscriber may see
          // (GHSA-jvv9-498p-hxrg class).
          const linkedCardIds = await visibleLinkedCardIds(board);
          if (linkedCardIds.length === 0) return null;

          return await ReactiveCache.getCardComments({ cardId: { $in: linkedCardIds } }, {}, true);
        }
      },
      // Attachments for linked cards
      {
        async find(board) {
          // Only the linked cards whose board this subscriber may see
          // (GHSA-jvv9-498p-hxrg class).
          const linkedCardIds = await visibleLinkedCardIds(board);
          if (linkedCardIds.length === 0) return null;

          const result = await ReactiveCache.getAttachments({ 'meta.cardId': { $in: linkedCardIds } }, {}, true);
          return result.cursor || result;
        }
      },
      // Checklists for linked cards
      {
        async find(board) {
          // Only the linked cards whose board this subscriber may see
          // (GHSA-jvv9-498p-hxrg class).
          const linkedCardIds = await visibleLinkedCardIds(board);
          if (linkedCardIds.length === 0) return null;

          return await ReactiveCache.getChecklists({ cardId: { $in: linkedCardIds } }, {}, true);
        }
      },
      // ChecklistItems for linked cards
      {
        async find(board) {
          // Only the linked cards whose board this subscriber may see
          // (GHSA-jvv9-498p-hxrg class).
          const linkedCardIds = await visibleLinkedCardIds(board);
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
                  // #6508: needed so the board member popup can offer "Remap User"
                  // for an imported (placeholder) member. isImportedMember() checks
                  // authenticationMethod === 'imported'; without this field the board
                  // members' user docs reach the client without it (user-miniprofile,
                  // which publishes safeFields incl. authenticationMethod, is only
                  // subscribed on the import screen), so the action never showed.
                  // Already in Users.safeFields, so publishing it here is consistent.
                  authenticationMethod: 1,
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
