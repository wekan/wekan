import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { getSpinnerName, getSpinnerTemplate } from '/client/lib/spinner';
import getSlug from 'limax';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Swimlanes from '/models/swimlanes';
import { Filter } from '/client/lib/filter';
import { MultiSelection } from '/client/lib/multiSelection';
import { Utils } from '/client/lib/utils';
import { isLinkableCardTarget } from '/models/lib/linkedCardTarget';
import { listCardsSelector } from '/models/lib/swimlaneFilter';
import { sortCardsByTitle } from '/models/lib/sortCardsByTitle';
import { isLazyCards, BoardListCardCounts, windowCountId } from '/client/lib/lazyCards';
import {
  mutationsChangeDragGeometry,
  findActiveCardDrag,
} from '/client/lib/cardDragGeometry';
import autosize from 'autosize';

// SubsManager removed for Meteor 3 migration
const InfiniteScrollIter = 10;

Template.listBody.onCreated(function () {
  // for infinite scrolling
  this.cardlimit = new ReactiveVar(InfiniteScrollIter);

  this.openForm = (options) => {
    options = options || {};
    options.position = options.position || 'top';

    const formEls = this.findAll('.js-inlined-form-wrapper');
    let formInstance = null;
    let firstInstance = null;
    let lastInstance = null;
    for (const el of formEls) {
      const view = Blaze.getView(el, 'Template.inlinedForm');
      const inst = view?.templateInstance?.();
      if (inst) {
        if (!firstInstance) {
          firstInstance = inst;
        }
        lastInstance = inst;
        if (el.dataset.position === options.position) {
          formInstance = inst;
          break;
        }
      }
    }
    if (!formInstance) {
      formInstance = options.position === 'bottom' ? lastInstance : firstInstance;
    }
    if (formInstance) {
      formInstance.isOpen.set(true);
    }
  };

  this.cardFormComponent = () => {
    // Find addCardForm template instance by DOM traversal
    const formEl = this.find('.js-composer');
    if (formEl) {
      const view = Blaze.getView(formEl, 'Template.addCardForm');
      return view?.templateInstance?.() || null;
    }
    return null;
  };

  this.scrollToBottom = () => {
    const container = this.firstNode;
    $(container).animate({
      scrollTop: container.scrollHeight,
    });
  };

  this.idOrNull = (swimlaneId) => {
    const data = this.data;
    if (!data) {
      return undefined;
    }
    if (
      Utils.boardView() === 'board-view-swimlanes' ||
      data.board().isTemplatesBoard()
    )
      return swimlaneId;
    return undefined;
  };

  this.addCard = async (evt) => {
    evt.preventDefault();
    const firstCardDom = this.find('.js-minicard:first');
    const lastCardDom = this.find('.js-minicard:last');
    const textarea = $(evt.currentTarget).find('textarea');
    const position = Blaze.getData(evt.currentTarget)?.position;
    const title = textarea.val().trim();

    let sortIndex;
    if (position === 'top') {
      sortIndex = Utils.calculateIndex(null, firstCardDom).base;
    } else if (position === 'bottom') {
      sortIndex = Utils.calculateIndex(lastCardDom, null).base;
    }

    const formComponent = this.cardFormComponent();
    const members = formComponent.members.get();
    const labelIds = formComponent.labels.get();
    const customFields = formComponent.customFields.get();

    const data = this.data;
    if (!data) {
      return;
    }
    const board = data.board();
    let linkedId = '';
    let swimlaneId = '';
    let cardType = 'cardType-card';
    if (title) {
      // Clear the textarea immediately so the next card starts empty,
      // before any async operations that would leave the old text visible.
      textarea.val('').focus();
      autosize.update(textarea);

      if (board.isTemplatesBoard()) {
        const swimlaneEl = this.$('.js-minicards').closest('.swimlane').get(0);
        swimlaneId = swimlaneEl && Blaze.getData(swimlaneEl)?._id; // Always swimlanes view
        const swimlane = ReactiveCache.getSwimlane(swimlaneId);
        // If this is the card templates swimlane, insert a card template
        if (swimlane.isCardTemplatesSwimlane()) cardType = 'template-card';
        // If this is the board templates swimlane, insert a board template and a linked card
        else if (swimlane.isBoardTemplatesSwimlane()) {
          linkedId = await Boards.insertAsync({
            title,
            slug: getSlug(title) || 'board',
            permission: 'private',
            type: 'template-board',
          });
          const defaultTitle = TAPi18n.__('default');
          await Swimlanes.insertAsync({
            title: typeof defaultTitle === 'string' ? defaultTitle : 'Default',
            boardId: linkedId,
          });
          cardType = 'cardType-linkedBoard';
        }
      } else if (Utils.boardView() === 'board-view-swimlanes') {
        const swimlaneEl2 = this.$('.js-minicards').closest('.swimlane').get(0);
        swimlaneId = swimlaneEl2 && Blaze.getData(swimlaneEl2)?._id;
      }
      else if (
        Utils.boardView() === 'board-view-lists' ||
        Utils.boardView() === 'board-view-cal' ||
        !Utils.boardView()
      ) {
        swimlaneId = data.swimlaneId || board.getDefaultSwimline()._id;
      }

      const nextCardNumber = await board.getNextCardNumber();

      const _id = Cards.insert({
        title,
        members,
        labelIds,
        customFields,
        listId: data._id,
        boardId: board._id,
        sort: sortIndex,
        swimlaneId,
        type: cardType,
        cardNumber: nextCardNumber,
        linkedId,
      });

      // if the displayed card count is less than the total cards in the list,
      // we need to increment the displayed card count to prevent the spinner
      // to appear
      const cardCount = data
        .cards(this.idOrNull(swimlaneId))
        .length;
      if (this.cardlimit.get() < cardCount) {
        this.cardlimit.set(this.cardlimit.get() + InfiniteScrollIter);
      }

      // In case the filter is active we need to add the newly inserted card in
      // the list of exceptions -- cards that are not filtered. Otherwise the
      // card will disappear instantly.
      // See https://github.com/wekan/wekan/issues/80
      Filter.addException(_id);

      // We keep the form opened and scroll to it.
      if (position === 'bottom') {
        this.scrollToBottom();
      }
    }
  };

  this.clickOnMiniCard = (evt) => {
    const $target = $(evt.target);
    const card = Blaze.getData(evt.currentTarget) || Template.currentData();
    if (!card || !card._id) {
      return;
    }
    const clickedTitle = $target.closest('.minicard-title').length > 0;
    const clickedLinkedReference = $target.closest('.js-linked-link').length > 0;
    const clickedChecklist = $target.closest('.minicard-checklist').length > 0;

    // When multi-selection is active (or Shift is held), a click anywhere on the
    // minicard toggles its selection. This must be checked before the title and
    // checklist handlers below, otherwise clicking a card's title (which covers
    // most of the minicard) would open the card details instead of (de)selecting
    // it, making it impossible to check some cards in multi-selection mode.
    if (MultiSelection.isActive() || evt.shiftKey) {
      evt.stopImmediatePropagation();
      evt.preventDefault();
      const methodName = evt.shiftKey ? 'toggleRange' : 'toggle';
      MultiSelection[methodName](card._id);
      return;
    }

    if (clickedChecklist) {
      evt.preventDefault();
      evt.stopPropagation();
      return;
    }

    // Title clicks should open the regular board card details view.
    if (clickedTitle && !clickedLinkedReference) {
      evt.stopImmediatePropagation();
      evt.preventDefault();
      Session.delete('popupCardId');
      Session.delete('popupCardBoardId');
      Session.set('currentCard', card._id);
      const openCards = Session.get('openCards') || [];
      if (!openCards.includes(card._id)) {
        Session.set('openCards', [...openCards, card._id]);
      }
      return;
    }

    if (Utils.isMiniScreen()) {
      evt.preventDefault();
      Session.set('popupCardId', card._id);
      this.cardDetailsPopup(evt);
    } else if (Session.equals('currentCard', card._id)) {
      evt.stopImmediatePropagation();
      evt.preventDefault();
      Utils.goBoardId(Session.get('currentBoard'));
    } else {
      // Allow normal href navigation, but if it's the same card URL,
      // we'll handle it by directly setting the session
      evt.preventDefault();
      Session.set('currentCard', card._id);
      const openCards = Session.get('openCards') || [];
      if (!openCards.includes(card._id)) {
        Session.set('openCards', [...openCards, card._id]);
      }
    }
  };

  this.toggleMultiSelection = (evt) => {
    evt.stopImmediatePropagation();
    evt.preventDefault();
    // Resolve the card from the clicked checkbox element. Using
    // Blaze.getData(evt.currentTarget) is reliable for the per-card data
    // context, whereas Template.currentData() can resolve to the enclosing
    // list context and toggle the wrong id (so the checkbox appears to do
    // nothing). Falls back to Template.currentData() just in case.
    const card =
      Blaze.getData(evt.currentTarget) || Template.currentData();
    if (card && card._id) {
      MultiSelection.toggle(card._id);
    }
  };

  this.cardDetailsPopup = (event) => {
    if (!Popup.isOpen()) {
      Popup.open("cardDetails")(event);
    }
  };
});

