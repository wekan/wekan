import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { Spinner } from '/client/lib/spinner';

const subManager = new SubsManager();
const InfiniteScrollIter = 10;

BlazeComponent.extendComponent({
  onCreated() {
    // for infinite scrolling
    this.cardlimit = new ReactiveVar(InfiniteScrollIter);
  },

  mixins() {
    return [];
  },

  customFieldsSum() {
    const ret = ReactiveCache.getCustomFields({
      boardIds: { $in: [Session.get('currentBoard')] },
      showSumAtTopOfList: true,
    });
    return ret;
  },

  openForm(options) {
    options = options || {};
    options.position = options.position || 'top';

    const forms = this.childComponents('inlinedForm');
    let form = forms.find(component => {
      return component.data().position === options.position;
    });
    if (!form && forms.length > 0) {
      form = forms[0];
    }
    form.open();
  },

  addCard(evt) {
    evt.preventDefault();
    const firstCardDom = this.find('.js-minicard:first');
    const lastCardDom = this.find('.js-minicard:last');
    const textarea = $(evt.currentTarget).find('textarea');
    const position = this.currentData().position;
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

    const board = this.data().board();
    let linkedId = '';
    let swimlaneId = '';
    let cardType = 'cardType-card';
    if (title) {
      if (board.isTemplatesBoard()) {
        swimlaneId = this.parentComponent()
          .parentComponent()
          .data()._id; // Always swimlanes view
        const swimlane = ReactiveCache.getSwimlane(swimlaneId);
        // If this is the card templates swimlane, insert a card template
        if (swimlane.isCardTemplatesSwimlane()) cardType = 'template-card';
        // If this is the board templates swimlane, insert a board template and a linked card
        else if (swimlane.isBoardTemplatesSwimlane()) {
          linkedId = Boards.insert({
            title,
            permission: 'private',
            type: 'template-board',
          });
          Swimlanes.insert({
            title: TAPi18n.__('default'),
            boardId: linkedId,
          });
          cardType = 'cardType-linkedBoard';
        }
      } else if (Utils.boardView() === 'board-view-swimlanes')
        swimlaneId = this.parentComponent()
          .parentComponent()
          .data()._id;
      else if (
        Utils.boardView() === 'board-view-lists' ||
        Utils.boardView() === 'board-view-cal' ||
        !Utils.boardView()
      )
      swimlaneId = board.getDefaultSwimline()._id;

      const nextCardNumber = board.getNextCardNumber();

      const _id = Cards.insert({
        title,
        members,
        labelIds,
        customFields,
        listId: this.data()._id,
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
      const cardCount = this.data()
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

      // We keep the form opened, empty it, and scroll to it.
      textarea.val('').focus();
      autosize.update(textarea);
      if (position === 'bottom') {
        this.scrollToBottom();
      }
    }
  },

  cardFormComponent() {
    for (const inlinedForm of this.childComponents('inlinedForm')) {
      const [addCardForm] = inlinedForm.childComponents('addCardForm');
      if (addCardForm) {
        return addCardForm;
      }
    }
    return null;
  },

  scrollToBottom() {
    const container = this.firstNode();
    $(container).animate({
      scrollTop: container.scrollHeight,
    });
  },

  clickOnMiniCard(evt) {
    if (MultiSelection.isActive() || evt.shiftKey) {
      evt.stopImmediatePropagation();
      evt.preventDefault();
      const methodName = evt.shiftKey ? 'toggleRange' : 'toggle';
      MultiSelection[methodName](this.currentData()._id);

      // If the card is already selected, we want to de-select it.
      // XXX We should probably modify the minicard href attribute instead of
      // overwriting the event in case the card is already selected.
    } else if (Utils.isMiniScreen()) {
      evt.preventDefault();
      Session.set('popupCardId', this.currentData()._id);
      this.cardDetailsPopup(evt);
    } else if (Session.equals('currentCard', this.currentData()._id)) {
      evt.stopImmediatePropagation();
      evt.preventDefault();
      Utils.goBoardId(Session.get('currentBoard'));
    }
  },

  cardIsSelected() {
    return Session.equals('currentCard', this.currentData()._id);
  },

  toggleMultiSelection(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    MultiSelection.toggle(this.currentData()._id);
  },

  idOrNull(swimlaneId) {
    if (
      Utils.boardView() === 'board-view-swimlanes' ||
      this.data()
        .board()
        .isTemplatesBoard()
    )
      return swimlaneId;
    return undefined;
  },

  cardsWithLimit(swimlaneId) {
    const limit = this.cardlimit.get();
    const defaultSort = { sort: 1 };
    const sortBy = Session.get('sortBy') ? Session.get('sortBy') : defaultSort;
    const selector = {
      listId: this.currentData()._id,
      archived: false,
    };
    if (swimlaneId) selector.swimlaneId = swimlaneId;
    const ret = ReactiveCache.getCards(Filter.mongoSelector(selector), {
      // sort: ['sort'],
      sort: sortBy,
      limit,
    }, true);
    return ret;
  },

  showSpinner(swimlaneId) {
    const list = Template.currentData();
    return list.cards(swimlaneId).length > this.cardlimit.get();
  },

  canSeeAddCard() {
    return (
      !this.reachedWipLimit() &&
      Utils.canModifyCard()
    );
  },

  reachedWipLimit() {
    const list = Template.currentData();
    return (
      !list.getWipLimit('soft') &&
      list.getWipLimit('enabled') &&
      list.getWipLimit('value') <= list.cards().length
    );
  },

  isVerticalScrollbars() {
    const user = ReactiveCache.getCurrentUser();
    return user && user.isVerticalScrollbars();
  },

  cardDetailsPopup(event) {
    if (!Popup.isOpen()) {
      Popup.open("cardDetails")(event);
    }
  },

  events() {
    return [
      {
        'click .js-minicard': this.clickOnMiniCard,
        'click .js-toggle-multi-selection': this.toggleMultiSelection,
        'click .open-minicard-composer': this.scrollToBottom,
        submit: this.addCard,
      },
    ];
  },
}).register('listBody');

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

BlazeComponent.extendComponent({
  onCreated() {
    this.labels = new ReactiveVar([]);
    this.members = new ReactiveVar([]);
    this.customFields = new ReactiveVar([]);

    const currentBoardId = Session.get('currentBoard');
    arr = [];
    _.forEach(
      ReactiveCache.getBoard(currentBoardId)
        .customFields(),
      function (field) {
        if (field.automaticallyOnCard || field.alwaysOnCard)
          arr.push({ _id: field._id, value: null });
      },
    );
    this.customFields.set(arr);
  },

  reset() {
    this.labels.set([]);
    this.members.set([]);
    this.customFields.set([]);
  },

  getLabels() {
    const currentBoardId = Session.get('currentBoard');
    if (ReactiveCache.getBoard(currentBoardId).labels) {
      return ReactiveCache.getBoard(currentBoardId).labels.filter(label => {
        return this.labels.get().indexOf(label._id) > -1;
      });
    }
    return false;
  },

  pressKey(evt) {
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
      evt.preventDefault();
      const isReverse = evt.shiftKey;
      const list = $(`#js-list-${this.data().listId}`);
      const listSelector = '.js-list:not(.js-list-composer)';
      let nextList = list[isReverse ? 'prev' : 'next'](listSelector).get(0);
      // If there is no next list, loop back to the beginning.
      if (!nextList) {
        nextList = $(listSelector + (isReverse ? ':last' : ':first')).get(0);
      }

      BlazeComponent.getComponentForElement(nextList).openForm({
        position: this.data().position,
      });
    }
  },

  events() {
    return [
      {
        keydown: this.pressKey,
        'click .js-link': Popup.open('linkCard'),
        'click .js-search': Popup.open('searchElement'),
        'click .js-card-template': Popup.open('searchElement'),
      },
    ];
  },

  onRendered() {
    const editor = this;
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
            toggleValueInReactiveArray(editor.members, user._id);
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
            toggleValueInReactiveArray(editor.labels, label._id);
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
        onKeydown(evt, commands) {
          if (evt.keyCode === 9 || evt.keyCode === 13) {
            evt.stopPropagation();
            return commands.KEY_ENTER;
          }
          return null;
        },
      },
    );
  },
}).register('addCardForm');

