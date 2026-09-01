import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import { TAPi18n } from '/imports/i18n';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { ReactiveCache } from '/imports/reactiveCache';
import { decideSandstormAutoOpen } from '/models/lib/sandstormAutoOpen';
import { cardBoardRedirectTarget } from '/models/lib/cardLinkRedirect';
import Settings from '/models/settings';
// The swimlane and list routes, whose paths are built beside the URLs they
// match so the two cannot disagree. models/lib/boardItemUrl.js
import { SWIMLANE_ROUTE_PATH, LIST_ROUTE_PATH } from '/models/lib/boardItemUrl';
import { EscapeActions } from '/client/lib/escapeActions';
import { Filter } from '/client/lib/filter';
import { Utils } from '/client/lib/utils';
// The Admin Panel's per-pane URLs: /admin/settings/version,
// /admin/people/login, /admin/problems/database and so on - the panel, the
// page and the pane, all three named in the address.
// docs/Design/Page/Admin-Panel-URLs.md
import {
  ADMIN_PAGES,
  resolvePaneId,
  adminPath,
  adminRoutePath,
} from '/models/lib/adminUrls';
// The All Boards page's URLs: /allboards/starred, /allboards/templates,
// /allboards/remaining, /allboards/workspaces/<name>/<sub-name>.
// docs/Design/Page/All-Boards-URLs.md
import {
  SECTION_WORKSPACES,
  resolveSection,
  splitWorkspacePath,
  allBoardsPath,
} from '/models/lib/allBoardsUrls';

let previousPath;

// On Sandstorm the grain is authenticated by the platform, not by a local WeKan
// account. That login is delivered asynchronously over the DDP connection (via
// connection.setUserId(), which — unlike a normal password login — does NOT set
// Meteor.loggingIn()), so for the first moments after a grain opens Meteor.userId()
// is still null even though the user is, and always will be, authenticated. There
// is no local sign-in page in a grain. useraccounts' ensureSignedIn would bounce the
// grain straight to the (nonexistent) atSignIn route on that brief null window,
// stranding the user on a "Must be logged in" page instead of opening All Boards.
const isSandstorm = Meteor.settings?.public?.sandstorm;

// Drop-in replacement for AccountsTemplates.ensureSignedIn used as a route
// triggersEnter: a no-op on Sandstorm (the platform guarantees authentication and
// the route repopulates reactively once Meteor.userId() lands), and the normal
// useraccounts guard everywhere else.
function ensureSignedInUnlessSandstorm(context, redirect, stop) {
  if (isSandstorm) {
    return undefined;
  }
  return AccountsTemplates.ensureSignedIn(context, redirect, stop);
}

FlowRouter.triggers.exit([
  ({ path }) => {
    previousPath = path;
  },
]);

// All Boards page. The left-menu sub-views (Templates, Remaining, Starred) are
// addressable via their own URL suffixes (#5850) so they can be linked and
// redirected to; the chosen view is passed to boardList through the
// `boardListMenu` Session value.
function renderBoardList(ctx, menu) {
  // Redirect to sign-in if the user is not logged in — except on Sandstorm, where
  // the platform authenticates asynchronously (see isSandstorm note above) and there
  // is no sign-in page. Also do NOT bounce while a login is IN PROGRESS
  // (Meteor.loggingIn(), e.g. auto-login from a stored token on a fresh page load, or
  // the tick right after submitting the login form): the userId lands a moment later
  // and the All Boards list fills in reactively, whereas bouncing here stranded a
  // returning / just-logged-in user on the sign-in page showing only the language
  // selector until a manual reload (WeKan 10.30 login regression).
  if (!Meteor.userId() && !Meteor.loggingIn() && !isSandstorm) {
    FlowRouter.go('atSignIn');
    return;
  }

  Session.set('currentBoard', null);
  Session.set('currentList', null);
  Session.set('currentCard', null);
  Session.set('popupCardId', null);
  Session.set('popupCardBoardId', null);
  // `null` when the address named no section, so the page can choose one.
  Session.set('boardListMenu', menu || null);
  Filter.reset();
  Session.set('sortBy', '');
  EscapeActions.executeAll();

  Utils.manageCustomUI();
  Utils.manageMatomo();

  ctx.render('defaultLayout', {
    content: 'boardList',
  });
}

