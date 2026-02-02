import { ReactiveCache } from '/imports/reactiveCache';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

Utils = {
  async setBackgroundImage(url) {
    const currentBoard = Utils.getCurrentBoard();
    if (currentBoard.backgroundImageURL !== undefined) {
      $(".board-wrapper").css({"background":"url(" + currentBoard.backgroundImageURL + ")","background-size":"cover"});
      $(".swimlane,.swimlane .list,.swimlane .list .list-body,.swimlane .list:first-child .list-body").css({"background-color":"transparent"});
      $(".minicard").css({"opacity": "0.9"});
    } else if (currentBoard["background-color"]) {
      await currentBoard.setColor(currentBoard["background-color"]);
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
    const ret = ReactiveCache.getCard(cardId);
    return ret;
  },

  // in fact, what we really care is screen size
  // large mobile device like iPad or android Pad has a big screen, it should also behave like a desktop
  // in a small window (even on desktop), Wekan run in compact mode.
  // we can easily debug with a small window of desktop browser. :-)
  isMiniScreen() {
    this.windowResizeDep.depend();
    // Also depend on mobile mode changes to make this reactive

    // innerWidth can be over screen width in some case; rely on physical pixels
    // we get what we want, i.e real width, no need for orientation
    const width = Math.min(window.innerWidth, window.screen.width);
    const isMobilePhone = /iPhone|iPad|Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && !/iPad/i.test(navigator.userAgent);
    const isTouch = this.isTouchScreen();

    return (isTouch || width < 800);
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

  getMobileMode() {
    return this.isMiniScreen();
  },

  setMobileMode(enabled) {
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
  canModifyCard() {
    const currentUser = ReactiveCache.getCurrentUser();
    const ret = (
      currentUser &&
      currentUser.isBoardMember() &&
      !currentUser.isCommentOnly() &&
      !currentUser.isWorker() &&
      !currentUser.isReadOnly() &&
      !currentUser.isReadAssignedOnly()
    );
    return ret;
  },
  canMoveCard() {
    const currentUser = ReactiveCache.getCurrentUser();
    const ret = (
      currentUser &&
      currentUser.isBoardMember() &&
      !currentUser.isCommentOnly() &&
      !currentUser.isReadOnly() &&
      !currentUser.isReadAssignedOnly()
    );
    return ret;
  },
  canModifyBoard() {
    const currentUser = ReactiveCache.getCurrentUser();
    const ret = (
      currentUser &&
      currentUser.isBoardMember() &&
      !currentUser.isCommentOnly() &&
      !currentUser.isReadOnly() &&
      !currentUser.isReadAssignedOnly()
    );
    return ret;
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
    currentUser = ReactiveCache.getCurrentUser();
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
      })
    );
  },
  getCommonAttachmentMetaFrom(card) {
    const meta = {};
    if (card.isLinkedCard()) {
      meta.boardId = ReactiveCache.getCard(card.linkedId).boardId;
      meta.cardId = card.linkedId;
    } else {
      meta.boardId = card.boardId;
      meta.swimlaneId = card.swimlaneId;
      meta.listId = card.listId;
      meta.cardId = card._id;
    }
    return meta;
  },
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

  // returns if desktop drag handles are enabled
  isShowDesktopDragHandles() {
    const currentUser = Meteor.user();
    if (currentUser) {
      return currentUser.hasShowDesktopDragHandles();
    } else {
      // For non-logged-in users, check localStorage
      return window.localStorage.getItem('showDesktopDragHandles') === 'true';
    }
  },

  // returns if mini screen or desktop drag handles
  isTouchScreenOrShowDesktopDragHandles() {
    return Utils.isTouchScreen() || Utils.isShowDesktopDragHandles();
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
    Meteor.call('getCustomUI', (err, data) => {
      if (err && err.error[0] === 'var-not-exist') {
        Session.set('customUI', false); // siteId || address server not defined
      }
      if (!err) {
        Utils.setCustomUI(data);
      }
    });
  },

  setCustomUI(data) {
    const currentBoard = Utils.getCurrentBoard();
    if (currentBoard) {
      document.title = `${currentBoard.title} - ${data.productName}`;
    } else {
      document.title = `${data.productName}`;
    }
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
    const matomo = Session.get('matomo');
    if (matomo === undefined) {
      Meteor.call('getMatomoConf', (err, data) => {
        if (err && err.error[0] === 'var-not-exist') {
          Session.set('matomo', false); // siteId || address server not defined
        }
        if (!err) {
          Utils.setMatomo(data);
        }
      });
    } else if (matomo) {
      window._paq.push(['trackPageView']);
    }
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
  coalesceSearch(root, queries, fallbackSel) {
    // a little helper to chain jQuery lookups
    // use with arg like [{func: "closest", sels: [".whatever"...]}...]
    root = $(root);
    for ({func, sels} of queries) {
      for (sel of sels) {
        res = root[func](sel);
        if (res.length) {
          return res;
        }
      }
    }
    return $(fallbackSel);
  },

  scrollIfNeeded(event) {
    // helper used when dragging either cards or lists
    const xFactor = 5;
    const yFactor = Utils.isMiniScreen() ? 5 : 10;
    const limitX = window.innerWidth / xFactor;
    const limitY = window.innerHeight / yFactor;
    const componentScrollX = this.coalesceSearch(event.target, [{
        func: "closest",
        sels: [".swimlane-container", ".swimlane.js-lists", ".board-canvas"]
      }
    ], ".board-canvas");
    let scrollX = 0;
    let scrollY = 0;
    if (event.clientX < limitX) {
      scrollX = -limitX;
    } else if (event.clientX > (xFactor - 1) * limitX) {
      scrollX = limitX;
    }
    if (event.clientY < limitY) {
      scrollY = -limitY;
    } else if (event.clientY > (yFactor - 1) * limitY) {
      scrollY = limitY;
    }
    window.scrollBy({ top: scrollY, behavior: "smooth" });
    componentScrollX[0].scrollBy({ left: scrollX, behavior: "smooth" });
  },

  shouldIgnorePointer(event) {
    // handle jQuery and native events
    if (event.originalEvent) {
      event = event.originalEvent;
    }
    return !(event.isPrimary && (event.pointerType !== 'mouse' || event.button === 0));
  },
};


$(window).on('resize', () => {
  // A simple tracker dependency that we invalidate every time the window is
  // resized. This is used to reactively re-calculate the popup position in case
  // of a window resize. This is the equivalent of a "Signal" in some other
  // programming environments (eg, elm).
  Utils.windowResizeDep.changed();
  // Simple, generic switch based exclusively on the new detection algorithm
  // Hope it will centralize decision and reduce edge cases
  Utils.setMobileMode(Utils.isMiniScreen());
});