BlazeComponent.extendComponent({
  onCreated() {
    this.selectedBoardId = new ReactiveVar('');
    this.selectedSwimlaneId = new ReactiveVar('');
    this.selectedListId = new ReactiveVar('');

    this.boardId = Session.get('currentBoard');
    // In order to get current board info
    subManager.subscribe('board', this.boardId, false);
    this.board = ReactiveCache.getBoard(this.boardId);
    // List where to insert card
    this.list = $(Popup._getTopStack().openerElement).closest('.js-list');
    this.listId = Blaze.getData(this.list[0])._id;
    // Swimlane where to insert card
    const swimlane = $(Popup._getTopStack().openerElement).closest(
      '.js-swimlane',
    );
    this.swimlaneId = '';
    if (Utils.boardView() === 'board-view-swimlanes')
      this.swimlaneId = Blaze.getData(swimlane[0])._id;
    else if (Utils.boardView() === 'board-view-lists' || !Utils.boardView)
      this.swimlaneId = ReactiveCache.getSwimlane({ boardId: this.boardId })._id;
  },

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
    if (!this.selectedBoardId.get()) {
      return [];
    }
    const swimlanes = ReactiveCache.getSwimlanes(
    {
      boardId: this.selectedBoardId.get()
    },
    {
      sort: { sort: 1 },
    });
    if (swimlanes.length)
      this.selectedSwimlaneId.set(swimlanes[0]._id);
    return swimlanes;
  },

  lists() {
    if (!this.selectedBoardId.get()) {
      return [];
    }
    const lists = ReactiveCache.getLists(
    {
      boardId: this.selectedBoardId.get()
    },
    {
      sort: { sort: 1 },
    });
    if (lists.length) this.selectedListId.set(lists[0]._id);
    return lists;
  },

  cards() {
    if (!this.board) {
      return [];
    }
    const ownCardsIds = this.board.cards().map(card => card.getRealId());
    const ret = ReactiveCache.getCards(
    {
      boardId: this.selectedBoardId.get(),
      swimlaneId: this.selectedSwimlaneId.get(),
      listId: this.selectedListId.get(),
      archived: false,
      linkedId: { $nin: ownCardsIds },
      _id: { $nin: ownCardsIds },
      type: { $nin: ['template-card'] },
    },
    {
      sort: { sort: 1 },
    });
    return ret;
  },

  getSortIndex() {
    const position = this.currentData().position;
    let ret;
    if (position === 'top') {
      const firstCardDom = this.list.find('.js-minicard:first')[0];
      ret = Utils.calculateIndex(null, firstCardDom).base;
    } else if (position === 'bottom') {
      const lastCardDom = this.list.find('.js-minicard:last')[0];
      ret = Utils.calculateIndex(lastCardDom, null).base;
    }
    return ret;
  },

  events() {
    return [
      {
        'change .js-select-boards'(evt) {
          subManager.subscribe('board', $(evt.currentTarget).val(), false);
          this.selectedBoardId.set($(evt.currentTarget).val());
        },
        'change .js-select-swimlanes'(evt) {
          this.selectedSwimlaneId.set($(evt.currentTarget).val());
        },
        'change .js-select-lists'(evt) {
          this.selectedListId.set($(evt.currentTarget).val());
        },
        'click .js-done'(evt) {
          // LINK CARD
          evt.stopPropagation();
          evt.preventDefault();
          const linkedId = $('.js-select-cards option:selected').val();
          if (!linkedId) {
            Popup.back();
            return;
          }
          const nextCardNumber = this.board.getNextCardNumber();
          const sortIndex = this.getSortIndex();
          const _id = Cards.insert({
            title: $('.js-select-cards option:selected').text(), //dummy
            listId: this.listId,
            swimlaneId: this.swimlaneId,
            boardId: this.boardId,
            sort: sortIndex,
            type: 'cardType-linkedCard',
            linkedId,
            cardNumber: nextCardNumber,
          });
          Filter.addException(_id);
          Popup.back();
        },
        'click .js-link-board'(evt) {
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
          const nextCardNumber = this.board.getNextCardNumber();
          const sortIndex = this.getSortIndex();
          const _id = Cards.insert({
            title: $('.js-select-boards option:selected').text(), //dummy
            listId: this.listId,
            swimlaneId: this.swimlaneId,
            boardId: this.boardId,
            sort: sortIndex,
            type: 'cardType-linkedBoard',
            linkedId: impBoardId,
            cardNumber: nextCardNumber,
          });
          Filter.addException(_id);
          Popup.back();
        },
      },
    ];
  },
}).register('linkCardPopup');