// #2220: on the FIRST landing on '/' this session (i.e. right after login), send
// the user to their chosen default "home" board. Only once per session, so a
// later click on "All Boards" stays on the list, and the choice is honoured again
// on the next login / full reload. Returns true when it redirected.
function maybeRedirectToDefaultBoard() {
  if (Session.get('defaultBoardRedirectDone')) return false;
  Session.set('defaultBoardRedirectDone', true);

  if (!Meteor.userId()) return false;
  const user = ReactiveCache.getCurrentUser();
  const boardId = user && user.getDefaultBoardId && user.getDefaultBoardId();
  if (!boardId) return false;

  // Redirect by id right away — at login the board's own subscription may not have
  // loaded yet, so use its real slug when it happens to be cached and a harmless
  // placeholder otherwise (the board route resolves by :id). If the board was
  // deleted / access was removed, the board route degrades gracefully and the
  // "All Boards" link still works (this only redirects once per session).
  const board = ReactiveCache.getBoard(boardId);
  FlowRouter.go('board', { id: boardId, slug: (board && board.slug) || 'board' });
  return true;
}

// #2220 on Sandstorm: a grain historically opened straight into its single board.
// Restore that convenience — reactively, because a grain's login (Meteor.userId())
// and its boards subscription both arrive asynchronously after '/' first renders.
// Runs at most once per page load (grain session): a saved Home board wins; else
// exactly one board just opens (nothing saved — choosing a Home board is the separate
// explicit All Boards toggle); else (zero or many boards, nothing saved) we stay on
// the All Boards list. The decision itself is the pure, unit-tested
// decideSandstormAutoOpen(). Sandstorm-only (see the isSandstorm gate in the route).
let sandstormAutoOpenStarted = false;
function startSandstormAutoOpen() {
  if (sandstormAutoOpenStarted) return;
  sandstormAutoOpenStarted = true;

  const boardsHandle = Meteor.subscribe('boards');
  Tracker.autorun(computation => {
    const userReady = !!Meteor.userId();
    const user = userReady ? ReactiveCache.getCurrentUser() : null;
    const savedDefaultId = user && user.getDefaultBoardId && user.getDefaultBoardId();
    const boardsReady = boardsHandle.ready();

    let boardCount = 0;
    let onlyBoardId;
    if (userReady && boardsReady) {
      const boards = ReactiveCache.getBoards({
        archived: false,
        type: 'board',
        'members.userId': Meteor.userId(),
      });
      boardCount = boards.length;
      if (boardCount === 1) onlyBoardId = boards[0]._id;
    }

    const decision = decideSandstormAutoOpen({
      userReady,
      savedDefaultId,
      boardsReady,
      boardCount,
      onlyBoardId,
    });

    if (decision.action === 'wait') return; // inputs not ready — keep watching
    if (decision.action === 'redirect') {
      // Just open the board — nothing is persisted here.
      const board = ReactiveCache.getBoard(decision.boardId);
      FlowRouter.go('board', { id: decision.boardId, slug: (board && board.slug) || 'board' });
    }
    computation.stop(); // decided (redirected or staying) — done for this page load
  });
}

FlowRouter.route('/', {
  name: 'home',
  triggersEnter: [ensureSignedInUnlessSandstorm],
  action() {
    // On Sandstorm, render All Boards immediately and let the reactive auto-open
    // (above) redirect once the grain login + boards have loaded, if appropriate.
    if (isSandstorm) {
      startSandstormAutoOpen();
      renderBoardList(this, null);
      return;
    }
    if (maybeRedirectToDefaultBoard()) return;
    // `null`, not 'starred': `/` names no section, so which one to open is the
    // PAGE's to decide - Starred when the user has starred boards, Remaining
    // when they have none. The router runs before the user document has
    // necessarily loaded and cannot answer that.
    // models/lib/allBoardsUrls.js, client/components/boards/boardsList.js
    renderBoardList(this, null);
  },
});

