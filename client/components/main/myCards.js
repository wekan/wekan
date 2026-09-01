import { CardSearchPaged } from '../../lib/cardSearch';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveCache } from '/imports/reactiveCache';
import Cards from '/models/cards';
import ChecklistItems from '/models/checklistItems';
import { formatDateTime } from '/imports/lib/dateUtils';
import { Utils } from '/client/lib/utils';
const {
  MY_WORK_FILTERS,
  matchesMyWorkFilter,
  myWorkDueBucket,
} = require('/models/lib/checklistItemWork');

const FILTER_LABELS = {
  all: 'my-work-all',
  overdue: 'my-work-overdue',
  today: 'my-work-today',
  upcoming: 'my-work-upcoming',
  assigned: 'my-work-assigned',
  watching: 'my-work-watching',
};

function cardIsRelatedToUser(card, userId) {
  return Boolean(
    card && userId && (
      card.userId === userId ||
      (card.members || []).includes(userId) ||
      (card.assignees || []).includes(userId) ||
      (card.watchers || []).includes(userId)
    ),
  );
}

function buildMyWorkEntries(filter = 'all') {
  const userId = Meteor.userId();
  if (!userId) return [];
  const now = new Date();
  const entries = [];

  Cards.find({ archived: false, type: 'cardType-card' }).forEach(card => {
    if (!cardIsRelatedToUser(card, userId)) return;
    const board = ReactiveCache.getBoard(card.boardId);
    const list = ReactiveCache.getList(card.listId);
    if (!board || board.personalInboxOwnerId) return;
    if (!matchesMyWorkFilter(card, filter, userId, now)) return;
    const dueBucket = myWorkDueBucket(card.dueAt, now);
    entries.push({
      _id: `card-${card._id}`,
      typeLabelKey: 'my-work-card',
      title: card.title,
      parentTitle: '',
      boardTitle: board.title,
      listTitle: list ? list.title : '',
      dueAt: card.dueAt,
      dueLabel: card.dueAt ? formatDateTime(card.dueAt) : '',
      reminderLabel: '',
      dueClass: `is-${dueBucket}`,
      url: `/b/${board._id}/${board.slug}/${card._id}`,
    });
  });

  ChecklistItems.find({ assigneeId: userId, isFinished: false }).forEach(item => {
    const card = ReactiveCache.getCard(item.cardId);
    const board = card && ReactiveCache.getBoard(card.boardId);
    const list = card && ReactiveCache.getList(card.listId);
    if (!card || !board || board.personalInboxOwnerId) return;
    const filterSource = {
      ...item,
      assignees: item.assigneeId ? [item.assigneeId] : [],
      watchers: card.watchers || [],
    };
    if (!matchesMyWorkFilter(filterSource, filter, userId, now)) return;
    const dueBucket = myWorkDueBucket(item.dueAt, now);
    entries.push({
      _id: `item-${item._id}`,
      typeLabelKey: 'my-work-checklist-item',
      title: item.title,
      parentTitle: card.title,
      boardTitle: board.title,
      listTitle: list ? list.title : '',
      dueAt: item.dueAt,
      dueLabel: item.dueAt ? formatDateTime(item.dueAt) : '',
      reminderLabel: item.remindAt ? formatDateTime(item.remindAt) : '',
      dueClass: `is-${dueBucket}`,
      url: `/b/${board._id}/${board.slug}/${card._id}`,
    });
  });

  return entries.sort((left, right) => {
    const leftTime = left.dueAt ? new Date(left.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
    const rightTime = right.dueAt ? new Date(right.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
    return leftTime - rightTime || left.title.localeCompare(right.title);
  });
}

Template.myCardsControls.helpers({
  myCardsSort() {
    // eslint-disable-next-line no-console
    // console.log('sort:', Utils.myCardsSort());
    return Utils.myCardsSort();
  },

  myCardsView() {
    // eslint-disable-next-line no-console
    // console.log('sort:', Utils.myCardsView());
    return Utils.myCardsView();
  },
});

Template.myCardsControls.events({
  'click .js-toggle-my-cards-choose-sort': Popup.open(
    'myCardsSortChange',
  ),
  'click .js-my-cards-view-change': Popup.open(
    'myCardsViewChange'),
});

Template.myCards.onCreated(function () {
  const search = new CardSearchPaged(this);
  this.search = search;
  this.myWorkFilter = new ReactiveVar('all');

  // Override getSubscription for myCards
  search.getSubscription = function (queryParams) {
    return Meteor.subscribe(
      'myCards',
      search.sessionId,
      search.subscriptionCallbacks,
    );
  };

  search.runGlobalSearch(null);
  this.subscribe('myWork');
  Meteor.subscribe('setting');
});

// Drag-to-scroll is handled centrally for all non-board pages by
// defaultLayout's route-aware autorun (see client/components/main/layouts.js).

Template.myCards.helpers({
  userId() {
    return Meteor.userId();
  },

  // Return ReactiveVar so jade can use .get pattern
  searching() {
    return Template.instance().search.searching;
  },

  myCardsView() {
    // eslint-disable-next-line no-console
    //console.log('sort:', Utils.myCardsView());
    return Utils.myCardsView();
  },

  myWorkFilters() {
    const current = Template.instance().myWorkFilter.get();
    return MY_WORK_FILTERS.map(key => ({
      key,
      labelKey: FILTER_LABELS[key],
      active: key === current,
      count: buildMyWorkEntries(key).length,
    }));
  },

  myWorkEntries() {
    return buildMyWorkEntries(Template.instance().myWorkFilter.get());
  },

  hasMyWorkEntries() {
    return buildMyWorkEntries(Template.instance().myWorkFilter.get()).length > 0;
  },

  labelName(board, labelId) {
    const label = board.getLabelById(labelId);
    const name = label.name;
    return name;
  },

  labelColor(board, labelId) {
    const label = board.getLabelById(labelId);
    const color = label.color;
    return color;
  },

  myCardsList() {
    const search = Template.instance().search;
    const boards = [];
    let board = null;
    let swimlane = null;
    let list = null;

    const cursor = search.getResults();

    if (cursor) {
      cursor.forEach(card => {
        // eslint-disable-next-line no-console
        // console.log('card:', card.title);
        if (board === null || card.boardId !== board._id) {
          // eslint-disable-next-line no-console
          // console.log('new board');
          board = card.getBoard();
          if (board.archived) {
            board = null;
            return;
          }
          // eslint-disable-next-line no-console
          // console.log('board:', b, b._id, b.title);
          boards.push(board);
          board.mySwimlanes = [];
          swimlane = null;
          list = null;
        }

        if (swimlane === null || card.swimlaneId !== swimlane._id) {
          // eslint-disable-next-line no-console
          // console.log('new swimlane');
          swimlane = card.getSwimlane();
          if (swimlane.archived) {
            swimlane = null;
            return;
          }
          board.mySwimlanes.push(swimlane);
          swimlane.myLists = [];
          list = null;
        }

        if (list === null || card.listId !== list._id) {
          // eslint-disable-next-line no-console
          // console.log('new list');
          list = card.getList();
          if (list.archived) {
            list = null;
            return;
          }
          swimlane.myLists.push(list);
          list.myCards = [];
        }

        list.myCards.push(card);
      });

      // sort the data structure
      boards.forEach(board => {
        board.mySwimlanes.forEach(swimlane => {
          swimlane.myLists.forEach(list => {
            list.myCards.sort((a, b) => {
              return a.sort - b.sort;
            });
          });
          swimlane.myLists.sort((a, b) => {
            return a.sort - b.sort;
          });
        });
        board.mySwimlanes.sort((a, b) => {
          return a.sort - b.sort;
        });
      });

      boards.sort((a, b) => {
        let x = a.sort;
        let y = b.sort;

        // show the template board last
        if (a.type === 'template-container') {
          x = 99999999;
        } else if (b.type === 'template-container') {
          y = 99999999;
        }
        return x - y;
      });

      // eslint-disable-next-line no-console
      // console.log('boards:', boards);
      return boards;
    }

    return [];
  },
});

Template.myCards.events({
  'click .js-my-work-filter'(evt, tpl) {
    evt.preventDefault();
    tpl.myWorkFilter.set(evt.currentTarget.dataset.filter || 'all');
  },
  'click .js-next-page'(evt, tpl) {
    evt.preventDefault();
    tpl.search.nextPage();
  },
  'click .js-previous-page'(evt, tpl) {
    evt.preventDefault();
    tpl.search.previousPage();
  },
});

Template.myCardsViewChangePopup.events({
  'click .js-my-cards-view-boards'() {
    Utils.setMyCardsView('boards');
    Popup.back();
  },

  'click .js-my-cards-view-table'() {
    Utils.setMyCardsView('table');
    Popup.back();
  },
});
