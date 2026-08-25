import { ReactiveCache } from '/imports/reactiveCache';
import { headerPathVar } from '/client/lib/headerPathVar';
const { pageDocumentTitle } = require('/models/lib/starredPages');
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { Tracker } from 'meteor/tracker';
import { findWhere, where, uniqBy, groupBy, indexBy, debounce, once } from '/imports/lib/collectionHelpers';
import Settings from '/models/settings';
import Users from '/models/users';
import { computeBoardBackground } from '/models/lib/boardBackground';
import { buildCardAttachmentMeta } from '/models/lib/attachmentMeta';
import { resolveShowDragHandles, readDragHandlesPreference } from '/models/lib/dragHandles';
const { memberCan } = require('/models/lib/boardRoleCapabilities');

// One key for both pages: they draw one menu. docs/Features/Page/Left-Menu.md
const LEFT_MENU_COLLAPSED_KEY = 'leftMenuCollapsed';
const LEFT_MENU_WIDTH_KEY = 'leftMenuWidth';

export const Utils = {
  async setBackgroundImage(url) {
    const currentBoard = Utils.getCurrentBoard();
    const bg = computeBoardBackground(currentBoard);
    const swimlaneSelector =
      ".swimlane,.swimlane .list,.swimlane .list .list-body,.swimlane .list:first-child .list-body";
    if (bg.type === "image") {
      $(".board-wrapper").css({ "background": "url(" + bg.url + ")", "background-size": "cover" });
      $(swimlaneSelector).css({ "background-color": "transparent" });
      $(".minicard").css({ "opacity": "0.9" });
    } else {
      // #4978: clear any inline background left over from a previously shown
      // board, so switching image -> color or image -> plain (e.g. via the
      // favorites bar) actually removes the old image. The board's color, when
      // any, is applied reactively via the `.board-wrapper` colorClass.
      $(".board-wrapper").css({ "background": "", "background-size": "" });
      $(swimlaneSelector).css({ "background-color": "" });
      $(".minicard").css({ "opacity": "" });
    }
  },
  /** returns the current board id
   * <li> returns the current board id or the board id of the popup card if set
   */
  getCurrentBoardId() {
    let popupCardBoardId = Session.get('popupCardBoardId');
    let currentBoard = Session.get('currentBoard');
    let ret = currentBoard;
    if (popupCardBoardId) {
      ret = popupCardBoardId;
    }
    return ret;
  },
  getCurrentCardId(ignorePopupCard) {
    let ret = Session.get('currentCard');
    if (!ret && !ignorePopupCard) {
      ret = Utils.getPopupCardId();
    }
    return ret;
  },
  getPopupCardId() {
    const ret = Session.get('popupCardId');
    return ret;
  },
  getCurrentListId() {
    const ret = Session.get('currentList');
    return ret;
  },
  /** returns the current board
   * <li> returns the current board or the board of the popup card if set
   */
  getCurrentBoard() {
    const boardId = Utils.getCurrentBoardId();
    const ret = ReactiveCache.getBoard(boardId);
    return ret;
  },
  getCurrentCard(ignorePopupCard) {
    const cardId = Utils.getCurrentCardId(ignorePopupCard);
    if (!cardId) {
      return null;
    }
    const ret = ReactiveCache.getCard(cardId);
    return ret;
  },

  // Mobile mode utilities
  getMobileMode() {
    // Check localStorage first - user's explicit preference takes priority
    const stored = localStorage.getItem('wekan-mobile-mode');
    if (stored !== null) {
      return stored === 'true';
    }

    // Then check user profile
    const user = ReactiveCache.getCurrentUser();
    if (user && user.profile && user.profile.mobileMode !== undefined) {
      return user.profile.mobileMode;
    }

    // No explicit preference: detect from the VIEWPORT, not the user-agent.
    // UA string parsing is unreliable across the many mobile browsers (Firefox,
    // Chrome, Safari, postmarketOS, Ubuntu Touch Morph, ...) and is exactly the
    // kind of fragile detection that bites projects — cf. Meteor #12421, where
    // Mobile Safari version parsing was wrong. matchMedia width/pointer queries
    // are well-supported and, importantly, match the CSS `@media (max-width:
    // 800px)` breakpoint, so the body.mobile-mode class and the responsive CSS
    // agree. A narrow screen, or a coarse (touch) pointer on a not-wide screen,
    // gets mobile mode; wide desktop windows (fine pointer) stay desktop.
    // NOTE: requires the width=device-width viewport meta (see
    // server/lib/customHeadRender.js); without it window.innerWidth reports ~980
    // on phones and this would never trigger.
    const mq = q =>
      typeof window !== 'undefined' && window.matchMedia && window.matchMedia(q).matches;
    const narrow = mq('(max-width: 800px)');
    const coarse = mq('(pointer: coarse)');
    return Boolean(narrow || (coarse && window.innerWidth <= 1024));
  },

  // The user's EXPLICIT mobile-mode choice, or null if they have never made one.
  // getMobileMode() cannot answer this: it falls back to viewport detection and so
  // always returns a boolean, which is why the "has the user chosen?" test inside
  // isMiniScreen() was always true.
  getExplicitMobileMode() {
    const stored = localStorage.getItem('wekan-mobile-mode');
    if (stored !== null) {
      return stored === 'true';
    }
    const user = ReactiveCache.getCurrentUser();
    if (user && user.profile && user.profile.mobileMode !== undefined) {
      return user.profile.mobileMode;
    }
    return null;
  },

  setMobileMode(enabled) {
    const user = ReactiveCache.getCurrentUser();
    if (user) {
      // Update user profile
      user.setMobileMode(enabled);
    }
    // Always store in localStorage for persistence across sessions
    localStorage.setItem('wekan-mobile-mode', enabled.toString());
    Utils.applyMobileMode(enabled);
    // Trigger reactive updates for UI components
    Session.set('wekan-mobile-mode', enabled);
  },

  getCardZoom() {
    const user = ReactiveCache.getCurrentUser();
    if (user && user.profile && user.profile.cardZoom !== undefined) {
      return user.profile.cardZoom;
    }
    const stored = localStorage.getItem('wekan-card-zoom');
    return stored ? parseFloat(stored) : 1.0;
  },

  setCardZoom(level) {
    const user = ReactiveCache.getCurrentUser();
    if (user) {
      user.setCardZoom(level);
    }
    localStorage.setItem('wekan-card-zoom', level.toString());
    Utils.applyCardZoom(level);
    Session.set('wekan-card-zoom', level);
  },

  applyCardZoom(level) {
    const cardDetails = document.querySelector('.card-details');
    if (cardDetails) {
      cardDetails.style.fontSize = `${level}em`;
    }
  },

  applyMobileMode(enabled) {
    const body = document.body;
    if (enabled) {
      body.classList.add('mobile-mode');
      body.classList.remove('desktop-mode');
    } else {
      body.classList.add('desktop-mode');
      body.classList.remove('mobile-mode');
    }
  },

  initializeUserSettings() {
    // Apply saved settings on page load
    const mobileMode = Utils.getMobileMode();
    Utils.applyMobileMode(mobileMode);

    // #6419: keep mobile-mode in sync with the viewport (resize / orientation /
    // responsive testing) when the user has NOT explicitly chosen a mode. Bound
    // once. An explicit toggle (localStorage or profile) must stick, so we skip
    // auto-switching in that case.
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      !Utils._mobileModeAutoBound
    ) {
      Utils._mobileModeAutoBound = true;
      const reapply = () => {
        const stored = localStorage.getItem('wekan-mobile-mode');
        const user = ReactiveCache.getCurrentUser();
        const explicit =
          stored !== null ||
          (user && user.profile && user.profile.mobileMode !== undefined);
        if (!explicit) {
          Utils.applyMobileMode(Utils.getMobileMode());
        }
      };
      window.matchMedia('(max-width: 800px)').addEventListener('change', reapply);
      window.matchMedia('(pointer: coarse)').addEventListener('change', reapply);
    }
  },
  getCurrentList() {
    const listId = this.getCurrentListId();
    let ret = null;
    if (listId) {
      ret = ReactiveCache.getList(listId);
    }
    return ret;
  },
  getPopupCard() {
    const cardId = Utils.getPopupCardId();
    const ret = ReactiveCache.getCard(cardId);
    return ret;
  },
  // What the UI OFFERS, from the same capability table the server decides with
  // (models/lib/boardRoleCapabilities.js).
  //
  // These three used to be their own lists of flags, and each one disagreed with
  // the server rule in a different place - `canModifyCard` did not exclude
  // `isNoComments` while the server did, `canModifyBoard` excluded neither
  // `isNoComments` nor `isWorker`, and none of them knew about
  // `isCommentAssignedOnly`. Every disagreement was a button offered to somebody
  // whose write the server then refused, which reads as a bug to the person
  // clicking it. Reading the one table is what keeps them honest.
  currentUserCan(capability, board = Utils.getCurrentBoard()) {
    const userId = Meteor.userId();
    return !!(board && memberCan(board.members, userId, capability));
  },
  canModifyCard(card = Utils.getCurrentCard()) {
    const board = card && typeof card.board === 'function'
      ? card.board()
      : Utils.getCurrentBoard();
    return Utils.currentUserCan('write', board);
  },
  // A move is a card update on the server, but it is NOT the same capability: a
  // Worker may move a card and assign themselves to it while writing nothing else
  // (#3189, models/lib/workerCardWrite.js enforces exactly that field by field).
  // Every role that can `write` can also move, so this only ever ADDS the Worker.
  canMoveCard() {
    return Utils.currentUserCan('moveCard');
  },
  canModifyBoard() {
    return Utils.currentUserCan('write');
  },
  reload() {
    // we move all window.location.reload calls into this function
    // so we can disable it when running tests.
    // This is because we are not allowed to override location.reload but
    // we can override Utils.reload to prevent reload during tests.
    window.location.reload();
  },
  setBoardView(view) {
    const currentUser = ReactiveCache.getCurrentUser();

    if (currentUser) {
      // Update localStorage first
      window.localStorage.setItem('boardView', view);

      // Update user profile via Meteor method
      Meteor.call('setBoardView', view, (error) => {
        if (error) {
          console.error('[setBoardView] Update failed:', error);
        } else {
          // Reload to apply the view change
          Utils.reload();
        }
      });
    } else if (view === 'board-view-swimlanes') {
      window.localStorage.setItem('boardView', 'board-view-swimlanes'); //true
      Utils.reload();
    } else if (view === 'board-view-lists') {
      window.localStorage.setItem('boardView', 'board-view-lists'); //true
      Utils.reload();
    } else if (view === 'board-view-cal') {
      window.localStorage.setItem('boardView', 'board-view-cal'); //true
      Utils.reload();
    } else if (view === 'board-view-gantt') {
      window.localStorage.setItem('boardView', 'board-view-gantt'); //true
      Utils.reload();
    } else if (view === 'board-view-table') {
      window.localStorage.setItem('boardView', 'board-view-table'); //true
      Utils.reload();
    } else {
      window.localStorage.setItem('boardView', 'board-view-swimlanes'); //true
      Utils.reload();
    }
  },

  unsetBoardView() {
    window.localStorage.removeItem('boardView');
    window.localStorage.removeItem('collapseSwimlane');
  },

  boardView() {
    const currentUser = ReactiveCache.getCurrentUser();
    if (currentUser) {
      return (currentUser.profile || {}).boardView;
    } else if (
      window.localStorage.getItem('boardView') === 'board-view-swimlanes'
    ) {
      return 'board-view-swimlanes';
    } else if (
      window.localStorage.getItem('boardView') === 'board-view-lists'
    ) {
      return 'board-view-lists';
    } else if (window.localStorage.getItem('boardView') === 'board-view-cal') {
      return 'board-view-cal';
    } else if (window.localStorage.getItem('boardView') === 'board-view-gantt') {
      return 'board-view-gantt';
    } else if (
      window.localStorage.getItem('boardView') === 'board-view-table'
    ) {
      return 'board-view-table';
    } else {
      window.localStorage.setItem('boardView', 'board-view-swimlanes'); //true
      Utils.reload();
      return 'board-view-swimlanes';
    }
  },

  getListCollapseState(list) {
    if (!list) return false;
    const key = `collapsedList-${list._id}`;
    const sessionVal = Session.get(key);
    if (typeof sessionVal === 'boolean') {
      return sessionVal;
    }

    const user = ReactiveCache.getCurrentUser();
    let stored = null;
    if (user && user.getCollapsedListFromStorage) {
      stored = user.getCollapsedListFromStorage(list.boardId, list._id);
    } else if (Users.getPublicCollapsedList) {
      stored = Users.getPublicCollapsedList(list.boardId, list._id);
    }

    if (typeof stored === 'boolean') {
      Session.setDefault(key, stored);
      return stored;
    }

    const fallback = typeof list.collapsed === 'boolean' ? list.collapsed : false;
    Session.setDefault(key, fallback);
    return fallback;
  },

  setListCollapseState(list, collapsed) {
    if (!list) return;
    const key = `collapsedList-${list._id}`;
    Session.set(key, !!collapsed);
    const user = ReactiveCache.getCurrentUser();
    if (user) {
      Meteor.call('setListCollapsedState', list.boardId, list._id, !!collapsed);
    } else if (Users.setPublicCollapsedList) {
      Users.setPublicCollapsedList(list.boardId, list._id, !!collapsed);
    }
  },

  // The left menu's collapse state, the same shape as a list's above: a Session
  // value so the fold is instant and survives a re-render, and the user
  // document behind it so it survives a reload and follows the reader to their
  // other browser.
  //
  // ONE state for both pages. All Boards and the Admin Panel draw one menu, and
  // a reader who folds it away on one of them has said what they want on the
  // other. docs/Features/Page/Left-Menu.md
  getLeftMenuCollapseState() {
    const sessionVal = Session.get(LEFT_MENU_COLLAPSED_KEY);
    if (typeof sessionVal === 'boolean') return sessionVal;

    const user = ReactiveCache.getCurrentUser();
    const stored = user && user.isLeftMenuCollapsed
      ? user.isLeftMenuCollapsed()
      // Signed out - a public board has this menu too - so it is kept in a
      // cookie, the same way the public list and swimlane collapse states are
      // (models/users.js). `null` means it has never been set.
      : Users.getPublicLeftMenuCollapsed
        ? Users.getPublicLeftMenuCollapsed() === true
        : false;
    Session.setDefault(LEFT_MENU_COLLAPSED_KEY, stored);
    return stored;
  },

  setLeftMenuCollapseState(collapsed) {
    Session.set(LEFT_MENU_COLLAPSED_KEY, !!collapsed);
    if (ReactiveCache.getCurrentUser()) {
      Meteor.call('setLeftMenuCollapsed', !!collapsed);
      return;
    }
    if (Users.setPublicLeftMenuCollapsed) {
      Users.setPublicLeftMenuCollapsed(!!collapsed);
    }
  },

  // The width that menu was dragged to, kept in the same three layers as its
  // fold - Session first, then the user's profile, then a cookie for a reader
  // who is not signed in.
  //
  // `undefined` when nobody has ever dragged it, and that is deliberate: the
  // DEFAULT width is a number in the stylesheet, and returning one here too
  // would be a second copy of it to keep in step.
  // docs/Features/Page/Left-Menu.md
  getLeftMenuWidth() {
    const sessionVal = Session.get(LEFT_MENU_WIDTH_KEY);
    if (typeof sessionVal === 'number') return sessionVal;

    const user = ReactiveCache.getCurrentUser();
    const stored = user && user.getLeftMenuWidth
      ? user.getLeftMenuWidth()
      : Users.getPublicLeftMenuWidth
        ? Users.getPublicLeftMenuWidth()
        : undefined;
    // Only a real width is cached in the Session. `setDefault(key, undefined)`
    // would make the key look SET on the next read, and the profile arriving a
    // moment later - the user document is not there on the first render - would
    // then never be picked up.
    if (typeof stored === 'number') {
      Session.setDefault(LEFT_MENU_WIDTH_KEY, stored);
      return stored;
    }
    return undefined;
  },

  setLeftMenuWidth(width) {
    const rounded = Math.round(width);
    Session.set(LEFT_MENU_WIDTH_KEY, rounded);
    if (ReactiveCache.getCurrentUser()) {
      Meteor.call('setLeftMenuWidth', rounded);
      return;
    }
    if (Users.setPublicLeftMenuWidth) {
      Users.setPublicLeftMenuWidth(rounded);
    }
  },

  // Is this workspace of the All Boards left menu folded? The same three layers
  // the left menu's own fold uses: a Session value so the caret answers at once,
  // the user's profile behind it, and a cookie for a reader who is not signed
  // in. OPEN is the default - a tree that opened folded would hide the
  // workspaces a reader has never touched.
  // docs/Features/Page/Workspaces.md
  getWorkspaceCollapseState(workspaceId) {
    if (!workspaceId) return false;
    const key = `collapsedWorkspace-${workspaceId}`;
    const sessionVal = Session.get(key);
    if (typeof sessionVal === 'boolean') return sessionVal;

    const user = ReactiveCache.getCurrentUser();
    const stored = user && user.isWorkspaceCollapsed
      ? user.isWorkspaceCollapsed(workspaceId)
      : Users.getPublicCollapsedWorkspaces
        ? Users.getPublicCollapsedWorkspaces()[workspaceId] === true
        : false;
    Session.setDefault(key, stored);
    return stored;
  },

  setWorkspaceCollapseState(workspaceId, collapsed) {
    if (!workspaceId) return;
    Session.set(`collapsedWorkspace-${workspaceId}`, !!collapsed);
    if (ReactiveCache.getCurrentUser()) {
      Meteor.call('setWorkspaceCollapsed', workspaceId, !!collapsed);
      return;
    }
    if (Users.setPublicCollapsedWorkspace) {
      Users.setPublicCollapsedWorkspace(workspaceId, !!collapsed);
    }
  },

  getSwimlaneCollapseState(swimlane) {
    if (!swimlane) return false;
    const key = `collapsedSwimlane-${swimlane._id}`;
    const sessionVal = Session.get(key);
    if (typeof sessionVal === 'boolean') {
      return sessionVal;
    }

    const user = ReactiveCache.getCurrentUser();
    let stored = null;
    if (user && user.getCollapsedSwimlaneFromStorage) {
      stored = user.getCollapsedSwimlaneFromStorage(
        swimlane.boardId,
        swimlane._id,
      );
    } else if (Users.getPublicCollapsedSwimlane) {
      stored = Users.getPublicCollapsedSwimlane(swimlane.boardId, swimlane._id);
    }

    if (typeof stored === 'boolean') {
      Session.setDefault(key, stored);
      return stored;
    }

    const fallback = typeof swimlane.collapsed === 'boolean' ? swimlane.collapsed : false;
    Session.setDefault(key, fallback);
    return fallback;
  },

  setSwimlaneCollapseState(swimlane, collapsed) {
    if (!swimlane) return;
    const key = `collapsedSwimlane-${swimlane._id}`;
    Session.set(key, !!collapsed);
    const user = ReactiveCache.getCurrentUser();
    if (user) {
      Meteor.call('setSwimlaneCollapsedState', swimlane.boardId, swimlane._id, !!collapsed);
    } else if (Users.setPublicCollapsedSwimlane) {
      Users.setPublicCollapsedSwimlane(swimlane.boardId, swimlane._id, !!collapsed);
    }
  },

  myCardsSort() {
    let sort = window.localStorage.getItem('myCardsSort');

    if (!sort || !['board', 'dueAt'].includes(sort)) {
      sort = 'board';
    }

    return sort;
  },

  myCardsSortToggle() {
    if (this.myCardsSort() === 'board') {
      this.setMyCardsSort('dueAt');
    } else {
      this.setMyCardsSort('board');
    }
  },

  setMyCardsSort(sort) {
    window.localStorage.setItem('myCardsSort', sort);
    Utils.reload();
  },

  archivedBoardIds() {
    const ret = ReactiveCache.getBoards({ archived: false }).map(board => board._id);
    return ret;
  },

  dueCardsView() {
    let view = window.localStorage.getItem('dueCardsView');

    if (!view || !['me', 'all'].includes(view)) {
      view = 'me';
    }

    return view;
  },

  setDueCardsView(view) {
    window.localStorage.setItem('dueCardsView', view);
    Utils.reload();
  },

  // #global search "my cards / all cards" toggle. Reactive (Session) so the
  // search re-runs immediately without a full page reload; persisted in
  // localStorage. Defaults to 'all' (search everything).
  globalSearchView() {
    const view =
      Session.get('globalSearchView') ||
      window.localStorage.getItem('globalSearchView');
    return view && ['me', 'all'].includes(view) ? view : 'all';
  },

  setGlobalSearchView(view) {
    const next = ['me', 'all'].includes(view) ? view : 'all';
    window.localStorage.setItem('globalSearchView', next);
    Session.set('globalSearchView', next);
  },

  myCardsView() {
    let view = window.localStorage.getItem('myCardsView');

    if (!view || !['boards', 'table'].includes(view)) {
      view = 'boards';
    }

    return view;
  },

  setMyCardsView(view) {
    window.localStorage.setItem('myCardsView', view);
    Utils.reload();
  },

  // XXX We should remove these two methods
  goBoardId(_id) {
    const board = ReactiveCache.getBoard(_id);
    return (
      board &&
      FlowRouter.go('board', {
        id: board._id,
        slug: board.slug,
      })
    );
  },

  goCardId(_id) {
    const card = ReactiveCache.getCard(_id);
    const board = ReactiveCache.getBoard(card.boardId);
    return (
      board &&
      FlowRouter.go('card', {
        cardId: card._id,
        boardId: board._id,
        slug: board.slug,
        swimlaneId: card.swimlaneId,
        listId: card.listId,
      })
    );
  },
  // Shared by every card attachment upload path — the card Attachments popup,
  // the clipboard upload AND images uploaded inside card comments through the
  // rich text editor (client/components/main/editor.js). Keeping the meta
  // identical (same meta.cardId) is what makes comment attachments appear in
  // the card's Attachments list (#3843); the actual logic lives in
  // models/lib/attachmentMeta.js so it can be unit tested.
  getCommonAttachmentMetaFrom(card) {
    return buildCardAttachmentMeta(card, id => ReactiveCache.getCard(id));
  },
  // Collection helpers (replacing underscore.js)
  findWhere,
  where,
  uniqBy,
  groupBy,
  indexBy,
  debounce,
  once,

  MAX_IMAGE_PIXEL: Meteor.settings.public.MAX_IMAGE_PIXEL,
  COMPRESS_RATIO: Meteor.settings.public.IMAGE_COMPRESS_RATIO,
  shrinkImage(options) {
    // shrink image to certain size
    const dataurl = options.dataurl,
      callback = options.callback,
      toBlob = options.toBlob;
    let canvas = document.createElement('canvas'),
      image = document.createElement('img');
    const maxSize = options.maxSize || 1024;
    const ratio = options.ratio || 1.0;
    const next = function (result) {
      image = null;
      canvas = null;
      if (typeof callback === 'function') {
        callback(result);
      }
    };
    image.onload = function () {
      let width = this.width,
        height = this.height;
      let changed = false;
      if (width > height) {
        if (width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
          changed = true;
        }
      } else if (height > maxSize) {
        width *= maxSize / height;
        height = maxSize;
        changed = true;
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(this, 0, 0, width, height);
      if (changed === true) {
        const type = 'image/jpeg';
        if (toBlob) {
          canvas.toBlob(next, type, ratio);
        } else {
          next(canvas.toDataURL(type, ratio));
        }
      } else {
        next(changed);
      }
    };
    image.onerror = function () {
      next(false);
    };
    image.src = dataurl;
  },
  capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  },

  windowResizeDep: new Tracker.Dependency(),
  // in fact, what we really care is screen size
  // large mobile device like iPad or android Pad has a big screen, it should also behave like a desktop
  // in a small window (even on desktop), Wekan run in compact mode.
  // we can easily debug with a small window of desktop browser. :-)
  isMiniScreen() {
    this.windowResizeDep.depend();
    // Also depend on mobile mode changes to make this reactive
    Session.get('wekan-mobile-mode');

    // Show mobile view when:
    // 1. Screen width is 800px or less (matches CSS media queries)
    // 2. Mobile phones in portrait mode
    // 3. iPad in very small screens (≤ 600px)
    // 4. All iPhone models by default (including largest models), but respect user preference
    // An explicit choice wins on EVERY device, not just on an iPhone. Turning mobile
    // mode on in desktop Firefox set body.mobile-mode but left this false, because the
    // branches below only look at screen width and user agent. The two disagreed, and
    // the parts of the mobile layout driven from here - the `mobile-view` class on
    // each list, swimlane and minicard - never appeared, so lists and cards stayed
    // their desktop width while the rest of the UI was in mobile mode.
    const explicitMobileMode = this.getExplicitMobileMode();
    if (explicitMobileMode !== null) {
      return explicitMobileMode;
    }

    const isSmallScreen = window.innerWidth <= 800;
    const isVerySmallScreen = window.innerWidth <= 600;
    const isPortrait = window.innerWidth < window.innerHeight || window.matchMedia("(orientation: portrait)").matches;
    const isMobilePhone = /Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && !/iPad/i.test(navigator.userAgent);
    const isIPhone = /iPhone|iPod/i.test(navigator.userAgent);
    const isIPad = /iPad/i.test(navigator.userAgent);
    const isUbuntuTouch = /Ubuntu/i.test(navigator.userAgent);

    // Below here the user has made no explicit choice (that is handled above), so
    // these are the per-device DEFAULTS.

    // iPhone: mobile view by default, on every model including the largest.
    if (isIPhone) {
      return true;
    } else if (isMobilePhone) {
      return isPortrait; // Other mobile phones: portrait = mobile, landscape = desktop
    } else if (isIPad) {
      return isVerySmallScreen; // iPad: only very small screens get mobile view
    } else if (isUbuntuTouch) {
      // Ubuntu Touch: smartphones (≤ 600px) behave like mobile phones, tablets (> 600px) like iPad
      if (isVerySmallScreen) {
        return isPortrait; // Ubuntu Touch smartphone: portrait = mobile, landscape = desktop
      } else {
        return isVerySmallScreen; // Ubuntu Touch tablet: only very small screens get mobile view
      }
    } else {
      return isSmallScreen; // Desktop: based on 800px screen width
    }
  },

  isTouchScreen() {
    // NEW TOUCH DEVICE DETECTION:
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent
    var hasTouchScreen = false;
    if ("maxTouchPoints" in navigator) {
      hasTouchScreen = navigator.maxTouchPoints > 0;
    } else if ("msMaxTouchPoints" in navigator) {
      hasTouchScreen = navigator.msMaxTouchPoints > 0;
    } else {
      var mQ = window.matchMedia && matchMedia("(pointer:coarse)");
      if (mQ && mQ.media === "(pointer:coarse)") {
        hasTouchScreen = !!mQ.matches;
      } else if ('orientation' in window) {
        hasTouchScreen = true; // deprecated, but good fallback
      } else {
        // Only as a last resort, fall back to user agent sniffing
        var UA = navigator.userAgent;
        hasTouchScreen = (
          /\b(BlackBerry|webOS|iPhone|IEMobile)\b/i.test(UA) ||
          /\b(Android|Windows Phone|iPad|iPod)\b/i.test(UA)
        );
      }
    }
    return hasTouchScreen;
  },

  // The user's EXPLICIT drag-handle choice: true, false, or null when they have
  // never chosen. The three states matter — see showDragHandles() below.
  dragHandlesPreference() {
    const currentUser = Meteor.user();
    const stored = currentUser
      ? (currentUser.profile || {}).showDesktopDragHandles
      // Not logged in: the same three states, kept in localStorage. A MISSING
      // key is "never chosen"; the string 'false' is a deliberate "off".
      : window.localStorage.getItem('showDesktopDragHandles');
    return readDragHandlesPreference(stored);
  },

  // Should drag handles be shown? An explicit choice always wins — including
  // turning them OFF on a touch screen. Only when the user has never chosen does
  // the device decide, and then a touch screen gets handles by default (a finger
  // needs a handle to grab; a mouse does not).
  //
  // This used to be `isTouchScreen() || preference`, which meant the toggle did
  // NOTHING on a touch screen: the OR was already true, so "Show desktop drag
  // handles" could never hide them there.
  showDragHandles() {
    return resolveShowDragHandles(
      Utils.dragHandlesPreference(),
      Utils.isTouchScreen(),
    );
  },

  // returns if desktop drag handles are enabled (the EFFECTIVE state, so the
  // menu checkmark matches what is actually on screen)
  isShowDesktopDragHandles() {
    return Utils.showDragHandles();
  },

  // Legacy name kept because it is used across the board templates; it now means
  // exactly showDragHandles().
  isTouchScreenOrShowDesktopDragHandles() {
    return Utils.showDragHandles();
  },

  calculateIndexData(prevData, nextData, nItems = 1) {
    let base, increment;
    // If we drop the card to an empty column
    if (!prevData && !nextData) {
      base = 0;
      increment = 1;
      // If we drop the card in the first position
    } else if (!prevData) {
      const nextSortIndex = nextData.sort;
      const ceil = Math.ceil(nextSortIndex - 1);
      if (ceil < nextSortIndex) {
        increment = nextSortIndex - ceil;
        base = nextSortIndex - increment;
      } else {
        base = nextData.sort - 1;
        increment = -1;
      }
      // If we drop the card in the last position
    } else if (!nextData) {
      const prevSortIndex = prevData.sort;
      const floor = Math.floor(prevSortIndex + 1);
      if (floor > prevSortIndex) {
        increment = prevSortIndex - floor;
        base = prevSortIndex - increment;
      } else {
        base = prevData.sort + 1;
        increment = 1;
      }
    }
    // In the general case take the average of the previous and next element
    // sort indexes.
    else {
      const prevSortIndex = prevData.sort;
      const nextSortIndex = nextData.sort;
      if (nItems == 1 ) {
        if (prevSortIndex < 0 ) {
          const ceil = Math.ceil(nextSortIndex - 1);
          if (ceil < nextSortIndex && ceil > prevSortIndex) {
            increment = ceil - prevSortIndex;
          }
        } else {
          const floor = Math.floor(nextSortIndex - 1);
          if (floor < nextSortIndex && floor > prevSortIndex) {
            increment = floor - prevSortIndex;
          }
        }
      }
      if (!increment) {
        increment = (nextSortIndex - prevSortIndex) / (nItems + 1);
      }
      if (!base) {
        base = prevSortIndex + increment;
      }
    }
    // XXX Return a generator that yield values instead of a base with a
    // increment number.
    return {
      base,
      increment,
    };
  },

  // Determine the new sort index
  calculateIndex(prevCardDomElement, nextCardDomElement, nCards = 1) {
    let prevData = null;
    let nextData = null;
    if (prevCardDomElement) {
      prevData = Blaze.getData(prevCardDomElement)
    }
    if (nextCardDomElement) {
      nextData = Blaze.getData(nextCardDomElement);
    }
    const ret = Utils.calculateIndexData(prevData, nextData, nCards);
    return ret;
  },

  manageCustomUI() {
    // Subscribe to custom UI settings (published from server)
    Meteor.subscribe('customUI');
    // Reactive helper will be called when Settings data changes
    Tracker.autorun(() => {
      const settings = Settings.findOne({});
      if (settings) {
        Utils.setCustomUI(settings);
      }
    });
  },

  setCustomUI(data) {
    const productName = (data && data.productName) ? data.productName : 'Wekan';
    const currentBoard = Utils.getCurrentBoard();
    if (currentBoard) {
      document.title = `${currentBoard.title} - ${productName}`;
      return;
    }
    // Every other page: the product name and then WHERE YOU ARE -
    // "Product name - All Boards / Remaining". The tab used to say only the
    // product name, so ten open tabs of one WeKan were ten identical tabs, and
    // a bookmark of any of them was named after the whole app rather than after
    // the page. The path is the one the header bar draws, published by it.
    // docs/Features/Board/Starred.md
    document.title = pageDocumentTitle(productName, headerPathVar.get());
  },

  setMatomo(data) {
    window._paq = window._paq || [];
    window._paq.push(['setDoNotTrack', data.doNotTrack]);
    if (data.withUserName) {
      window._paq.push(['setUserId', ReactiveCache.getCurrentUser().username]);
    }
    window._paq.push(['trackPageView']);
    window._paq.push(['enableLinkTracking']);

    (function () {
      window._paq.push(['setTrackerUrl', `${data.address}piwik.php`]);
      window._paq.push(['setSiteId', data.siteId]);

      const script = document.createElement('script');
      Object.assign(script, {
        id: 'scriptMatomo',
        type: 'text/javascript',
        async: 'true',
        defer: 'true',
        src: `${data.address}piwik.js`,
      });

      const s = document.getElementsByTagName('script')[0];
      s.parentNode.insertBefore(script, s);
    })();

    Session.set('matomo', true);
  },

  manageMatomo() {
    // Subscribe to Matomo configuration (published from server)
    Meteor.subscribe('matomoConfig');
    // Reactive helper will be called when Settings data changes
    Tracker.autorun(() => {
      const matomo = Session.get('matomo');
      if (matomo === undefined) {
        const settings = Settings.findOne({});
        if (settings && settings.matomoURL && settings.matomoSiteId) {
          const matomoConfig = {
            address: settings.matomoURL,
            siteId: settings.matomoSiteId,
            doNotTrack: settings.matomoDoNotTrack || false,
            withUserName: settings.matomoWithUserName || false
          };
          Utils.setMatomo(matomoConfig);
        } else {
          Session.set('matomo', false);
        }
      } else if (matomo) {
        window._paq = window._paq || [];
        window._paq.push(['trackPageView']);
      }
    });
  },

  getTriggerActionDesc(event, tempInstance) {
    const jqueryEl = tempInstance.$(event.currentTarget.parentNode);
    const triggerEls = jqueryEl.find('.trigger-content').children();
    let finalString = '';
    for (let i = 0; i < triggerEls.length; i++) {
      const element = tempInstance.$(triggerEls[i]);
      if (element.hasClass('trigger-text')) {
        finalString += element.text().toLowerCase();
      } else if (element.hasClass('user-details')) {
        let username = element.find('input').val();
        if (username === undefined || username === '') {
          username = '*';
        }
        finalString += `${element
          .find('.trigger-text')
          .text()
          .toLowerCase()} ${username}`;
      } else if (element.find('select').length > 0) {
        finalString += element
          .find('select option:selected')
          .text()
          .toLowerCase();
      } else if (element.find('input').length > 0) {
        let inputvalue = element.find('input').val();
        if (inputvalue === undefined || inputvalue === '') {
          inputvalue = '*';
        }
        finalString += inputvalue;
      }
      // Add space
      if (i !== length - 1) {
        finalString += ' ';
      }
    }
    return finalString;
  },

  fallbackCopyTextToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      return Promise.resolve(true);
    } catch (e) {
      return Promise.reject(false);
    } finally {
      document.body.removeChild(textArea);
    }
  },

  /** copy the text to the clipboard
   * @see https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript/30810322#30810322
   * @param string copy this text to the clipboard
   * @return Promise
   */
  copyTextToClipboard(text) {
    let ret;
    if (navigator.clipboard) {
      ret = navigator.clipboard.writeText(text).then(function () {
      }, function (err) {
        console.error('Async: Could not copy text: ', err);
      });
    } else {
      ret = Utils.fallbackCopyTextToClipboard(text);
    }
    return ret;
  },

  /** show the "copied!" message
   * @param promise the promise of Utils.copyTextToClipboard
   * @param $tooltip jQuery tooltip element
   */
  showCopied(promise, $tooltip) {
    if (promise) {
      promise.then(() => {
        $tooltip.show(100);
        setTimeout(() => $tooltip.hide(100), 1000);
      }, (err) => {
        console.error("error: ", err);
      });
    }
  },
};