// The old section URLs. They keep working, as redirects to the new structure -
// the same move /setting made. docs/Design/Page/All-Boards-URLs.md
FlowRouter.route('/templates', {
  name: 'allboards-templates',
  triggersEnter: [
    (context, redirect) => {
      redirect(allBoardsPath('templates', []));
    },
  ],
  action() {},
});

FlowRouter.route('/remaining', {
  name: 'allboards-remaining',
  triggersEnter: [
    (context, redirect) => {
      redirect(allBoardsPath('remaining', []));
    },
  ],
  action() {},
});

// All Boards, with a URL per left-menu entry - including the workspaces tree,
// which had none at all. `:path*` captures the whole rest of the address, so a
// workspace nests as deep as its tree does:
// /allboards/workspaces/engineering/backend. docs/Design/Page/All-Boards-URLs.md
//
// The WORKSPACE is resolved by the page, not here: the tree lives on the user
// document, which the router cannot read before the page has it. The router
// hands over the slugs; the page turns them into a workspace id once the tree
// has loaded, and falls back to Workspaces if they name nothing.
FlowRouter.route('/allboards/:section?/:path*', {
  name: 'allboards',
  triggersEnter: [ensureSignedInUnlessSandstorm],
  action(params) {
    const section = resolveSection(params && params.section);
    Session.set(
      'boardListWorkspacePath',
      section === SECTION_WORKSPACES ? splitWorkspacePath(params && params.path) : [],
    );
    renderBoardList(this, section);
  },
});

// Boards in Archive: a PAGE, not a modal.
//
// It was `Modal.open('archivedBoards')` from three menus, so the one place that
// lists every archived board - with its own search and its own pager - was a box
// floating over whatever you happened to be looking at, could not be linked or
// bookmarked, and closed if you pressed Escape while reading it. It is a page
// like any other now, with the same second top header bar, which is what
// "restore a board I archived last month" deserves.
FlowRouter.route('/archive', {
  name: 'archive',
  triggersEnter: [
    ensureSignedInUnlessSandstorm,
    () => {
      Session.set('currentBoard', null);
      Session.set('currentList', null);
      Session.set('currentCard', null);
      Session.set('popupCardId', null);
      Session.set('popupCardBoardId', null);

      Filter.reset();
      Session.set('sortBy', '');
      EscapeActions.executeAll();
    },
  ],
  action() {
    Utils.manageCustomUI();
    this.render('defaultLayout', {
      content: 'archivedBoards',
    });
  },
});

FlowRouter.route('/public', {
  name: 'public',
  triggersEnter: [ensureSignedInUnlessSandstorm],
  action() {
    Session.set('currentBoard', null);
    Session.set('currentList', null);
    Session.set('currentCard', null);
    Session.set('popupCardId', null);
    Session.set('popupCardBoardId', null);

    Filter.reset();
    Session.set('sortBy', '');
    EscapeActions.executeAll();

    Utils.manageCustomUI();
    Utils.manageMatomo();

    // /public is its own page now, not All Boards with a different query
    // (docs/Design/Page/Public.md): a read-only, paginated table of the boards
    // anybody may open. Rendering `boardList` here brought the Starred /
    // Templates / Remaining menu, the workspaces tree, Multi-Selection with its
    // archive and duplicate actions and an "Add board" tile with it — none of
    // which means anything for somebody else's public boards, and some of which
    // offered actions the visitor has no rights to.
    this.render('defaultLayout', {
      content: 'publicBoards',
    });
  },
});

FlowRouter.route('/accessibility', {
  name: 'accessibility',
  triggersEnter: [ensureSignedInUnlessSandstorm],
  action() {
    Session.set('currentBoard', null);
    Session.set('currentList', null);
    Session.set('currentCard', null);
    Session.set('popupCardId', null);
    Session.set('popupCardBoardId', null);

    Filter.reset();
    Session.set('sortBy', '');
    EscapeActions.executeAll();

    Utils.manageCustomUI();
    Utils.manageMatomo();

    this.render('defaultLayout', {
      content: 'accessibility',
    });
  },
});

