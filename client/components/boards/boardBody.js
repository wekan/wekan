const subManager = new SubsManager();
const { calculateIndex } = Utils;

BlazeComponent.extendComponent({
  onCreated() {
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
  },

  onlyShowCurrentCard() {
    return Utils.isMiniScreen() && Session.get('currentCard');
  },

}).register('board');

BlazeComponent.extendComponent({
  onCreated() {
    this.showOverlay = new ReactiveVar(false);
    this.draggingActive = new ReactiveVar(false);
    this._isDragging = false;
    // Used to set the overlay
    this.mouseHasEnterCardDetails = false;
  },
  onRendered() {
    const boardComponent = this;
    const $swimlanesDom = boardComponent.$('.js-swimlanes');

    $swimlanesDom.sortable({
      tolerance: 'pointer',
      appendTo: '.board-canvas',
      helper: 'clone',
      handle: '.js-swimlane-header',
      items: '.js-swimlane:not(.placeholder)',
      placeholder: 'swimlane placeholder',
      distance: 7,
      start(evt, ui) {
        ui.placeholder.height(ui.helper.height());
        EscapeActions.executeUpTo('popup-close');
        boardComponent.setIsDragging(true);
      },
      stop(evt, ui) {
        // To attribute the new index number, we need to get the DOM element
        // of the previous and the following card -- if any.
        const prevSwimlaneDom = ui.item.prev('.js-swimlane').get(0);
        const nextSwimlaneDom = ui.item.next('.js-swimlane').get(0);
        const sortIndex = calculateIndex(prevSwimlaneDom, nextSwimlaneDom, 1);

        $swimlanesDom.sortable('cancel');
        const swimlaneDomElement = ui.item.get(0);
        const swimlane = Blaze.getData(swimlaneDomElement);

        Swimlanes.update(swimlane._id, {
          $set: {
            sort: sortIndex.base,
          },
        });

        boardComponent.setIsDragging(false);
      },
    });

    function userIsMember() {
      return Meteor.user() && Meteor.user().isBoardMember() && !Meteor.user().isCommentOnly();
    }

    // If there is no data in the board (ie, no lists) we autofocus the list
    // creation form by clicking on the corresponding element.
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    if (userIsMember() && currentBoard.lists().count() === 0) {
      boardComponent.openNewListForm();
    }
  },

  isViewSwimlanes() {
    const currentUser = Meteor.user();
    if (!currentUser) return false;
    return (currentUser.profile.boardView === 'board-view-swimlanes');
  },

  isViewLists() {
    const currentUser = Meteor.user();
    if (!currentUser) return true;
    return (currentUser.profile.boardView === 'board-view-lists');
  },

  isViewCalendar() {
    const currentUser = Meteor.user();
    if (!currentUser) return true;
    return (currentUser.profile.boardView === 'board-view-cal');
  },

  openNewListForm() {
    if (this.isViewSwimlanes()) {
      this.childComponents('swimlane')[0]
        .childComponents('addListAndSwimlaneForm')[0].open();
    } else if (this.isViewLists()) {
      this.childComponents('listsGroup')[0]
        .childComponents('addListForm')[0].open();
    }
  },

  calendarOptions() {
    return {
      id: 'calendar-view',
      defaultView: 'basicWeek',
      header: {
        left: 'title',
        center: 'agendaDay,listDay,timelineDay agendaWeek,listWeek,timelineWeek month,timelineMonth timelineYear',
        right: 'today prev,next',
      },
      views: {
        basic: {
          // options apply to basicWeek and basicDay views
        },
        agenda: {
          // options apply to agendaWeek and agendaDay views
        },
        week: {
          // options apply to basicWeek and agendaWeek views
        },
        day: {
          // options apply to basicDay and agendaDay views
        },
      },
      themeSystem: 'jquery-ui',
      height: 'parent',
      /* TODO: lists as resources: https://fullcalendar.io/docs/vertical-resource-view */
      navLinks: true,
      nowIndicator: true,
      businessHours: {
        // days of week. an array of zero-based day of week integers (0=Sunday)
        dow: [ 1, 2, 3, 4, 5 ], // Monday - Thursday
        start: '8:00',
        end: '18:00',
      },
      locale: TAPi18n.getLanguage(),
      events(start, end, timezone, callback) {
        const currentBoard = Boards.findOne(Session.get('currentBoard'));
        const events = [];
        currentBoard.cardsInInterval(start.toDate(), end.toDate()).forEach(function(card){
          events.push({
            id: card.id,
            title: card.title,
            start: card.startAt,
            end: card.endAt,
            url: FlowRouter.url('card', {
              boardId: currentBoard._id,
              slug: currentBoard.slug,
              cardId: card._id,
            }),
          });
        });
        callback(events);
      },
    };
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

  // XXX Flow components allow us to avoid creating these two setter methods by
  // exposing a public API to modify the component state. We need to investigate
  // best practices here.
  setIsDragging(bool) {
    this.draggingActive.set(bool);
  },

  scrollLeft(position = 0) {
    const swimlanes = this.$('.js-swimlanes');
    swimlanes && swimlanes.animate({
      scrollLeft: position,
    });
  },

}).register('boardBody');