Template.listBody.helpers({
  idOrNull(swimlaneId) {
    return Template.instance().idOrNull(swimlaneId);
  },
  customFieldsSum() {
    const list = Template.currentData();
    if (!list) return [];
    const boardId = Session.get('currentBoard');
    const fields = ReactiveCache.getCustomFields({
      boardIds: { $in: [boardId] },
      showSumAtTopOfList: true,
    });

    if (!fields || !fields.length) return [];

    const cards = ReactiveCache.getCards({
      listId: list._id,
      archived: false,
    });

    const result = fields.map(field => {
      let sum = 0;
      if (cards && cards.length) {
        cards.forEach(card => {
          const cfs = (card.customFields || []);
          const cf = cfs.find(f => f && f._id === field._id);
          if (!cf || cf.value === null || cf.value === undefined) return;
          let v = cf.value;
          if (typeof v === 'string') {
            // try to parse string numbers, accept comma decimal
            const parsed = parseFloat(v.replace(',', '.'));
            if (isNaN(parsed)) return;
            v = parsed;
          }
          if (typeof v === 'number' && isFinite(v)) {
            sum += v;
          }
        });
      }
      return {
        _id: field._id,
        name: field.name,
        type: field.type,
        settings: field.settings || {},
        value: sum,
      };
    });

    return result;
  },

  cardsWithLimit(swimlaneId) {
    const tpl = Template.instance();
    const limit = tpl.cardlimit.get();
    const defaultSort = { sort: 1 };
    // Session is reset on page reload; fall back to the persisted card sort so a
    // chosen sort (e.g. by due date) is remembered across reloads (#5886).
    let sortBy = Session.get('sortBy');
    if (!sortBy) {
      try {
        const stored = window.localStorage.getItem('wekan-cards-sortBy');
        if (stored) {
          sortBy = JSON.parse(stored);
        }
      } catch (e) {}
    }
    if (!sortBy) {
      sortBy = defaultSort;
    }
    // #6441: build the swimlane-membership fallback as a single `swimlaneId:
    // { $in: [...] }` clause (via the shared, unit-tested helper) instead of a
    // bare top-level `$or`, so it never competes with the board Filter's own
    // top-level `$or` (labels/members/exceptions) and the label filter applies
    // board-wide across every swimlane.
    // #6443: in the first swimlane also surface orphaned cards (a swimlaneId
    // pointing at a deleted swimlane) so they are not invisible in swimlane view.
    const list = Template.currentData();
    const selector = listCardsSelector(
      list._id,
      swimlaneId,
      list.orphanedCardsSwimlaneIds
        ? list.orphanedCardsSwimlaneIds(swimlaneId)
        : undefined,
    );
    const mongoSelector = Filter.mongoSelector(selector);
    // Lazy card loading: the board publication ships no cards, so subscribe to
    // just this list/swimlane window (grows with `limit` as the user scrolls)
    // plus its reactive total count. Default mode keeps everything in minimongo
    // already, so these subscriptions are skipped.
    if (list.boardId && isLazyCards(list.boardId)) {
      tpl.subscribe('boardCardsWindow', list.boardId, mongoSelector, sortBy, limit);
      tpl.subscribe(
        'boardListCardCount',
        windowCountId(list._id, swimlaneId),
        list.boardId,
        mongoSelector,
      );
    }
    const ret = ReactiveCache.getCards(mongoSelector, {
      // sort: ['sort'],
      sort: sortBy,
      limit,
    }, true);
    return ret;
  },

  showSpinner(swimlaneId) {
    const tpl = Template.instance();
    const list = Template.currentData();
    if (isLazyCards()) {
      // In lazy mode minimongo only holds the loaded window, so the total comes
      // from the server count published into BoardListCardCounts.
      const countDoc = BoardListCardCounts.findOne(windowCountId(list._id, swimlaneId));
      const total = countDoc ? countDoc.count : 0;
      return total > tpl.cardlimit.get();
    }
    return list.cards(swimlaneId).length > tpl.cardlimit.get();
  },

  canSeeAddCard() {
    const tpl = Template.instance();
    const list = Template.currentData();
    // #2095: count all cards in the list, not only the filtered/visible ones.
    const reachedWipLimit = !list.getWipLimit('soft') &&
      list.getWipLimit('enabled') &&
      list.getWipLimit('value') <= list.cardsUnfiltered().length;
    return (
      !reachedWipLimit &&
      Utils.canModifyCard()
    );
  },

  reachedWipLimit() {
    const list = Template.currentData();
    return (
      !list.getWipLimit('soft') &&
      list.getWipLimit('enabled') &&
      // #2095: count all cards in the list, not only the filtered/visible ones.
      list.getWipLimit('value') <= list.cardsUnfiltered().length
    );
  },

  isVerticalScrollbars() {
    const user = ReactiveCache.getCurrentUser();
    return user && user.isVerticalScrollbars();
  },

  cardIsSelected() {
    return Session.equals('currentCard', Template.currentData()._id);
  },

  formattedCurrencyCustomFieldValue(val) {
    // `this` is the custom field sum object from customFieldsSum each-iteration
    const field = this || {};
    const code = (field.settings && field.settings.currencyCode) || 'USD';
    try {
      const n = typeof val === 'number' ? val : parseFloat(val);
      if (!isFinite(n)) return val;
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).format(n);
    } catch (e) {
      return `${code} ${val}`;
    }
  },
});

