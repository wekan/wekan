import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import { TAPi18n } from '/imports/i18n';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { ReactiveCache } from '/imports/reactiveCache';
import { decideSandstormAutoOpen } from '/models/lib/sandstormAutoOpen';
import Settings from '/models/settings';
import { EscapeActions } from '/client/lib/escapeActions';
import { Filter } from '/client/lib/filter';
import { Utils } from '/client/lib/utils';

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
  // Redirect to sign-in immediately if user is not logged in — except on Sandstorm,
  // where the platform authenticates asynchronously (see isSandstorm note above) and
  // there is no sign-in page. There we render the All Boards list, which reactively
  // fills in once the grain login lands, instead of bouncing to atSignIn.
  if (!Meteor.userId() && !isSandstorm) {
    FlowRouter.go('atSignIn');
    return;
  }

  Session.set('currentBoard', null);
  Session.set('currentList', null);
  Session.set('currentCard', null);
  Session.set('popupCardId', null);
  Session.set('popupCardBoardId', null);
  Session.set('boardListMenu', menu);
  Filter.reset();
  Session.set('sortBy', '');
  EscapeActions.executeAll();

  Utils.manageCustomUI();
  Utils.manageMatomo();

  ctx.render('defaultLayout', {
    headerBar: 'boardListHeaderBar',
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
      renderBoardList(this, 'starred');
      return;
    }
    if (maybeRedirectToDefaultBoard()) return;
    renderBoardList(this, 'starred');
  },
});

FlowRouter.route('/templates', {
  name: 'allboards-templates',
  triggersEnter: [ensureSignedInUnlessSandstorm],
  action() {
    renderBoardList(this, 'templates');
  },
});

FlowRouter.route('/remaining', {
  name: 'allboards-remaining',
  triggersEnter: [ensureSignedInUnlessSandstorm],
  action() {
    renderBoardList(this, 'remaining');
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

    this.render('defaultLayout', {
      headerBar: 'boardListHeaderBar',
      content: 'boardList',
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
      headerBar: 'accessibilityHeaderBar',
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
      headerBar: 'supportHeaderBar',
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
      headerBar: 'rulesHeaderBar',
      content: 'rulesMain',
    });
  },
});

// Card route MUST be registered BEFORE board route so it matches first
FlowRouter.route('/b/:boardId/:slug/:cardId', {
  name: 'card',
  action(params) {
    Session.set('currentBoard', params.boardId);
    Session.set('currentCard', params.cardId);
    Session.set('popupCardId', null);
    Session.set('popupCardBoardId', null);

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
      headerBar: 'boardHeaderBar',
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
      headerBar: 'boardHeaderBar',
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
      headerBar: 'boardHeaderBar',
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
        headerBar: 'shortcutsHeaderBar',
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
      headerBar: 'boardListHeaderBar',
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
      headerBar: 'myCardsHeaderBar',
      content: 'myCards',
    });
    // }
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
      headerBar: 'dueCardsHeaderBar',
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
      headerBar: 'globalSearchHeaderBar',
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
      headerBar: 'boardListHeaderBar',
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
      headerBar: 'brokenCardsHeaderBar',
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
      headerBar: 'importHeaderBar',
      content: 'import',
    });
  },
});

FlowRouter.route('/setting', {
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
  action() {
    Utils.manageCustomUI();
    this.render('defaultLayout', {
      headerBar: 'settingHeaderBar',
      content: 'setting',
    });
  },
});

FlowRouter.route('/information', {
  name: 'information',
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
    this.render('defaultLayout', {
      headerBar: 'settingHeaderBar',
      content: 'information',
    });
  },
});

FlowRouter.route('/people', {
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
  action() {
    this.render('defaultLayout', {
      headerBar: 'settingHeaderBar',
      content: 'people',
    });
  },
});

FlowRouter.route('/admin-reports', {
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
  action() {
    this.render('defaultLayout', {
      headerBar: 'settingHeaderBar',
      content: 'adminReports',
    });
  },
});

FlowRouter.route('/attachments', {
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
  action() {
    this.render('defaultLayout', {
      headerBar: 'settingHeaderBar',
      content: 'attachments',
    });
  },
});

FlowRouter.route('/translation', {
  name: 'translation',
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
    this.render('defaultLayout', {
      headerBar: 'settingHeaderBar',
      content: 'translation',
    });
  },
});

FlowRouter.route('/admin-features', {
  name: 'admin-features',
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
    this.render('defaultLayout', {
      headerBar: 'settingHeaderBar',
      content: 'adminFeatures',
    });
  },
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