Template.linkCardPopup.helpers({
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

BlazeComponent.extendComponent({
  mixins() {
    return [];
  },

  onCreated() {
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
        subManager.subscribe('board', boardId, false);
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
    subManager.subscribe('board', this.boardId, false);
    this.selectedBoardId = new ReactiveVar(this.boardId);
    this.list = $(Popup._getTopStack().openerElement).closest('.js-list');

    if (!this.isBoardTemplateSearch) {
      this.swimlaneId = '';
      // Swimlane where to insert card
      const swimlane = $(Popup._getTopStack().openerElement).parents(
        '.js-swimlane',
      );
      if (Utils.boardView() === 'board-view-swimlanes')
        this.swimlaneId = Blaze.getData(swimlane[0])._id;
      else this.swimlaneId = ReactiveCache.getSwimlane({ boardId: this.boardId })._id;
      // List where to insert card
      this.listId = Blaze.getData(this.list[0])._id;
    }
    this.term = new ReactiveVar('');
  },

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
    if (!this.selectedBoardId) {
      return [];
    }
    const board = ReactiveCache.getBoard(this.selectedBoardId.get());
    if (!this.isTemplateSearch || this.isCardTemplateSearch) {
      return board.searchCards(this.term.get(), false);
    } else if (this.isListTemplateSearch) {
      return board.searchLists(this.term.get());
    } else if (this.isSwimlaneTemplateSearch) {
      return board.searchSwimlanes(this.term.get());
    } else if (this.isBoardTemplateSearch) {
      const boards = board.searchBoards(this.term.get());
      boards.forEach(board => {
        subManager.subscribe('board', board.linkedId, false);
      });
      return boards;
    } else {
      return [];
    }
  },

  getSortIndex() {
    const position = this.data().position;
    let ret;
    if (position === 'top') {
      const firstCardDom = this.list.find('.js-minicard:first')[0];
      ret = Utils.calculateIndex(null, firstCardDom).base;
    } else if (position === 'bottom') {
      const lastCardDom = this.list.find('.js-minicard:last')[0];
      ret = Utils.calculateIndex(lastCardDom, null).base;
    }
    return ret;
  },

  events() {
    return [
      {
        'change .js-select-boards'(evt) {
          subManager.subscribe('board', $(evt.currentTarget).val(), false);
          this.selectedBoardId.set($(evt.currentTarget).val());
        },
        'submit .js-search-term-form'(evt) {
          evt.preventDefault();
          this.term.set(evt.target.searchTerm.value);
        },
        'click .js-minicard'(evt) {
          // 0. Common
          const title = $('.js-element-title')
            .val()
            .trim();
          if (!title) return;
          const element = Blaze.getData(evt.currentTarget);
          element.title = title;
          let _id = '';
          if (!this.isTemplateSearch || this.isCardTemplateSearch) {
            // Card insertion
            // 1. Common
            element.cardNumber = this.board.getNextCardNumber();
            element.sort = this.getSortIndex();
            // 1.A From template
            if (this.isTemplateSearch) {
              element.type = 'cardType-card';
              element.linkedId = '';
              _id = element.copy(this.boardId, this.swimlaneId, this.listId);
              // 1.B Linked card
            } else {
              _id = element.link(this.boardId, this.swimlaneId, this.listId);
            }
            Filter.addException(_id);
            // List insertion
          } else if (this.isListTemplateSearch) {
            element.sort = ReactiveCache.getSwimlane(this.swimlaneId)
              .lists()
              .length;
            element.type = 'list';
            _id = element.copy(this.boardId, this.swimlaneId);
          } else if (this.isSwimlaneTemplateSearch) {
            element.sort = ReactiveCache.getBoard(this.boardId)
              .swimlanes()
              .length;
            element.type = 'swimlane';
            _id = element.copy(this.boardId);
          } else if (this.isBoardTemplateSearch) {
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
                subManager.subscribe('board', _id, false);
                FlowRouter.go('board', {
                  id: _id,
                  slug: getSlug(element.title),
                });
              },
            );
          }
          Popup.back();
        },
      },
    ];
  },
}).register('searchElementPopup');