FlowRouter.route('/support', {
  name: 'support',
  triggersEnter: [ensureSignedInUnlessSandstorm],
  action() {
    Session.set('currentBoard', null);
    Session.set('currentList', null);
    Session.set('currentCard', null);
    Session.set('popupCardId', null);
    Session.set('popupCardBoardId', null);

    Filter.reset();
    Session.set('sortBy', '');
    EscapeActions.executeAll();

    Utils.manageCustomUI();
    Utils.manageMatomo();

    this.render('defaultLayout', {
      content: 'support',
    });
  },
});

FlowRouter.route('/b/:id/:slug/rules', {
  name: 'board-rules',
  triggersEnter: [ensureSignedInUnlessSandstorm],
  action(params) {
    const currentBoard = params.id;
    Session.set('currentBoard', currentBoard);
    Session.set('currentCard', null);
    Session.set('popupCardId', null);
    Session.set('popupCardBoardId', null);

    EscapeActions.executeUpTo('popup-close');

    Utils.manageCustomUI();
    Utils.manageMatomo();

    this.render('defaultLayout', {
      content: 'rulesMain',
    });
  },
});

// Card route MUST be registered BEFORE board route so it matches first
// #4758: keep a card link working after the card is moved to another board. The
// URL carries the OLD board, which no longer contains the card, so resolve the
// card's CURRENT board via the permission-checked `card` publication and, if it
// differs, redirect there. When the user cannot see the card's new board (or it
// is gone) the subscription yields nothing and we stay on the URL's board. A
// single pending check at a time; the probe subscription is released once the
// board's own subscription owns the card.
let movedCardCheck = null;
function maybeRedirectMovedCard(urlBoardId, cardId) {
  if (movedCardCheck) {
    movedCardCheck.computation.stop();
    movedCardCheck.sub.stop();
    movedCardCheck = null;
  }
  if (!cardId) return;
  const sub = Meteor.subscribe('card', cardId);
  const computation = Tracker.autorun(c => {
    if (!sub.ready()) return;
    c.stop();
    const target = cardBoardRedirectTarget(urlBoardId, ReactiveCache.getCard(cardId));
    Meteor.defer(() => { try { sub.stop(); } catch (e) {} });
    movedCardCheck = null;
    if (target && FlowRouter.getParam('cardId') === cardId) {
      const board = ReactiveCache.getBoard(target);
      FlowRouter.go('card', {
        boardId: target,
        slug: (board && board.slug) || 'board',
        cardId,
      });
    }
  });
  movedCardCheck = { computation, sub };
}

// A swimlane and a list have an address of their own, so either can be linked
// the way a card can. FIVE segments against the card route's four, which is what
// keeps the three apart: a card route cannot match these and these cannot match
// a card. models/lib/boardItemUrl.js
//
// The route cannot scroll anything: it runs before the board has rendered, and
// on a board that is already open it runs without re-creating anything. So it
// names what to REVEAL in a Session value, and the board body reveals it once
// the element exists. docs/Design/Page/Board-Item-Links.md
FlowRouter.route(SWIMLANE_ROUTE_PATH, {
  name: 'swimlane',
  action(params) {
    Session.set('currentBoard', params.boardId);
    Session.set('currentCard', null);
    Session.set('popupCardId', null);
    Session.set('popupCardBoardId', null);
    Session.set('revealSwimlaneId', params.swimlaneId);
    Session.set('revealListId', null);

    Utils.manageCustomUI();
    Utils.manageMatomo();

    this.render('defaultLayout', {
      content: 'board',
    });
  },
});