Template.listBody.events({
  'click .js-minicard'(evt, tpl) {
    tpl.clickOnMiniCard(evt);
  },
  'click .js-toggle-multi-selection'(evt, tpl) {
    tpl.toggleMultiSelection(evt);
  },
  'click .open-minicard-composer'(evt, tpl) {
    tpl.scrollToBottom();
  },
  submit(evt, tpl) {
    tpl.addCard(evt);
  },
});

// #2769 Card lands in the WRONG swimlane when it is dropped while a connected
// list's layout changed mid-drag. jQuery UI sortable snapshots the geometry
// of every connected `.js-minicards` container once at drag start
// (_mouseStart runs refreshPositions() BEFORE the `start` callback) and only
// re-snapshots after its own placeholder moves — never when Blaze mutates the
// DOM. Two such mutations routinely happen during a drag: another user's
// newly added card is reactively inserted into the target list (the issue's
// "target column where a new card is being added"), and the dragging user's
// own open add-card composer is closed by the `start` callback's
// EscapeActions call, AFTER the snapshot. Every list/swimlane below the
// change then shifts vertically while the cached rectangles stay put, so the
// drop resolves against a stale map: the placeholder is parked in the
// neighbouring swimlane's copy of the list (hence the reporter's "no drop
// shadow in the target column") and the stop handler's
// ui.item.parents('.swimlane') (client/components/lists/list.js) faithfully
// persists that wrong swimlane.
// Fix: watch each list's minicards for REAL DOM changes (Blaze insertions and
// removals — not jQuery UI's own placeholder/helper churn, which the library
// already follows with its own refresh) and re-cache the active drag's
// geometry with sortable('refresh'). The decision helpers are pure and unit
// tested in tests/cardDragGeometry.test.cjs.
Template.listBody.onRendered(function () {
  const minicardsEl = this.find('.js-minicards');
  if (!minicardsEl || typeof MutationObserver === 'undefined') {
    return;
  }
  this.dragGeometryRefreshQueued = false;
  this.dragGeometryObserver = new MutationObserver(mutations => {
    // Cheapest gate first: no drag helper on the page means no drag at all
    // (this observer also fires on every ordinary reactive card update).
    if (!document.getElementsByClassName('ui-sortable-helper').length) {
      return;
    }
    if (!mutationsChangeDragGeometry(mutations)) {
      return;
    }
    if (this.dragGeometryRefreshQueued) {
      return;
    }
    this.dragGeometryRefreshQueued = true;
    // Coalesce bursts (Blaze can insert several nodes per flush); by the time
    // the timeout runs, this tick's layout is final and measurable.
    setTimeout(() => {
      this.dragGeometryRefreshQueued = false;
      const active = findActiveCardDrag(
        $('.js-minicards')
          .toArray()
          .map(el => $.data(el, 'ui-sortable')),
      );
      if (active) {
        try {
          // Re-collects the items of every connected container and re-measures
          // all container rectangles, so the pointer is matched against the
          // CURRENT layout for the rest of the drag.
          active.refresh();
        } catch (e) {
          // A failed re-measure must never break the drag itself.
        }
      }
    }, 0);
  });
  this.dragGeometryObserver.observe(minicardsEl, {
    childList: true,
    subtree: true,
  });
});

