Utils = {
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
  /** returns the current board
   * <li> returns the current board or the board of the popup card if set
   */
  getCurrentBoard() {
    const boardId = Utils.getCurrentBoardId();
    const ret = Boards.findOne(boardId);
    return ret;
  },
  getCurrentCard(ignorePopupCard) {
    const cardId = Utils.getCurrentCardId(ignorePopupCard);
    const ret = Cards.findOne(cardId);
    return ret;
  },
  getPopupCard() {
    const cardId = Utils.getPopupCardId();
    const ret = Cards.findOne(cardId);
    return ret;
  },
  reload () {
    // we move all window.location.reload calls into this function
    // so we can disable it when running tests.
    // This is because we are not allowed to override location.reload but
    // we can override Utils.reload to prevent reload during tests.
    window.location.reload();
  },
  setBoardView(view) {
    currentUser = Meteor.user();
    if (currentUser) {
      Meteor.user().setBoardView(view);
    } else if (view === 'board-view-swimlanes') {
      window.localStorage.setItem('boardView', 'board-view-swimlanes'); //true
      Utils.reload();
    } else if (view === 'board-view-lists') {
      window.localStorage.setItem('boardView', 'board-view-lists'); //true
      Utils.reload();
    } else if (view === 'board-view-cal') {
      window.localStorage.setItem('boardView', 'board-view-cal'); //true
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
    currentUser = Meteor.user();
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
    } else {
      window.localStorage.setItem('boardView', 'board-view-swimlanes'); //true
      Utils.reload();
      return 'board-view-swimlanes';
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
    const archivedBoards = [];
    Boards.find({ archived: false }).forEach(board => {
      archivedBoards.push(board._id);
    });
    return archivedBoards;
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

  // XXX We should remove these two methods
  goBoardId(_id) {
    const board = Boards.findOne(_id);
    return (
      board &&
      FlowRouter.go('board', {
        id: board._id,
        slug: board.slug,
      })
    );
  },

  goCardId(_id) {
    const card = Cards.findOne(_id);
    const board = Boards.findOne(card.boardId);
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
      meta.boardId = Cards.findOne(card.linkedId).boardId;
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
    const next = function(result) {
      image = null;
      canvas = null;
      if (typeof callback === 'function') {
        callback(result);
      }
    };
    image.onload = function() {
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
    image.onerror = function() {
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
    // OLD WINDOW WIDTH DETECTION:
    this.windowResizeDep.depend();
    return $(window).width() <= 800;

    // NEW TOUCH DEVICE DETECTION:
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent

    /*
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
    */
    //if (hasTouchScreen)
    //    document.getElementById("exampleButton").style.padding="1em";
    //return false;
  },

  // returns if desktop drag handles are enabled
  isShowDesktopDragHandles() {
    const currentUser = Meteor.user();
    if (currentUser) {
      return (currentUser.profile || {}).showDesktopDragHandles;
    } else if (window.localStorage.getItem('showDesktopDragHandles')) {
      return true;
    } else {
      return false;
    }
  },

  // returns if mini screen or desktop drag handles
  isMiniScreenOrShowDesktopDragHandles() {
    return this.isMiniScreen() || this.isShowDesktopDragHandles();
  },

  calculateIndexData(prevData, nextData, nItems = 1) {
    let base, increment;
    // If we drop the card to an empty column
    if (!prevData && !nextData) {
      base = 0;
      increment = 1;
      // If we drop the card in the first position
    } else if (!prevData) {
      base = nextData.sort - 1;
      increment = -1;
      // If we drop the card in the last position
    } else if (!nextData) {
      base = prevData.sort + 1;
      increment = 1;
    }
    // In the general case take the average of the previous and next element
    // sort indexes.
    else {
      const prevSortIndex = prevData.sort;
      const nextSortIndex = nextData.sort;
      increment = (nextSortIndex - prevSortIndex) / (nItems + 1);
      base = prevSortIndex + increment;
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
    let base, increment;
    // If we drop the card to an empty column
    if (!prevCardDomElement && !nextCardDomElement) {
      base = 0;
      increment = 1;
      // If we drop the card in the first position
    } else if (!prevCardDomElement) {
      base = Blaze.getData(nextCardDomElement).sort - 1;
      increment = -1;
      // If we drop the card in the last position
    } else if (!nextCardDomElement) {
      base = Blaze.getData(prevCardDomElement).sort + 1;
      increment = 1;
    }
    // In the general case take the average of the previous and next element
    // sort indexes.
    else {
      const prevSortIndex = Blaze.getData(prevCardDomElement).sort;
      const nextSortIndex = Blaze.getData(nextCardDomElement).sort;
      increment = (nextSortIndex - prevSortIndex) / (nCards + 1);
      base = prevSortIndex + increment;
    }
    // XXX Return a generator that yield values instead of a base with a
    // increment number.
    return {
      base,
      increment,
    };
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
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    if (currentBoard) {
      DocHead.setTitle(`${currentBoard.title} - ${data.productName}`);
    } else {
      DocHead.setTitle(`${data.productName}`);
    }
  },

  setMatomo(data) {
    window._paq = window._paq || [];
    window._paq.push(['setDoNotTrack', data.doNotTrack]);
    if (data.withUserName) {
      window._paq.push(['setUserId', Meteor.user().username]);
    }
    window._paq.push(['trackPageView']);
    window._paq.push(['enableLinkTracking']);

    (function() {
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
      ret = navigator.clipboard.writeText(text).then(function() {
      }, function(err) {
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