FlowRouter.route(LIST_ROUTE_PATH, {
  name: 'list',
  action(params) {
    Session.set('currentBoard', params.boardId);
    Session.set('currentCard', null);
    Session.set('popupCardId', null);
    Session.set('popupCardBoardId', null);
    Session.set('revealListId', params.listId);
    Session.set('revealSwimlaneId', null);

    Utils.manageCustomUI();
    Utils.manageMatomo();

    this.render('defaultLayout', {
      content: 'board',
    });
  },
});

FlowRouter.route('/b/:boardId/:slug/:cardId', {
  name: 'card',
  action(params) {
    Session.set('currentBoard', params.boardId);
    Session.set('currentCard', params.cardId);
    // A reveal is about the address you just followed, so following another
    // one cancels it: without this, opening a card after a list link would
    // scroll the board away from the card it just opened.
    Session.set('revealSwimlaneId', null);
    Session.set('revealListId', null);
    Session.set('popupCardId', null);
    Session.set('popupCardBoardId', null);
    // #4758: if the card was moved to another board, redirect to its current one.
    maybeRedirectMovedCard(params.boardId, params.cardId);

    // In desktop mode, add to openCards array to support multiple cards
    const isMobile = Utils.getMobileMode();
    if (!isMobile) {
      const openCards = Session.get('openCards') || [];
      if (!openCards.includes(params.cardId)) {
        openCards.push(params.cardId);
        Session.set('openCards', openCards);
      }
    }

    Utils.manageCustomUI();
    Utils.manageMatomo();

    this.render('defaultLayout', {
      content: 'board',
    });
  },
});


FlowRouter.route('/b/:id', {
  name: 'board-short',
  action(params) {
    const board = ReactiveCache.getBoard(params.id);

    if (board && board.slug) {
      FlowRouter.go('board', { id: board._id, slug: board.slug });
      return;
    }

    Session.set('currentBoard', params.id);
    Session.set('currentCard', null);
    Session.set('popupCardId', null);
    Session.set('popupCardBoardId', null);

    Utils.manageCustomUI();
    Utils.manageMatomo();

    this.render('defaultLayout', {
      content: 'board',
    });
  },
});

FlowRouter.route('/b/:id/:slug', {
  name: 'board',
  action(params) {
    const currentBoard = params.id;
    const previousBoard = Session.get('currentBoard');
    Session.set('currentBoard', currentBoard);
    Session.set('currentCard', null);
    Session.set('revealSwimlaneId', null);
    Session.set('revealListId', null);
    Session.set('popupCardId', null);
    Session.set('popupCardBoardId', null);

    // If we close a card, we'll execute again this route action but we don't
    // want to excape every current actions (filters, etc.)
    if (previousBoard !== currentBoard) {
      Filter.reset();
      Session.set('sortBy', '');
      EscapeActions.executeAll();
    } else {
      EscapeActions.executeUpTo('popup-close');
    }

    Utils.manageCustomUI();
    Utils.manageMatomo();

    this.render('defaultLayout', {
      content: 'board',
    });
  },
});

FlowRouter.route('/shortcuts', {
  name: 'shortcuts',
  action() {
    const shortcutsTemplate = 'keyboardShortcuts';

    EscapeActions.executeUpTo('popup-close');

    if (previousPath) {
      Modal.open(shortcutsTemplate, {
        header: 'shortcutsModalTitle',
        onCloseGoTo: previousPath,
      });
    } else {
      this.render('defaultLayout', {
        content: shortcutsTemplate,
      });
    }
  },
});

FlowRouter.route('/b/templates', {
  name: 'template-container',
  triggersEnter: [ensureSignedInUnlessSandstorm],
  action() {
    Session.set('currentBoard', null);
    Session.set('currentList', null);
    Session.set('currentCard', null);
    Session.set('popupCardId', null);
    Session.set('popupCardBoardId', null);

    Filter.reset();
    Session.set('sortBy', '');
    EscapeActions.executeAll();

    Utils.manageCustomUI();
    Utils.manageMatomo();

    this.render('defaultLayout', {
      content: 'boardList',
    });
  },
});