Template.listBody.onDestroyed(function () {
  if (this.dragGeometryObserver) {
    this.dragGeometryObserver.disconnect();
    this.dragGeometryObserver = null;
  }
});

function toggleValueInReactiveArray(reactiveValue, value) {
  const array = reactiveValue.get();
  const valueIndex = array.indexOf(value);
  if (valueIndex === -1) {
    array.push(value);
  } else {
    array.splice(valueIndex, 1);
  }
  reactiveValue.set(array);
}

Template.addCardForm.onCreated(function () {
  this.labels = new ReactiveVar([]);
  this.members = new ReactiveVar([]);
  this.customFields = new ReactiveVar([]);

  const currentBoardId = Session.get('currentBoard');
  const arr = [];
  ReactiveCache.getBoard(currentBoardId)
    .customFields()
    .forEach(function (field) {
      if (field.automaticallyOnCard || field.alwaysOnCard)
        arr.push({ _id: field._id, value: null });
    });
  this.customFields.set(arr);

  this.reset = () => {
    this.labels.set([]);
    this.members.set([]);
    this.customFields.set([]);
  };

  this.pressKey = (evt) => {
    // Pressing Enter should submit the card
    if (evt.keyCode === 13 && !evt.shiftKey) {
      evt.preventDefault();
      const $form = $(evt.currentTarget).closest('form');
      // XXX For some reason $form.submit() does not work (it's probably a bug
      // of blaze-component related to the fact that the submit event is non-
      // bubbling). This is why we click on the submit button instead -- which
      // work.
      $form.find('button[type=submit]').click();

      // Pressing Tab should open the form of the next column, and Maj+Tab go
      // in the reverse order
    } else if (evt.keyCode === 9) {
      // Prevent custom focus movement on Tab key for accessibility
      // evt.preventDefault();
      const isReverse = evt.shiftKey;
      const list = $(`#js-list-${Template.currentData().listId}`);
      const listSelector = '.js-list:not(.js-list-composer)';
      let nextList = list[isReverse ? 'prev' : 'next'](listSelector).get(0);
      // If there is no next list, loop back to the beginning.
      if (!nextList) {
        nextList = $(listSelector + (isReverse ? ':last' : ':first')).get(0);
      }

      const nextListView = Blaze.getView(nextList, 'Template.list');
      const nextListInstance = nextListView?.templateInstance?.();
      if (nextListInstance) {
        nextListInstance.openForm({
          position: Template.currentData().position,
        });
      }
    }
  };
});

Template.addCardForm.helpers({
  members() {
    return Template.instance().members;
  },
  getLabels() {
    const tpl = Template.instance();
    const currentBoardId = Session.get('currentBoard');
    if (ReactiveCache.getBoard(currentBoardId).labels) {
      return ReactiveCache.getBoard(currentBoardId).labels.filter(label => {
        return tpl.labels.get().indexOf(label._id) > -1;
      });
    }
    return false;
  },
});

Template.addCardForm.events({
  keydown(evt, tpl) {
    tpl.pressKey(evt);
  },
  'click .js-link': Popup.open('linkCard'),
  'click .js-search': Popup.open('searchElement'),
  'click .js-card-template': Popup.open('searchElement'),
});

