import { Cookies } from 'meteor/ostrio:cookies';
const cookies = new Cookies();
const subManager = new SubsManager();
const { calculateIndex } = Utils;
const swimlaneWhileSortingHeight = 150;

BlazeComponent.extendComponent({
  onCreated() {
    this.isBoardReady = new ReactiveVar(false);

    // The pattern we use to manually handle data loading is described here:
    // https://kadira.io/academy/meteor-routing-guide/content/subscriptions-and-data-management/using-subs-manager
    // XXX The boardId should be readed from some sort the component "props",
    // unfortunatly, Blaze doesn't have this notion.
    this.autorun(() => {
      const currentBoardId = Session.get('currentBoard');
      if (!currentBoardId) return;
      const handle = subManager.subscribe('board', currentBoardId, false);
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

  goHome() {
    FlowRouter.go('home');
  },
}).register('board');

BlazeComponent.extendComponent({
  onCreated() {
    this.showOverlay = new ReactiveVar(false);
    this.draggingActive = new ReactiveVar(false);
    this._isDragging = false;
    // Used to set the overlay
    this.mouseHasEnterCardDetails = false;

    // fix swimlanes sort field if there are null values
    const currentBoardData = Boards.findOne(Session.get('currentBoard'));
    const nullSortSwimlanes = currentBoardData.nullSortSwimlanes();
    if (nullSortSwimlanes.count() > 0) {
      const swimlanes = currentBoardData.swimlanes();
      let count = 0;
      swimlanes.forEach(s => {
        Swimlanes.update(s._id, {
          $set: {
            sort: count,
          },
        });
        count += 1;
      });
    }

    // fix lists sort field if there are null values
    const nullSortLists = currentBoardData.nullSortLists();
    if (nullSortLists.count() > 0) {
      const lists = currentBoardData.lists();
      let count = 0;
      lists.forEach(l => {
        Lists.update(l._id, {
          $set: {
            sort: count,
          },
        });
        count += 1;
      });
    }
  },
  onRendered() {
    const boardComponent = this;
    const $swimlanesDom = boardComponent.$('.js-swimlanes');

    $swimlanesDom.sortable({
      tolerance: 'pointer',
      appendTo: '.board-canvas',
      helper(evt, item) {
        const helper = $(`<div class="swimlane"
                               style="flex-direction: column;
                                      height: ${swimlaneWhileSortingHeight}px;
                                      width: $(boardComponent.width)px;
                                      overflow: hidden;"/>`);
        helper.append(item.clone());
        // Also grab the list of lists of cards
        const list = item.next();
        helper.append(list.clone());
        return helper;
      },
      items: '.swimlane:not(.placeholder)',
      placeholder: 'swimlane placeholder',
      distance: 7,
      start(evt, ui) {
        const listDom = ui.placeholder.next('.js-swimlane');
        const parentOffset = ui.item.parent().offset();

        ui.placeholder.height(ui.helper.height());
        EscapeActions.executeUpTo('popup-close');
        listDom.addClass('moving-swimlane');
        boardComponent.setIsDragging(true);

        ui.placeholder.insertAfter(ui.placeholder.next());
        boardComponent.origPlaceholderIndex = ui.placeholder.index();

        // resize all swimlanes + headers to be a total of 150 px per row
        // this could be achieved by setIsDragging(true) but we want immediate
        // result
        ui.item
          .siblings('.js-swimlane')
          .css('height', `${swimlaneWhileSortingHeight - 26}px`);

        // set the new scroll height after the resize and insertion of
        // the placeholder. We want the element under the cursor to stay
        // at the same place on the screen
        ui.item.parent().get(0).scrollTop =
          ui.placeholder.get(0).offsetTop + parentOffset.top - evt.pageY;
      },
      beforeStop(evt, ui) {
        const parentOffset = ui.item.parent().offset();
        const siblings = ui.item.siblings('.js-swimlane');
        siblings.css('height', '');

        // compute the new scroll height after the resize and removal of
        // the placeholder
        const scrollTop =
          ui.placeholder.get(0).offsetTop + parentOffset.top - evt.pageY;

        // then reset the original view of the swimlane
        siblings.removeClass('moving-swimlane');

        // and apply the computed scrollheight
        ui.item.parent().get(0).scrollTop = scrollTop;
      },
      stop(evt, ui) {
        // To attribute the new index number, we need to get the DOM element
        // of the previous and the following card -- if any.
        const prevSwimlaneDom = ui.item.prevAll('.js-swimlane').get(0);
        const nextSwimlaneDom = ui.item.nextAll('.js-swimlane').get(0);
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
      sort(evt, ui) {
        // get the mouse position in the sortable
        const parentOffset = ui.item.parent().offset();
        const cursorY =
          evt.pageY - parentOffset.top + ui.item.parent().scrollTop();

        // compute the intended index of the placeholder (we need to skip the
        // slots between the headers and the list of cards)
        const newplaceholderIndex = Math.floor(
          cursorY / swimlaneWhileSortingHeight,
        );
        let destPlaceholderIndex = (newplaceholderIndex + 1) * 2;

        // if we are scrolling far away from the bottom of the list
        if (destPlaceholderIndex >= ui.item.parent().get(0).childElementCount) {
          destPlaceholderIndex = ui.item.parent().get(0).childElementCount - 1;
        }

        // update the placeholder position in the DOM tree
        if (destPlaceholderIndex !== ui.placeholder.index()) {
          if (destPlaceholderIndex < boardComponent.origPlaceholderIndex) {
            ui.placeholder.insertBefore(
              ui.placeholder
                .siblings()
                .slice(destPlaceholderIndex - 2, destPlaceholderIndex - 1),
            );
          } else {
            ui.placeholder.insertAfter(
              ui.placeholder
                .siblings()
                .slice(destPlaceholderIndex - 1, destPlaceholderIndex),
            );
          }
        }
      },
    });

    this.autorun(() => {
      let showDesktopDragHandles = false;
      currentUser = Meteor.user();
      if (currentUser) {
        showDesktopDragHandles = (currentUser.profile || {})
          .showDesktopDragHandles;
      } else if (cookies.has('showDesktopDragHandles')) {
        showDesktopDragHandles = true;
      } else {
        showDesktopDragHandles = false;
      }
      if (Utils.isMiniScreen() || showDesktopDragHandles) {
        $swimlanesDom.sortable({
          handle: '.js-swimlane-header-handle',
        });
      } else if (!Utils.isMiniScreen() && !showDesktopDragHandles) {
        $swimlanesDom.sortable({
          handle: '.swimlane-header',
        });
      }

      // Disable drag-dropping if the current user is not a board member
      $swimlanesDom.sortable('option', 'disabled', !userIsMember());
    });

    function userIsMember() {
      return (
        Meteor.user() &&
        Meteor.user().isBoardMember() &&
        !Meteor.user().isCommentOnly()
      );
    }

    // If there is no data in the board (ie, no lists) we autofocus the list
    // creation form by clicking on the corresponding element.
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    if (userIsMember() && currentBoard.lists().count() === 0) {
      boardComponent.openNewListForm();
    }
  },

  isViewSwimlanes() {
    currentUser = Meteor.user();
    if (currentUser) {
      return (currentUser.profile || {}).boardView === 'board-view-swimlanes';
    } else {
      return cookies.get('boardView') === 'board-view-swimlanes';
    }
  },

  isViewLists() {
    currentUser = Meteor.user();
    if (currentUser) {
      return (currentUser.profile || {}).boardView === 'board-view-lists';
    } else {
      return cookies.get('boardView') === 'board-view-lists';
    }
  },

  isViewCalendar() {
    currentUser = Meteor.user();
    if (currentUser) {
      return (currentUser.profile || {}).boardView === 'board-view-cal';
    } else {
      return cookies.get('boardView') === 'board-view-cal';
    }
  },

  openNewListForm() {
    if (this.isViewSwimlanes()) {
      this.childComponents('swimlane')[0]
        .childComponents('addListAndSwimlaneForm')[0]
        .open();
    } else if (this.isViewLists()) {
      this.childComponents('listsGroup')[0]
        .childComponents('addListForm')[0]
        .open();
    }
  },
  events() {
    return [
      {
        // XXX The board-overlay div should probably be moved to the parent
        // component.
        mouseup() {
          if (this._isDragging) {
            this._isDragging = false;
          }
        },
      },
    ];
  },

  // XXX Flow components allow us to avoid creating these two setter methods by
  // exposing a public API to modify the component state. We need to investigate
  // best practices here.
  setIsDragging(bool) {
    this.draggingActive.set(bool);
  },

  scrollLeft(position = 0) {
    const swimlanes = this.$('.js-swimlanes');
    swimlanes &&
      swimlanes.animate({
        scrollLeft: position,
      });
  },

  scrollTop(position = 0) {
    const swimlanes = this.$('.js-swimlanes');
    swimlanes &&
      swimlanes.animate({
        scrollTop: position,
      });
  },
}).register('boardBody');

BlazeComponent.extendComponent({
  onRendered() {
    this.autorun(function() {
      $('#calendar-view').fullCalendar('refetchEvents');
    });
  },
  calendarOptions() {
    return {
      id: 'calendar-view',
      defaultView: 'agendaDay',
      editable: true,
      timezone: 'local',
      header: {
        left: 'title   today prev,next',
        center:
          'agendaDay,listDay,timelineDay agendaWeek,listWeek,timelineWeek month,listMonth',
        right: '',
      },
      // height: 'parent', nope, doesn't work as the parent might be small
      height: 'auto',
      /* TODO: lists as resources: https://fullcalendar.io/docs/vertical-resource-view */
      navLinks: true,
      nowIndicator: true,
      businessHours: {
        // days of week. an array of zero-based day of week integers (0=Sunday)
        dow: [1, 2, 3, 4, 5], // Monday - Friday
        start: '8:00',
        end: '18:00',
      },
      locale: TAPi18n.getLanguage(),
      events(start, end, timezone, callback) {
        const currentBoard = Boards.findOne(Session.get('currentBoard'));
        const events = [];
        const pushEvent = function(card, title, start, end, extraCls) {
          start = start || card.startAt;
          end = end || card.endAt;
          title = title || card.title;
          const className =
            (extraCls ? `${extraCls} ` : '') +
            (card.color ? `calendar-event-${card.color}` : '');
          events.push({
            id: card._id,
            title,
            start,
            end: end || card.endAt,
            allDay:
              Math.abs(end.getTime() - start.getTime()) / 1000 === 24 * 3600,
            url: FlowRouter.url('card', {
              boardId: currentBoard._id,
              slug: currentBoard.slug,
              cardId: card._id,
            }),
            className,
          });
        };
        currentBoard
          .cardsInInterval(start.toDate(), end.toDate())
          .forEach(function(card) {
            pushEvent(card);
          });
        currentBoard
          .cardsDueInBetween(start.toDate(), end.toDate())
          .forEach(function(card) {
            pushEvent(
              card,
              `${card.title} ${TAPi18n.__('card-due')}`,
              card.dueAt,
              new Date(card.dueAt.getTime() + 36e5),
            );
          });
        events.sort(function(first, second) {
          return first.id > second.id ? 1 : -1;
        });
        callback(events);
      },
      eventResize(event, delta, revertFunc) {
        let isOk = false;
        const card = Cards.findOne(event.id);

        if (card) {
          card.setEnd(event.end.toDate());
          isOk = true;
        }
        if (!isOk) {
          revertFunc();
        }
      },
      eventDrop(event, delta, revertFunc) {
        let isOk = false;
        const card = Cards.findOne(event.id);
        if (card) {
          // TODO: add a flag for allDay events
          if (!event.allDay) {
            card.setStart(event.start.toDate());
            card.setEnd(event.end.toDate());
            isOk = true;
          }
        }
        if (!isOk) {
          revertFunc();
        }
      },
    };
  },
  isViewCalendar() {
    currentUser = Meteor.user();
    if (currentUser) {
      return (currentUser.profile || {}).boardView === 'board-view-cal';
    } else {
      return cookies.get('boardView') === 'board-view-cal';
    }
  },
}).register('calendarView');