FlowRouter.route('/my-cards', {
  name: 'my-cards',
  triggersEnter: [ensureSignedInUnlessSandstorm],
  action() {
    Filter.reset();
    Session.set('sortBy', '');
    // EscapeActions.executeAll();
    EscapeActions.executeUpTo('popup-close');

    Utils.manageCustomUI();
    Utils.manageMatomo();

    this.render('defaultLayout', {
      content: 'myCards',
    });
    // }
  },
});

FlowRouter.route('/mcp', {
  name: 'mcp',
  triggersEnter: [ensureSignedInUnlessSandstorm],
  action() {
    Session.set('currentBoard', null);
    Session.set('currentList', null);
    Session.set('currentCard', null);
    Session.set('popupCardId', null);
    Session.set('popupCardBoardId', null);
    Filter.reset();
    Session.set('sortBy', '');
    EscapeActions.executeUpTo('popup-close');
    Utils.manageCustomUI();
    Utils.manageMatomo();
    this.render('defaultLayout', { content: 'mcpHub' });
  },
});

FlowRouter.route('/due-cards', {
  name: 'due-cards',
  triggersEnter: [ensureSignedInUnlessSandstorm],
  action() {
    Filter.reset();
    Session.set('sortBy', '');
    // EscapeActions.executeAll();
    EscapeActions.executeUpTo('popup-close');

    Utils.manageCustomUI();
    Utils.manageMatomo();

    this.render('defaultLayout', {
      content: 'dueCards',
    });
    // }
  },
});

FlowRouter.route('/global-search', {
  name: 'global-search',
  triggersEnter: [ensureSignedInUnlessSandstorm],
  action() {
    Filter.reset();
    Session.set('sortBy', '');
    // EscapeActions.executeAll();
    EscapeActions.executeUpTo('popup-close');

    Utils.manageCustomUI();
    Utils.manageMatomo();

    // Set title with product name
    const settings = Settings.findOne({});
    const productName = (settings && settings.productName) ? settings.productName : 'Wekan';
    try {
      document.title = `${TAPi18n.__('globalSearch-title')} - ${productName}`;
    } catch (e) {
      document.title = `Search All Boards - ${productName}`;
    }

    if (FlowRouter.getQueryParam('q')) {
      Session.set(
        'globalQuery',
        decodeURIComponent(FlowRouter.getQueryParam('q')),
      );
    }
    this.render('defaultLayout', {
      content: 'globalSearch',
    });
  },
});

// Mobile Bookmarks page
FlowRouter.route('/bookmarks', {
  name: 'bookmarks',
  triggersEnter: [ensureSignedInUnlessSandstorm],
  action() {
    Filter.reset();
    Session.set('sortBy', '');
    EscapeActions.executeUpTo('popup-close');

    Utils.manageCustomUI();
    Utils.manageMatomo();

    this.render('defaultLayout', {
      content: 'boardList',
    });
  },
});

FlowRouter.route('/broken-cards', {
  name: 'broken-cards',
  action() {
    const brokenCardsTemplate = 'brokenCards';

    Filter.reset();
    Session.set('sortBy', '');
    // EscapeActions.executeAll();
    EscapeActions.executeUpTo('popup-close');

    Utils.manageCustomUI();
    Utils.manageMatomo();

    this.render('defaultLayout', {
      content: brokenCardsTemplate,
    });
  },
});

FlowRouter.route('/import/:source', {
  name: 'import',
  triggersEnter: [ensureSignedInUnlessSandstorm],
  action(params) {
    if (Session.get('currentBoard')) {
      Session.set('fromBoard', Session.get('currentBoard'));
    }
    Session.set('currentBoard', null);
    Session.set('currentList', null);
    Session.set('currentCard', null);
    Session.set('popupCardId', null);
    Session.set('popupCardBoardId', null);
    Session.set('importSource', params.source);

    Filter.reset();
    Session.set('sortBy', '');
    EscapeActions.executeAll();
    this.render('defaultLayout', {
      content: 'import',
    });
  },
});