Template.addCardForm.onRendered(function () {
  const tpl = this;
  const $textarea = this.$('textarea');

  autosize($textarea);

  $textarea.escapeableTextComplete(
    [
      // User mentions
      {
        match: /\B@([\w.-]*)$/,
        search(term, callback) {
          const currentBoard = Utils.getCurrentBoard();
          callback(
            $.map(currentBoard.activeMembers(), member => {
              const user = ReactiveCache.getUser(member.userId);
              return user.username.indexOf(term) === 0 ? user : null;
            }),
          );
        },
        template(user) {
          if (user.profile && user.profile.fullname) {
            return (user.username + " (" + user.profile.fullname + ")");
          }
          return user.username;
        },
        replace(user) {
          toggleValueInReactiveArray(tpl.members, user._id);
          return '';
        },
        index: 1,
      },

      // Labels
      {
        match: /\B#(\w*)$/,
        search(term, callback) {
          const currentBoard = Utils.getCurrentBoard();
          callback(
            $.map(currentBoard.labels, label => {
              if (label.name == undefined) {
                label.name = "";
              }
              if (
                label.name.indexOf(term) > -1 ||
                label.color.indexOf(term) > -1
              ) {
                return label;
              }
              return null;
            }),
          );
        },
        template(label) {
          return Blaze.toHTMLWithData(Template.autocompleteLabelLine, {
            hasNoName: !label.name,
            colorName: label.color,
            labelName: label.name || label.color,
          });
        },
        replace(label) {
          toggleValueInReactiveArray(tpl.labels, label._id);
          return '';
        },
        index: 1,
      },
    ],
    {
      // When the autocomplete menu is shown we want both a press of both `Tab`
      // or `Enter` to validation the auto-completion. We also need to stop the
      // event propagation to prevent the card from submitting (on `Enter`) or
      // going on the next column (on `Tab`).
      /*
      onKeydown(evt, commands) {
        // Prevent custom focus movement on Tab key for accessibility
        // if (evt.keyCode === 9 || evt.keyCode === 13) {
        //  evt.stopPropagation();
        //  return commands.KEY_ENTER;
        //}
        return null;
      },
      */
    },
  );
});

Template.linkCardPopup.onCreated(function () {
  this.selectedBoardId = new ReactiveVar('');
  this.selectedSwimlaneId = new ReactiveVar('');
  this.selectedListId = new ReactiveVar('');

  this.boardId = Session.get('currentBoard');
  // In order to get current board info
  Meteor.subscribe('board', this.boardId, false);
  this.board = ReactiveCache.getBoard(this.boardId);
  // List where to insert card
  this.list = $(Popup._getTopStack().openerElement).closest('.js-list');
  const listData = Blaze.getData(this.list[0]);
  this.listId = listData._id;
  // Swimlane where to insert card
  const swimlane = $(Popup._getTopStack().openerElement).closest(
    '.js-swimlane',
  );
  this.swimlaneId = '';
  if (Utils.boardView() === 'board-view-swimlanes')
    this.swimlaneId = Blaze.getData(swimlane[0])._id;
  else if (Utils.boardView() === 'board-view-lists' || !Utils.boardView)
    this.swimlaneId = listData.swimlaneId || ReactiveCache.getSwimlane({ boardId: this.boardId })._id;

  this.getSortIndex = () => {
    const position = Template.currentData().position;
    let ret;
    if (position === 'top') {
      const firstCardDom = this.list.find('.js-minicard:first')[0];
      ret = Utils.calculateIndex(null, firstCardDom).base;
    } else if (position === 'bottom') {
      const lastCardDom = this.list.find('.js-minicard:last')[0];
      ret = Utils.calculateIndex(lastCardDom, null).base;
    }
    return ret;
  };
});

Template.linkCardPopup.helpers({
  boards() {
    const ret = ReactiveCache.getBoards(
      {
        archived: false,
        'members.userId': Meteor.userId(),
        _id: { $ne: Session.get('currentBoard') },
        type: 'board',
      },
      {
        sort: { sort: 1 /* boards default sorting */ },
      },
    );
    return ret;
  },

  swimlanes() {
    const tpl = Template.instance();
    if (!tpl.selectedBoardId.get()) {
      return [];
    }
    const board = ReactiveCache.getBoard(tpl.selectedBoardId.get());
    if (!board) {
      return [];
    }

    // Ensure default swimlane exists
    board.getDefaultSwimline();

    const swimlanes = ReactiveCache.getSwimlanes(
    {
      boardId: tpl.selectedBoardId.get()
    },
    {
      sort: { sort: 1 },
    });
    return swimlanes;
  },

  lists() {
    const tpl = Template.instance();
    if (!tpl.selectedBoardId.get()) {
      return [];
    }
    const lists = ReactiveCache.getLists(
    {
      boardId: tpl.selectedBoardId.get()
    },
    {
      sort: { sort: 1 },
    });
    return lists;
  },

  cards() {
    const tpl = Template.instance();
    if (!tpl.board) {
      return [];
    }
    const ownCardsIds = tpl.board.cards().map(card => card.getRealId());
    const selector = {
      archived: false,
      linkedId: { $nin: ownCardsIds },
      _id: { $nin: ownCardsIds },
      // #5808: never offer an existing linked card/board as a link target —
      // linking to one builds a chain of linkedId pointers that renders the
      // card inaccessible. Only real cards may be linked.
      type: { $nin: ['template-card', 'cardType-linkedCard', 'cardType-linkedBoard'] },
    };
    if (tpl.selectedBoardId.get()) selector.boardId = tpl.selectedBoardId.get();
    if (tpl.selectedSwimlaneId.get()) selector.swimlaneId = tpl.selectedSwimlaneId.get();
    if (tpl.selectedListId.get()) selector.listId = tpl.selectedListId.get();

    const ret = ReactiveCache.getCards(selector, { sort: { sort: 1 } });
    // #5394: sort the Cards dropdown alphabetically by title
    // (case-insensitive) so a card can be found on boards with many cards.
    return sortCardsByTitle(ret);
  },

  isTitleDefault(title) {
    // https://github.com/wekan/wekan/issues/4763
    // https://github.com/wekan/wekan/issues/4742
    // Translation text for "default" does not work, it returns an object.
    // When that happens, try use translation "defaultdefault" that has same content of default, or return text "Default".
    // This can happen, if swimlane does not have name.
    // Yes, this is fixing the symptom (Swimlane title does not have title)
    // instead of fixing the problem (Add Swimlane title when creating swimlane)
    // because there could be thousands of swimlanes, adding name Default to all of them
    // would be very slow.
    if (title.startsWith("key 'default") && title.endsWith('returned an object instead of string.')) {
      if (`${TAPi18n.__('defaultdefault')}`.startsWith("key 'default") && `${TAPi18n.__('defaultdefault')}`.endsWith('returned an object instead of string.')) {
        return 'Default';
      } else  {
        return `${TAPi18n.__('defaultdefault')}`;
      }
    } else if (title === 'Default') {
      return `${TAPi18n.__('defaultdefault')}`;
    } else  {
      return title;
    }
  },
});