// A simple tracker dependency that we invalidate every time the window is
// resized. This is used to reactively re-calculate the popup position in case
// of a window resize. This is the equivalent of a "Signal" in some other
// programming environments (eg, elm).
$(window).on('resize', () => Utils.windowResizeDep.changed());

// #697: Sandstorm keeps a grain iframe alive while the user visits another
// page. If WeKan finishes its first render while that iframe is hidden, the
// browser can report a zero/narrow viewport and responsive helpers cache the
// compact layout. Returning to the grain does not consistently produce a
// native resize event, so the sidebar and other viewport-bound elements could
// remain laid out for the hidden frame and fall outside the visible iframe.
//
// Treat every way a preserved document resumes as a deferred resize. The next
// animation frame is important: it lets the embedding page restore the iframe's
// dimensions before Blaze, popups and header measurements read them. Coalescing
// avoids doing the same work twice when visibilitychange, pageshow and focus
// arrive together. This is safe outside Sandstorm too (for background tabs and
// bfcache restores), and reuses the ordinary resize path rather than maintaining
// a second list of responsive consumers.
function refreshViewportAfterResume() {
  if (document.hidden || window.__wekanViewportResumePending) return;
  // First leave the lifecycle-event task so pageshow/focus/visibilitychange can
  // all collect, then leave one animation frame so the iframe has its restored
  // dimensions. Chromium may run an animation frame inside a synthetic
  // pageshow dispatch, so rAF alone is not a sufficient coalescing boundary.
  window.__wekanViewportResumePending = true;
  window.setTimeout(() => {
    const schedule = window.requestAnimationFrame || (callback => window.setTimeout(callback, 0));
    schedule(() => {
      window.__wekanViewportResumePending = false;
      window.dispatchEvent(new CustomEvent('resize', {
        detail: { source: 'wekan-viewport-resume' },
      }));
    });
  }, 0);
}