// Admin Panel / Settings. Every left-menu entry has its own URL -
// /admin/settings/version, /admin/settings/visibility,
// /admin/settings/global-webhooks - so a pane can be linked, bookmarked,
// opened in a second tab and reached with the back button, and the address
// says which pane it is showing rather than leaving the first one unnamed.
// docs/Design/Page/Admin-Panel-URLs.md
//
// The pane is REQUIRED in the path. A bare page address is a redirect to its
// default pane's own address (below), not a second address for the same view.
FlowRouter.route(adminRoutePath('settings'), {
  name: 'setting',
  triggersEnter: [
    ensureSignedInUnlessSandstorm,
    () => {
      Session.set('currentBoard', null);
      Session.set('currentList', null);
      Session.set('currentCard', null);
      Session.set('popupCardId', null);
      Session.set('popupCardBoardId', null);

      Filter.reset();
      Session.set('sortBy', '');
      EscapeActions.executeAll();
    },
  ],
  action(params) {
    Utils.manageCustomUI();
    // An unknown slug falls back to the default pane rather than rendering a
    // panel with nothing in it - a URL is something a person types.
    Session.set('settingsOpenPane', resolvePaneId('settings', params && params.pane));
    this.render('defaultLayout', {
      content: 'setting',
    });
  },
});

// Where the panel's pages used to live, kept so bookmarks and old links keep
// working: the bare new address, the bare old one, and the old two-segment
// form with a pane in it. `/setting` - the singular odd one out - is in the
// list too.
//
// A trigger redirects with the `redirect` it is HANDED, never with
// FlowRouter.go(): go() from inside triggersEnter happens while this route is
// still entering and is swallowed, so nothing renders and the browser stays on
// whatever page it was showing.
Object.keys(ADMIN_PAGES).forEach(page => {
  const cfg = ADMIN_PAGES[page];
  const toDefault = (context, redirect) => redirect(adminPath(page, cfg.defaultSlug));
  // The bare new address: /admin/settings -> /admin/settings/version.
  FlowRouter.route(cfg.base, { triggersEnter: [toDefault], action() {} });
  // The bare old one: /settings -> /admin/settings/version.
  FlowRouter.route(cfg.legacyBase, { triggersEnter: [toDefault], action() {} });
  // The old form WITH a pane: /settings/global-webhooks keeps its pane, and an
  // unknown one falls back to the default rather than 404ing a bookmark.
  FlowRouter.route(`${cfg.legacyBase}/:pane`, {
    triggersEnter: [
      (context, redirect) => redirect(adminPath(page, (context.params || {}).pane)),
    ],
    action() {},
  });
});

// The singular path the Settings page used to answer on.
FlowRouter.route('/setting', {
  triggersEnter: [
    (context, redirect) => {
      redirect(adminPath('settings', 'version-setting'));
    },
  ],
  action() {},
});

// Version is the FIRST pane inside Admin Panel / Settings now, not a page of its
// own - the same move Translation made. The old URL stays valid and redirects
// there, so a bookmark does not land on a template that no longer exists.
//
// A trigger redirects with the `redirect` it is HANDED, not with FlowRouter.go():
// go() from inside triggersEnter happens while this route is still entering and is
// swallowed, so nothing was rendered at all and whatever page the browser was on
// stayed on screen - /information showed All Boards. This is the same form the
// redirections table at the bottom of this file uses.
FlowRouter.route('/information', {
  name: 'information',
  triggersEnter: [
    (context, redirect) => {
      // The pane it meant now HAS an address, so redirect to it instead of
      // asking the page for it through the Session.
      redirect(adminPath('settings', 'version-setting'));
    },
  ],
  action() {},
});

FlowRouter.route(adminRoutePath('people'), {
  name: 'people',
  triggersEnter: [
    ensureSignedInUnlessSandstorm,
    () => {
      Session.set('currentBoard', null);
      Session.set('currentList', null);
      Session.set('currentCard', null);
      Session.set('popupCardId', null);
      Session.set('popupCardBoardId', null);

      Filter.reset();
      Session.set('sortBy', '');
      EscapeActions.executeAll();
    },
  ],
  action(params) {
    // Which left-menu pane this URL means. An unknown slug falls back to the
    // page's default. docs/Design/Page/Admin-Panel-URLs.md
    Session.set('peopleOpenPane', resolvePaneId('people', params && params.pane));
    this.render('defaultLayout', {
      content: 'people',
    });
  },
});