Template.linkCardPopup.events({
  'change .js-select-boards'(evt, tpl) {
    const val = $(evt.currentTarget).val();
    Meteor.subscribe('board', val, false);
    // Clear selections to allow linking only board or re-choose swimlane/list
    tpl.selectedSwimlaneId.set('');
    tpl.selectedListId.set('');
    tpl.selectedBoardId.set(val);
  },
  'change .js-select-swimlanes'(evt, tpl) {
    tpl.selectedSwimlaneId.set($(evt.currentTarget).val());
  },
  'change .js-select-lists'(evt, tpl) {
    tpl.selectedListId.set($(evt.currentTarget).val());
  },
  async 'click .js-done'(evt, tpl) {
    // LINK CARD (or, when no card is chosen, fall back to a board-level link
    // so a whole board can be linked even when that board already has cards).
    // https://github.com/wekan/wekan/issues/5715
    evt.stopPropagation();
    evt.preventDefault();
    const linkedId = $('.js-select-cards option:selected').val();
    if (!linkedId) {
      const boardId = $('.js-select-boards option:selected').val();
      // No board and no card selected: nothing to link.
      if (!boardId) {
        Popup.back();
        return;
      }
      // A linkedBoard card for this board already exists; avoid duplicates.
      if (ReactiveCache.getCard({ linkedId: boardId, archived: false })) {
        Popup.back();
        return;
      }
      const boardCardNumber = await tpl.board.getNextCardNumber();
      const boardSortIndex = tpl.getSortIndex();
      const boardCardId = Cards.insert({
        title: $('.js-select-boards option:selected').text(), //dummy
        listId: tpl.listId,
        swimlaneId: tpl.swimlaneId,
        boardId: tpl.boardId,
        sort: boardSortIndex,
        type: 'cardType-linkedBoard',
        linkedId: boardId,
        cardNumber: boardCardNumber,
      });
      Filter.addException(boardCardId);
      Popup.back();
      return;
    }
    // #5808: refuse to link to a linked card/board or to a card that links back
    // to this board — those build a chain/cycle of linkedId pointers that renders
    // the cards inaccessible. The <select> already filters these out, but its
    // options can be stale, so re-check the resolved target here.
    const targetCard = ReactiveCache.getCard(linkedId);
    const ownCardsIds = tpl.board.cards().map(card => card.getRealId());
    if (!isLinkableCardTarget(targetCard, ownCardsIds)) {
      alert(TAPi18n.__('error-linked-card-not-allowed'));
      Popup.back();
      return;
    }
    const nextCardNumber = await tpl.board.getNextCardNumber();
    const sortIndex = tpl.getSortIndex();
    const _id = Cards.insert({
      title: $('.js-select-cards option:selected').text(), //dummy
      listId: tpl.listId,
      swimlaneId: tpl.swimlaneId,
      boardId: tpl.boardId,
      sort: sortIndex,
      type: 'cardType-linkedCard',
      linkedId,
      cardNumber: nextCardNumber,
    });
    Filter.addException(_id);
    Popup.back();
  },
  async 'click .js-link-board'(evt, tpl) {
    //LINK BOARD
    evt.stopPropagation();
    evt.preventDefault();
    const impBoardId = $('.js-select-boards option:selected').val();
    if (
      !impBoardId ||
      ReactiveCache.getCard({ linkedId: impBoardId, archived: false })
    ) {
      Popup.back();
      return;
    }
    const nextCardNumber = await tpl.board.getNextCardNumber();
    const sortIndex = tpl.getSortIndex();
    const _id = Cards.insert({
      title: $('.js-select-boards option:selected').text(), //dummy
      listId: tpl.listId,
      swimlaneId: tpl.swimlaneId,
      boardId: tpl.boardId,
      sort: sortIndex,
      type: 'cardType-linkedBoard',
      linkedId: impBoardId,
      cardNumber: nextCardNumber,
    });
    Filter.addException(_id);
    Popup.back();
  },
});