// Meteor hot-module replacement can evaluate this module again without
// recreating the document. Replace the previous instance instead of stacking
// another set of listeners (and another resize) on every hot update.
const previousViewportResume = window.__wekanViewportResumeHandler;
if (previousViewportResume) {
  document.removeEventListener('visibilitychange', previousViewportResume);
  window.removeEventListener('pageshow', previousViewportResume);
  window.removeEventListener('focus', previousViewportResume);
}
window.__wekanViewportResumeHandler = refreshViewportAfterResume;
document.addEventListener('visibilitychange', refreshViewportAfterResume);
window.addEventListener('pageshow', refreshViewportAfterResume);
window.addEventListener('focus', refreshViewportAfterResume);

// --wekan-header-height: how tall the two header bars actually are, right now.
//
// Anything laid out against the VIEWPORT rather than against the page flow -
// the right sidebar is `position: fixed` on a phone, so that it spans the screen
// instead of the wider board behind it - has to start below the header, and the
// header is not one height: the quick-access bar plus a board bar whose buttons
// wrap to one, two or three rows, in whichever language and window width. Every
// fixed number for it has been wrong for some of those.
//
// So the header measures itself into a custom property and the CSS uses it. A
// ResizeObserver catches the rows re-wrapping (a window resize does not fire for
// that on its own), and the initial call covers the first paint.
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // BOTH bars, not just the second one. This measured `#header` alone - the
  // second bar - back when every page had one. Most pages have none now (their
  // title is in the first bar and their controls are in a sidebar), so on those
  // the variable was 0 and everything laid out against it started at the top of
  // the WINDOW, underneath the first bar: the All Boards sidebar covered it.
  //
  // Measured as the BOTTOM of the lowest bar rather than a sum of heights, so
  // any margin between them is included and a bar that is absent contributes
  // nothing without needing a special case.
  const HEADER_IDS = ['header-quick-access', 'header'];

  const publishHeaderHeight = () => {
    let bottom = 0;
    for (const id of HEADER_IDS) {
      const el = document.getElementById(id);
      if (el) bottom = Math.max(bottom, el.getBoundingClientRect().bottom);
    }
    document.documentElement.style.setProperty(
      '--wekan-header-height', `${Math.round(bottom)}px`);
  };

  const watchHeader = () => {
    publishHeaderHeight();
    if (!window.ResizeObserver) return;
    for (const id of HEADER_IDS) {
      const el = document.getElementById(id);
      // The first bar WRAPS to a second row when its buttons run out of room,
      // which is a resize of that element and of nothing else - so it is
      // observed in its own right, not inferred from the window.
      if (!el || el.__wekanHeightObserved) continue;
      el.__wekanHeightObserved = true;
      new ResizeObserver(publishHeaderHeight).observe(el);
    }
  };

  $(window).on('resize orientationchange', publishHeaderHeight);
  // The header is rendered by Blaze, so it may not exist yet at import time.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watchHeader);
  } else {
    watchHeader();
  }
  // ...and once more after the first render, for the same reason.
  setTimeout(watchHeader, 0);
  setTimeout(watchHeader, 500);
}