FlowRouter.route(adminRoutePath('problems'), {
  name: 'admin-reports',
  triggersEnter: [
    ensureSignedInUnlessSandstorm,
    () => {
      Session.set('currentBoard', null);
      Session.set('currentList', null);
      Session.set('currentCard', null);
      Session.set('popupCardId', null);
      Session.set('popupCardBoardId', null);

      Filter.reset();
      Session.set('sortBy', '');
      EscapeActions.executeAll();
    },
  ],
  action(params) {
    // Which left-menu pane this URL means. An unknown slug falls back to the
    // page's default. docs/Design/Page/Admin-Panel-URLs.md
    Session.set('problemsOpenPane', resolvePaneId('problems', params && params.pane));
    this.render('defaultLayout', {
      content: 'adminReports',
    });
  },
});

FlowRouter.route(adminRoutePath('attachments'), {
  name: 'attachments',
  triggersEnter: [
    ensureSignedInUnlessSandstorm,
    () => {
      Session.set('currentBoard', null);
      Session.set('currentList', null);
      Session.set('currentCard', null);
      Session.set('popupCardId', null);
      Session.set('popupCardBoardId', null);

      Filter.reset();
      Session.set('sortBy', '');
      EscapeActions.executeAll();
    },
  ],
  action(params) {
    // Which left-menu pane this URL means. An unknown slug falls back to the
    // page's default. docs/Design/Page/Admin-Panel-URLs.md
    Session.set('attachmentsOpenPane', resolvePaneId('attachments', params && params.pane));
    this.render('defaultLayout', {
      content: 'attachments',
    });
  },
});

// Translation is a pane inside Admin Panel / Settings now, not a page of its own.
// The old URL stays valid and redirects there, so a bookmark does not land on a
// template that no longer exists.
FlowRouter.route('/translation', {
  name: 'translation',
  triggersEnter: [
    (context, redirect) => {
      redirect(adminPath('settings', 'translation-setting'));
    },
  ],
  action() {},
});

FlowRouter.route('*', {
  action() {
    this.render('defaultLayout', { content: 'notFound' });
  },
});

// We maintain a list of redirections to ensure that we don't break old URLs
// when we change our routing scheme.
const redirections = {
  '/boards': '/',
  '/boards/:id/:slug': '/b/:id/:slug',
  '/boards/:id/:slug/:cardId': '/b/:id/:slug/:cardId',
  '/import': '/import/trello',
};

Object.entries(redirections).forEach(([oldPath, newPath]) => {
  FlowRouter.route(oldPath, {
    triggersEnter: [
      (context, redirect) => {
        redirect(FlowRouter.path(newPath, context.params));
      },
    ],
  });
});

// As it is not possible to use template helpers in the page <head> we create a
// reactive function whose role is to set any page-specific tag in the <head>
// using the `kadira:dochead` package. Currently we only use it to display the
// board title if we are in a board page (see #364) but we may want to support
// some <meta> tags in the future.
//const appTitle = Utils.manageCustomUI();

// XXX The `Meteor.startup` should not be necessary -- we don't need to wait for
// the complete DOM to be ready to call `DocHead.setTitle`. But the problem is
// that the global variable `Boards` is undefined when this file loads so we
// wait a bit until hopefully all files are loaded. This will be fixed in a
// clean way once Meteor will support ES6 modules -- hopefully in Meteor 1.3.
//Meteor.isClient && Meteor.startup(() => {
//  Tracker.autorun(() => {

//    const currentBoard = Utils.getCurrentBoard();
//    const titleStack = [appTitle];
//    if (currentBoard) {
//      titleStack.push(currentBoard.title);
//    }
//    DocHead.setTitle(titleStack.reverse().join(' - '));
//  });
//});
