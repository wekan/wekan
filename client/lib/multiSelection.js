import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { ReactiveCache } from '/imports/reactiveCache';
import { Filter } from '/client/lib/filter';
import { EscapeActions } from '/client/lib/escapeActions';
import { Utils } from '/client/lib/utils';
import {
  boardScopedSelectionSelector,
  cardIdsOnBoard,
} from '/models/lib/boardScopedSelection';

// Late-bind Sidebar to avoid circular dependency (sidebar.js needs its template first)
let _Sidebar;
function getSidebar() {
  if (!_Sidebar) _Sidebar = require('/client/features/sidebar/service').getSidebarInstance;
  return _Sidebar();
}

function getCardsBetween(idA, idB) {
  function pluckId(doc) {
    return doc._id;
  }

  function getListsStrictlyBetween(id1, id2) {
    return ReactiveCache.getLists({
      $and: [
        { sort: { $gt: ReactiveCache.getList(id1).sort } },
        { sort: { $lt: ReactiveCache.getList(id2).sort } },
      ],
      archived: false,
    }).map(pluckId);
  }

  const cards = [ReactiveCache.getCard(idA), ReactiveCache.getCard(idB)].sort((a, b) => a.sort - b.sort);

  let selector;
  if (cards[0].listId === cards[1].listId) {
    selector = {
      listId: cards[0].listId,
      sort: {
        $gte: cards[0].sort,
        $lte: cards[1].sort,
      },
      archived: false,
    };
  } else {
    selector = {
      $or: [
        {
          listId: cards[0].listId,
          sort: { $lte: cards[0].sort },
        },
        {
          listId: {
            $in: getListsStrictlyBetween(cards[0].listId, cards[1].listId),
          },
        },
        {
          listId: cards[1].listId,
          sort: { $gte: cards[1].sort },
        },
      ],
      archived: false,
    };
  }

  return ReactiveCache.getCards(Filter.mongoSelector(selector)).map(pluckId);
}

export const MultiSelection = {
  sidebarView: 'multiselection',

  _selectedCards: new ReactiveVar([]),

  _isActive: new ReactiveVar(false),

  startRangeCardId: null,

  _sidebarWasOpen: false,

  reset() {
    this._selectedCards.set([]);
  },

  getMongoSelector() {
    // #2306: scope the selection to the board currently being viewed so bulk
    // actions (archive, move, label, ...) never touch cards that were
    // selected on a previously visited board.
    return Filter.mongoSelector(
      boardScopedSelectionSelector(
        this._selectedCards.get(),
        Session.get('currentBoard'),
      ),
    );
  },

  isActive() {
    return this._isActive.get();
  },

  count() {
    return ReactiveCache.getCards(this.getMongoSelector()).length;
  },

  isEmpty() {
    return this.count() === 0;
  },
  getSelectedCardIds(){
    return this._selectedCards.curValue;
  },

  activate() {
    if (!this.isActive()) {
      this._sidebarWasOpen = getSidebar() && getSidebar().isOpen();
      EscapeActions.executeUpTo('detailsPane');
      this._isActive.set(true);
      Tracker.flush();
    }
    if (getSidebar()) {
      getSidebar().setView(this.sidebarView);
      if(Utils.isMiniScreen()) {
        getSidebar().hide();
      }
    }
  },

  disable() {
    if (this.isActive()) {
      this._isActive.set(false);
      if (getSidebar() && getSidebar().getView() === this.sidebarView) {
        getSidebar().setView();
        if(!this._sidebarWasOpen) {
          getSidebar().hide();
        }
      }
      this.reset();
    }
  },

  add(cardIds) {
    return this.toggle(cardIds, { add: true, remove: false });
  },

  remove(cardIds) {
    return this.toggle(cardIds, { add: false, remove: true });
  },

  toggleRange(cardId) {
    const selectedCards = this._selectedCards.get();
    this.reset();
    if (!this.isActive() || selectedCards.length === 0) {
      this.toggle(cardId);
    } else {
      const startRange = selectedCards[selectedCards.length - 1];
      this.toggle(getCardsBetween(startRange, cardId));
    }
  },

  toggle(cardIds, options = {}) {
    cardIds = typeof cardIds === 'string' ? [cardIds] : cardIds;
    // #2306: never let cards that verifiably live on ANOTHER board enter the
    // selection (e.g. handed over by a caller that queried the client card
    // cache without a board scope).
    cardIds = cardIdsOnBoard(cardIds, Session.get('currentBoard'), id =>
      ReactiveCache.getCard(id),
    );
    options = {
      add: true,
      remove: true,
      ...options,
    };

    if (!this.isActive()) {
      this.reset();
      this.activate();
    }

    const selectedCards = this._selectedCards.get();

    cardIds.forEach(cardId => {
      const indexOfCard = selectedCards.indexOf(cardId);

      if (options.remove && indexOfCard > -1)
        selectedCards.splice(indexOfCard, 1);
      else if (options.add) selectedCards.push(cardId);
    });

    this._selectedCards.set(selectedCards);
  },

  isSelected(cardId) {
    return this._selectedCards.get().indexOf(cardId) > -1;
  },
};

Blaze.registerHelper('MultiSelection', MultiSelection);

EscapeActions.register(
  'multiselection',
  () => {
    MultiSelection.disable();
  },
  () => {
    return MultiSelection.isActive();
  },
  {
    noClickEscapeOn: '.js-minicard,.js-board-sidebar-content',
  },
);