Template.searchElementPopup.onCreated(function () {
  this.isCardTemplateSearch = $(Popup._getTopStack().openerElement).hasClass(
    'js-card-template',
  );
  this.isListTemplateSearch = $(Popup._getTopStack().openerElement).hasClass(
    'js-list-template',
  );
  this.isSwimlaneTemplateSearch = $(
    Popup._getTopStack().openerElement,
  ).hasClass('js-open-add-swimlane-menu');
  this.isBoardTemplateSearch = $(Popup._getTopStack().openerElement).hasClass(
    'js-add-board',
  );
  this.isTemplateSearch =
    this.isCardTemplateSearch ||
    this.isListTemplateSearch ||
    this.isSwimlaneTemplateSearch ||
    this.isBoardTemplateSearch;

  this.board = {};
  if (this.isTemplateSearch) {
    const boardId = (ReactiveCache.getCurrentUser().profile || {}).templatesBoardId;
    if (boardId) {
      Meteor.subscribe('board', boardId, false);
      this.board = ReactiveCache.getBoard(boardId);
    }
  } else {
    this.board = Utils.getCurrentBoard();
  }
  if (!this.board) {
    Popup.back();
    return;
  }
  this.boardId = this.board._id;
  // Subscribe to this board
  Meteor.subscribe('board', this.boardId, false);
  this.selectedBoardId = new ReactiveVar(this.boardId);
  this.list = $(Popup._getTopStack().openerElement).closest('.js-list');

    if (!this.isBoardTemplateSearch) {
      this.swimlaneId = '';
      // Swimlane where to insert card
      const swimlane = $(Popup._getTopStack().openerElement).parents(
        '.js-swimlane',
      );
      const listData = Blaze.getData(this.list[0]);
      if (Utils.boardView() === 'board-view-swimlanes')
        this.swimlaneId = Blaze.getData(swimlane[0])._id;
      else this.swimlaneId = listData.swimlaneId || ReactiveCache.getSwimlane({ boardId: this.boardId })._id;
      // List where to insert card
      this.listId = listData._id;
  }
  this.term = new ReactiveVar('');

  this.getSortIndex = () => {
    const position = Template.currentData().position;
    let ret;
    if (position === 'top') {
      const firstCardDom = this.list.find('.js-minicard:first')[0];
      ret = Utils.calculateIndex(null, firstCardDom).base;
    } else if (position === 'bottom') {
      const lastCardDom = this.list.find('.js-minicard:last')[0];
      ret = Utils.calculateIndex(lastCardDom, null).base;
    }
    return ret;
  };
});

Template.searchElementPopup.helpers({
  boards() {
    const ret = ReactiveCache.getBoards(
      {
        archived: false,
        'members.userId': Meteor.userId(),
        _id: { $ne: Session.get('currentBoard') },
        type: 'board',
      },
      {
        sort: { sort: 1 /* boards default sorting */ },
      },
    );
    return ret;
  },

  results() {
    const tpl = Template.instance();
    if (!tpl.selectedBoardId) {
      return [];
    }
    const board = ReactiveCache.getBoard(tpl.selectedBoardId.get());
    if (!tpl.isTemplateSearch || tpl.isCardTemplateSearch) {
      return board.searchCards(tpl.term.get(), false);
    } else if (tpl.isListTemplateSearch) {
      return board.searchLists(tpl.term.get());
    } else if (tpl.isSwimlaneTemplateSearch) {
      return board.searchSwimlanes(tpl.term.get());
    } else if (tpl.isBoardTemplateSearch) {
      const boards = board.searchBoards(tpl.term.get());
      boards.forEach(board => {
        Meteor.subscribe('board', board.linkedId, false);
      });
      return boards;
    } else {
      return [];
    }
  },
});