(class extends Spinner {
  onCreated() {
    this.cardlimit = this.parentComponent().cardlimit;

    this.listId = this.parentComponent().data()._id;
    this.swimlaneId = '';

    const isSandstorm =
      Meteor.settings &&
      Meteor.settings.public &&
      Meteor.settings.public.sandstorm;

    if (isSandstorm) {
      const user = ReactiveCache.getCurrentUser();
      if (user) {
        if (Utils.boardView() === 'board-view-swimlanes') {
          this.swimlaneId = this.parentComponent()
            .parentComponent()
            .parentComponent()
            .data()._id;
        }
      }
    } else if (Utils.boardView() === 'board-view-swimlanes') {
      this.swimlaneId = this.parentComponent()
        .parentComponent()
        .parentComponent()
        .data()._id;
    }
  }

  onRendered() {
    this.spinner = this.find('.sk-spinner-list');
    this.container = this.$(this.spinner).parents('.list-body')[0];

    $(this.container).on(
      `scroll.spinner_${this.swimlaneId}_${this.listId}`,
      () => this.updateList(),
    );
    $(window).on(`resize.spinner_${this.swimlaneId}_${this.listId}`, () =>
      this.updateList(),
    );

    this.updateList();
  }

  onDestroyed() {
    $(this.container).off(`scroll.spinner_${this.swimlaneId}_${this.listId}`);
    $(window).off(`resize.spinner_${this.swimlaneId}_${this.listId}`);
  }

  checkIdleTime() {
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

  updateList() {
    // Use fallback when requestIdleCallback is not available on iOS and Safari
    // https://www.afasterweb.com/2017/11/20/utilizing-idle-moments/

    if (this.spinnerInView()) {
      this.cardlimit.set(this.cardlimit.get() + InfiniteScrollIter);
      this.checkIdleTime(() => this.updateList());
    }
  }

  spinnerInView() {
    // spinner deleted
    if (!this.spinner.offsetTop) {
      return false;
    }

    const spinnerViewPosition = this.spinner.offsetTop - this.container.offsetTop + this.spinner.clientHeight;

    const parentViewHeight = this.container.clientHeight;
    const bottomViewPosition = this.container.scrollTop + parentViewHeight;

    return bottomViewPosition > spinnerViewPosition;
  }

  getSkSpinnerName() {
    return "sk-spinner-" + super.getSpinnerName().toLowerCase();
  }
}.register('spinnerList'));
