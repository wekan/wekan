import { calendarDateDisplayOptions } from '/client/lib/dateDisplay';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { ReactiveVar } from 'meteor/reactive-var';
import { toFullCalendarFirstDay } from '/client/lib/calendarFirstDay';
import { weekNumberByFirstDay } from '/models/lib/weekStart';
const { notHelperBoardTitle } = require('/models/lib/helperBoards');

// #2469: "Multi Board Calendar" - reuses #4223 Bigboard's exact
// membership query (see bigboardView.js's bigboardQuery) so the card set is
// every non-archived, non-template, non-helper board the current user is a
// member of, and reuses the single-board Calendar view's FullCalendar
// options/rendering (boardBody.js's Template.calendarView.helpers
// calendarOptions) almost verbatim, except events() aggregates across all
// of those boards instead of Utils.getCurrentBoard() alone, and each event
// is prefixed with its board's title.
function multiboardCalendarQuery() {
  return {
    archived: false,
    type: 'board',
    'members.userId': Meteor.userId(),
    title: notHelperBoardTitle(),
  };
}

Template.multiboardCalendarView.onCreated(function () {
  const instance = this;
  instance.subsReady = new ReactiveVar(false);
  // Same per-board subscription pattern as Bigboard (#4223): the metadata-
  // only 'boards' subscription is already kept alive app-wide, but each
  // board's lists/swimlanes/cards (needed for cardsInInterval et al.) are
  // only subscribed to when that board is opened normally - so subscribe to
  // each visible board's own 'board' composite here too.
  instance.autorun(() => {
    const boards = ReactiveCache.getBoards(multiboardCalendarQuery(), {
      sort: { sort: 1 },
    });
    let allReady = true;
    boards.forEach((board) => {
      const handle = instance.subscribe('board', board._id, false);
      if (!handle.ready()) allReady = false;
    });
    instance.subsReady.set(allReady);
  });
});

Template.multiboardCalendarView.helpers({
  isLoading() {
    return !Template.instance().subsReady.get();
  },
  multiboardCalendarOptions() {
    const t = (key, fallback) => {
      const translated = TAPi18n.__(key);
      return translated && translated !== key ? translated : fallback;
    };

    const currentUser = ReactiveCache.getCurrentUser();
    const firstDay = toFullCalendarFirstDay(
      currentUser ? currentUser.getStartDayOfWeek() : 1,
    );

    return {
      id: 'multiboard-calendar-view',
      ...calendarDateDisplayOptions('multiboard-calendar-view'),
      initialView: 'dayGridMonth',
      firstDay,
      // #2469 scope: cross-board drag-to-reschedule is out of scope for
      // this pass (a card's board isn't necessarily the one currently
      // open, and moving it needs more care than a single setDue call) -
      // the single-board Calendar view keeps its own editable/select
      // behaviour unchanged, and is unaffected by this view.
      editable: false,
      selectable: false,
      weekNumbers: true,
      weekNumberCalculation: date => weekNumberByFirstDay(date, firstDay),
      eventTimeFormat: {
        hour: 'numeric',
        minute: '2-digit',
        meridiem: 'short',
      },
      slotLabelFormat: {
        hour: 'numeric',
        minute: '2-digit',
        meridiem: 'short',
      },
      headerToolbar: {
        left: 'title',
        center: '',
        right:
          'today prev,next timeGridDay,listDay timeGridWeek,listWeek dayGridMonth,listMonth',
      },
      buttonIcons: false,
      buttonText: {
        prev: t('previous', 'Previous'),
        next: t('next', 'Next'),
        today: t('today', 'Today'),
        day: t('day', 'Day'),
        week: t('week', 'Week'),
        month: t('month', 'Month'),
        list: t('list', 'List'),
      },
      height: 'auto',
      navLinks: false,
      nowIndicator: true,
      locale: TAPi18n.getLanguage(),
      isRTL: TAPi18n.isRTL(),
      events(fetchInfo, callback) {
        const filterSelector = Filter.isActive()
          ? Filter._getMongoSelector()
          : undefined;
        const events = [];
        const pushEvent = function (board, card, title, start, end, extraCls) {
          start = start || card.startAt;
          end = end || card.endAt;
          title = title || card.title;
          // Prefix every entry with its board's title so entries from
          // different boards stay distinguishable on the merged calendar.
          const badgedTitle = `[${board.title}] ${title}`;
          const className =
            (extraCls ? `${extraCls} ` : '') +
            (card.color ? `calendar-event-${card.color}` : '');
          events.push({
            id: `${board._id}-${card._id}-${events.length}`,
            title: badgedTitle,
            start,
            end: end || card.endAt,
            allDay:
              Math.abs(end.getTime() - start.getTime()) / 1000 === 24 * 3600,
            url: FlowRouter.path('card', {
              boardId: board._id,
              slug: board.slug,
              cardId: card._id,
            }),
            className,
            extendedProps: { boardTitle: board.title },
          });
        };
        const boards = ReactiveCache.getBoards(multiboardCalendarQuery(), {});
        boards.forEach((board) => {
          board
            .cardsInInterval(fetchInfo.start, fetchInfo.end, filterSelector)
            .forEach((card) => pushEvent(board, card));
          board
            .cardsReceivedInBetween(
              fetchInfo.start,
              fetchInfo.end,
              filterSelector,
            )
            .forEach((card) =>
              pushEvent(
                board,
                card,
                `${card.title} ${TAPi18n.__('card-received')}`,
                card.receivedAt,
                new Date(card.receivedAt.getTime() + 36e5),
                'calendar-event-received',
              ),
            );
          board
            .cardsDueInBetween(fetchInfo.start, fetchInfo.end, filterSelector)
            .forEach((card) =>
              pushEvent(
                board,
                card,
                `${card.title} ${TAPi18n.__('card-due')}`,
                card.dueAt,
                new Date(card.dueAt.getTime() + 36e5),
                'calendar-event-due',
              ),
            );
          board
            .cardsEndInBetween(fetchInfo.start, fetchInfo.end, filterSelector)
            .forEach((card) =>
              pushEvent(
                board,
                card,
                `${card.title} ${TAPi18n.__('card-end')}`,
                card.endAt,
                new Date(card.endAt.getTime() + 36e5),
                'calendar-event-end',
              ),
            );
        });
        events.sort(function (first, second) {
          return first.id > second.id ? 1 : -1;
        });
        callback(events);
      },
      // No eventResize/eventDrop/select handlers - out of scope (see
      // `editable`/`selectable` comment above): clicking an event still
      // navigates via its `url`, same as the single-board Calendar view.
    };
  },
});
