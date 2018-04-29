const subManager = new SubsManager();

BlazeComponent.extendComponent({
  onCreated() {
    this.draggingActive = new ReactiveVar(false);
    this.showOverlay = new ReactiveVar(false);
    this.isBoardReady = new ReactiveVar(false);

    // The pattern we use to manually handle data loading is described here:
    // https://kadira.io/academy/meteor-routing-guide/content/subscriptions-and-data-management/using-subs-manager
    // XXX The boardId should be readed from some sort the component "props",
    // unfortunatly, Blaze doesn't have this notion.
    this.autorun(() => {
      const currentBoardId = Session.get('currentBoard');
      if (!currentBoardId)
        return;
      const handle = subManager.subscribe('board', currentBoardId);
      Tracker.nonreactive(() => {
        Tracker.autorun(() => {
          this.isBoardReady.set(handle.ready());
        });
      });
    });

    this._isDragging = false;
    this._lastDragPositionX = 0;

    // Used to set the overlay
    this.mouseHasEnterCardDetails = false;

     // feature: focus on me if focus=me query param is there
    const currentBoardId = Session.get('currentBoard');
    Lens.init(currentBoardId);
    if (Features.queryParamExtensions.focus) {
      const focus = FlowRouter.current().queryParams.focus;
      if (focus) {
        Lens.setFocusLevel(focus);
      }
    }

  },

  // XXX Flow components allow us to avoid creating these two setter methods by
  // exposing a public API to modify the component state. We need to investigate
  // best practices here.
  setIsDragging(bool) {
    this.draggingActive.set(bool);
  },

  scrollLeft(position = 0) {
    const lists = this.$('.js-lists');
    lists && lists.animate({
      scrollLeft: position,
    });
  },

  onlyShowCurrentCard() {
    return Utils.isMiniScreen() && Session.get('currentCard');
  },

  isViewSwimlanes() {
    const currentBoardId = Session.get('currentBoard');
    const board = Boards.findOne(currentBoardId);
    return (board.view === 'board-view-swimlanes');
  },

  isViewLists() {
    const currentBoardId = Session.get('currentBoard');
    const board = Boards.findOne(currentBoardId);
    return (board.view === 'board-view-lists');
  },

  events() {
    return [{
      // XXX The board-overlay div should probably be moved to the parent
      // component.
      'mouseenter .board-overlay'() {
        if (this.mouseHasEnterCardDetails) {
          this.showOverlay.set(false);
        }
      },
      'mouseup'() {
        if (this._isDragging) {
          this._isDragging = false;
        }
      },
    }];
  },
}).register('board');