Template.searchElementPopup.events({
  'change .js-select-boards'(evt, tpl) {
    Meteor.subscribe('board', $(evt.currentTarget).val(), false);
    tpl.selectedBoardId.set($(evt.currentTarget).val());
  },
  'submit .js-search-term-form'(evt, tpl) {
    evt.preventDefault();
    tpl.term.set(evt.target.searchTerm.value);
  },
  async 'click .js-minicard'(evt, tpl) {
    // 0. Common
    const title = $('.js-element-title')
      .val()
      .trim();
    if (!title) return;
    const element = Blaze.getData(evt.currentTarget);
    element.title = title;
    let _id = '';
    if (!tpl.isTemplateSearch || tpl.isCardTemplateSearch) {
      // Card insertion
      // 1. Common
      // Compute the sort index BEFORE the first await: getSortIndex() reads
      // Template.currentData(), and Blaze's current-view context is lost across
      // an await, so calling it afterwards threw "There is no current view" and
      // no card was created from the template. Capture it while still in the
      // synchronous event/view context.
      const sortIndex = tpl.getSortIndex();
      element.cardNumber = await tpl.board.getNextCardNumber();
      element.sort = sortIndex;
      // 1.A From template
      if (tpl.isTemplateSearch) {
        element.type = 'cardType-card';
        element.linkedId = '';
        // #5798: instantiate the template into the CURRENT board, not the
        // templates board. For a template search tpl.boardId is the templates
        // board (it is the search source), so copying with it created the card
        // with boardId = templates board. The card still showed in the target
        // list (the list query is by listId and the templates board is
        // subscribed), but clicking it navigated to the templates board instead
        // of opening the card. The target list/swimlane were already resolved on
        // the current board.
        // Instantiate into the board that OWNS the target list (where the user
        // clicked "add card"). Deriving it from tpl.listId is reliable even when
        // Utils.getCurrentBoard() (route/session state) has not settled yet — as
        // on the slower CI production bundle, where falling back to tpl.boardId
        // wrongly created the card on the templates board.
        const targetList = ReactiveCache.getList(tpl.listId);
        const targetBoardId =
          (targetList || {}).boardId ||
          (Utils.getCurrentBoard() || {})._id ||
          tpl.boardId;
        _id = await element.copy(targetBoardId, tpl.swimlaneId, tpl.listId);
        // 1.B Linked card
      } else {
        _id = element.link(tpl.boardId, tpl.swimlaneId, tpl.listId);
      }
      Filter.addException(_id);
      // List insertion
    } else if (tpl.isListTemplateSearch) {
      element.sort = ReactiveCache.getSwimlane(tpl.swimlaneId)
        .lists()
        .length;
      element.type = 'list';
      _id = await element.copy(tpl.boardId, tpl.swimlaneId);
    } else if (tpl.isSwimlaneTemplateSearch) {
      element.sort = ReactiveCache.getBoard(tpl.boardId)
        .swimlanes()
        .length;
      element.type = 'swimlane';
      _id = await element.copy(tpl.boardId);
    } else if (tpl.isBoardTemplateSearch) {
      Meteor.call(
        'copyBoard',
        element.linkedId,
        {
          sort: ReactiveCache.getBoards({ archived: false }).length,
          type: 'board',
          title: element.title,
        },
        (err, data) => {
          _id = data;
          Meteor.subscribe('board', _id, false);
          FlowRouter.go('board', {
            id: _id,
            slug: getSlug(element.title),
          });
        },
      );
    }
    Popup.back();
  },
});

Template.spinnerList.helpers({
  getSpinnerTemplate() {
    return getSpinnerTemplate();
  },
  getSkSpinnerName() {
    return 'sk-spinner-' + getSpinnerName().toLowerCase();
  },
});

Template.spinnerList.onCreated(function () {
  this.swimlaneId = '';
});

Template.spinnerList.onRendered(function () {
  const instance = this;

  // Find the parent listBody template instance via the DOM
  const listBodyEl = this.$('.sk-spinner-list').closest('.list-body')[0];
  const listBodyView = listBodyEl && Blaze.getView(listBodyEl, 'Template.listBody');
  const listBodyInstance = listBodyView?.templateInstance?.();

  instance.cardlimit = listBodyInstance && listBodyInstance.cardlimit;
  instance.listId = listBodyInstance && Blaze.getData(listBodyEl)?._id;

  const isSandstorm =
    Meteor.settings &&
    Meteor.settings.public &&
    Meteor.settings.public.sandstorm;

  // Get swimlane ID from the DOM hierarchy (listBody is inside list inside swimlane)
  const getSwimlaneId = () => {
    const swimlaneEl = listBodyEl && $(listBodyEl).closest('.swimlane').get(0);
    return swimlaneEl && Blaze.getData(swimlaneEl)?._id;
  };

  if (isSandstorm) {
    const user = ReactiveCache.getCurrentUser();
    if (user) {
      if (Utils.boardView() === 'board-view-swimlanes') {
        instance.swimlaneId = getSwimlaneId();
      }
    }
  } else if (Utils.boardView() === 'board-view-swimlanes') {
    instance.swimlaneId = getSwimlaneId();
  }

  instance.spinner = instance.find('.sk-spinner-list');
  instance.container = listBodyEl;

  $(instance.container).on(
    `scroll.spinner_${instance.swimlaneId}_${instance.listId}`,
    () => instance._updateList(),
  );
  $(window).on(`resize.spinner_${instance.swimlaneId}_${instance.listId}`, () =>
    instance._updateList(),
  );

  instance._updateList();
});

Template.spinnerList.onDestroyed(function () {
  $(this.container).off(`scroll.spinner_${this.swimlaneId}_${this.listId}`);
  $(window).off(`resize.spinner_${this.swimlaneId}_${this.listId}`);
});

function checkIdleTime() {
  return window.requestIdleCallback ||
    function (handler) {
      const startTime = Date.now();
      return setTimeout(function () {
        handler({
          didTimeout: false,
          timeRemaining() {
            return Math.max(0, 50.0 - (Date.now() - startTime));
          },
        });
      }, 1);
    };
}

Template.spinnerList.onCreated(function () {
  const instance = this;

  instance._updateList = function () {
    // Use fallback when requestIdleCallback is not available on iOS and Safari
    // https://www.afasterweb.com/2017/11/20/utilizing-idle-moments/
    if (instance._spinnerInView()) {
      instance.cardlimit.set(instance.cardlimit.get() + InfiniteScrollIter);
      checkIdleTime()(() => instance._updateList());
    }
  };

  instance._spinnerInView = function () {
    // spinner deleted
    if (!instance.spinner || !instance.spinner.offsetTop) {
      return false;
    }

    const spinnerViewPosition = instance.spinner.offsetTop - instance.container.offsetTop + instance.spinner.clientHeight;

    const parentViewHeight = instance.container.clientHeight;
    const bottomViewPosition = instance.container.scrollTop + parentViewHeight;

    return bottomViewPosition > spinnerViewPosition;
  };
});
