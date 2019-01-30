const subManager = new SubsManager();
const InfiniteScrollIter = 10;

BlazeComponent.extendComponent({
  onCreated() {
    // for infinite scrolling
    this.cardlimit = new ReactiveVar(InfiniteScrollIter);
  },

  onRendered() {
    const domElement = this.find('.js-perfect-scrollbar');

    this.$(domElement).on('scroll', () => this.updateList(domElement));
    $(window).on(`resize.${this.data().listId}`, () => this.updateList(domElement));

    // we add a Mutation Observer to allow propagations of cardlimit
    // when the spinner stays in the current view (infinite scrolling)
    this.mutationObserver = new MutationObserver(() => this.updateList(domElement));

    this.mutationObserver.observe(domElement, {
      childList: true,
    });

    this.updateList(domElement);
  },

  onDestroyed() {
    $(window).off(`resize.${this.data().listId}`);
    this.mutationObserver.disconnect();
  },

  mixins() {
    return [Mixins.PerfectScrollbar];
  },

  openForm(options) {
    options = options || {};
    options.position = options.position || 'top';

    const forms = this.childComponents('inlinedForm');
    let form = forms.find((component) => {
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

    const formComponent = this.childComponents('addCardForm')[0];
    let sortIndex;
    if (position === 'top') {
      sortIndex = Utils.calculateIndex(null, firstCardDom).base;
    } else if (position === 'bottom') {
      sortIndex = Utils.calculateIndex(lastCardDom, null).base;
    }

    const members = formComponent.members.get();
    const labelIds = formComponent.labels.get();
    const customFields = formComponent.customFields.get();

    const boardId = this.data().board();
    let swimlaneId = '';
    const boardView = Meteor.user().profile.boardView;
    if (boardView === 'board-view-swimlanes')
      swimlaneId = this.parentComponent().parentComponent().data()._id;
    else if ((boardView === 'board-view-lists') || (boardView === 'board-view-cal'))
      swimlaneId = boardId.getDefaultSwimline()._id;

    if (title) {
      const _id = Cards.insert({
        title,
        members,
        labelIds,
        customFields,
        listId: this.data()._id,
        boardId: boardId._id,
        sort: sortIndex,
        swimlaneId,
        type: 'cardType-card',
      });

      // if the displayed card count is less than the total cards in the list,
      // we need to increment the displayed card count to prevent the spinner
      // to appear
      const cardCount = this.data().cards(this.idOrNull(swimlaneId)).count();
      if (pthis.cardlimit.get() < cardCount) {
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

      formComponent.reset();
    }
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
    const currentUser = Meteor.user();
    if (currentUser.profile.boardView === 'board-view-swimlanes')
      return swimlaneId;
    return undefined;
  },

  cardsWithLimit(swimlaneId) {
    const limit = this.cardlimit.get();
    const selector = {
      listId: this.currentData()._id,
      archived: false,
    };
    if (swimlaneId)
      selector.swimlaneId = swimlaneId;
    return Cards.find(Filter.mongoSelector(selector), {
      sort: ['sort'],
      limit,
    });
  },

  spinnerInView(container) {
    const parentViewHeight = container.clientHeight;
    const bottomViewPosition = container.scrollTop + parentViewHeight;

    const spinner = this.find('.sk-spinner-list');

    const threshold = spinner.offsetTop;

    return bottomViewPosition > threshold;
  },

  showSpinner(swimlaneId) {
    const list = Template.currentData();
    return list.cards(swimlaneId).count() > this.cardlimit.get();
  },

  updateList(container) {
    // first, if the spinner is not rendered, we have reached the end of
    // the list of cards, so skip and disable firing the events
    const target = this.find('.sk-spinner-list');
    if (!target) {
      this.$(container).off('scroll');
      $(window).off(`resize.${this.data().listId}`);
      return;
    }

    if (this.spinnerInView(container)) {
      this.cardlimit.set(this.cardlimit.get() + InfiniteScrollIter);
      Ps.update(container);
    }
  },

  canSeeAddCard() {
    return !this.reachedWipLimit() && Meteor.user() && Meteor.user().isBoardMember() && !Meteor.user().isCommentOnly();
  },

  reachedWipLimit() {
    const list = Template.currentData();
    return !list.getWipLimit('soft') && list.getWipLimit('enabled') && list.getWipLimit('value') <= list.cards().count();
  },

  events() {
    return [{
      'click .js-minicard': this.clickOnMiniCard,
      'click .js-toggle-multi-selection': this.toggleMultiSelection,
      'click .open-minicard-composer': this.scrollToBottom,
      submit: this.addCard,
    }];
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
    _.forEach(Boards.findOne(currentBoardId).customFields().fetch(), function(field){
      if(field.automaticallyOnCard)
        arr.push({_id: field._id, value: null});
    });
    this.customFields.set(arr);
  },

  reset() {
    this.labels.set([]);
    this.members.set([]);
    this.customFields.set([]);
  },

  getLabels() {
    const currentBoardId = Session.get('currentBoard');
    return Boards.findOne(currentBoardId).labels.filter((label) => {
      return this.labels.get().indexOf(label._id) > -1;
    });
  },

  pressKey(evt) {
    // Pressing Enter should submit the card
    if (evt.keyCode === 13) {
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
        position:this.data().position,
      });
    }
  },

  events() {
    return [{
      keydown: this.pressKey,
      'click .js-link': Popup.open('linkCard'),
      'click .js-search': Popup.open('searchCard'),
    }];
  },

  onRendered() {
    const editor = this;
    const $textarea = this.$('textarea');

    autosize($textarea);

    $textarea.escapeableTextComplete([
      // User mentions
      {
        match: /\B@([\w.]*)$/,
        search(term, callback) {
          const currentBoard = Boards.findOne(Session.get('currentBoard'));
          callback($.map(currentBoard.activeMembers(), (member) => {
            const user = Users.findOne(member.userId);
            return user.username.indexOf(term) === 0 ? user : null;
          }));
        },
        template(user) {
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
          const currentBoard = Boards.findOne(Session.get('currentBoard'));
          callback($.map(currentBoard.labels, (label) => {
            if (label.name.indexOf(term) > -1 ||
                label.color.indexOf(term) > -1) {
              return label;
            }
            return null;
          }));
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
    ], {
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
    });
  },
}).register('addCardForm');

BlazeComponent.extendComponent({
  onCreated() {
    // Prefetch first non-current board id
    const boardId = Boards.findOne({
      archived: false,
      'members.userId': Meteor.userId(),
      _id: {$ne: Session.get('currentBoard')},
    }, {
      sort: ['title'],
    })._id;
    // Subscribe to this board
    subManager.subscribe('board', boardId);
    this.selectedBoardId = new ReactiveVar(boardId);
    this.selectedSwimlaneId = new ReactiveVar('');
    this.selectedListId = new ReactiveVar('');

    this.boardId = Session.get('currentBoard');
    // In order to get current board info
    subManager.subscribe('board', this.boardId);
    this.board = Boards.findOne(this.boardId);
    // List where to insert card
    const list = $(Popup._getTopStack().openerElement).closest('.js-list');
    this.listId = Blaze.getData(list[0])._id;
    // Swimlane where to insert card
    const swimlane = $(Popup._getTopStack().openerElement).closest('.js-swimlane');
    this.swimlaneId = '';
    const boardView = Meteor.user().profile.boardView;
    if (boardView === 'board-view-swimlanes')
      this.swimlaneId = Blaze.getData(swimlane[0])._id;
    else if (boardView === 'board-view-lists')
      this.swimlaneId = Swimlanes.findOne({boardId: this.boardId})._id;
  },

  boards() {
    const boards = Boards.find({
      archived: false,
      'members.userId': Meteor.userId(),
      _id: {$ne: Session.get('currentBoard')},
    }, {
      sort: ['title'],
    });
    return boards;
  },

  swimlanes() {
    if (!this.selectedBoardId) {
      return [];
    }
    const swimlanes = Swimlanes.find({boardId: this.selectedBoardId.get()});
    if (swimlanes.count())
      this.selectedSwimlaneId.set(swimlanes.fetch()[0]._id);
    return swimlanes;
  },

  lists() {
    if (!this.selectedBoardId) {
      return [];
    }
    const lists = Lists.find({boardId: this.selectedBoardId.get()});
    if (lists.count())
      this.selectedListId.set(lists.fetch()[0]._id);
    return lists;
  },

  cards() {
    if (!this.board) {
      return [];
    }
    const ownCardsIds = this.board.cards().map((card) => { return card.linkedId || card._id; });
    return Cards.find({
      boardId: this.selectedBoardId.get(),
      swimlaneId: this.selectedSwimlaneId.get(),
      listId: this.selectedListId.get(),
      archived: false,
      linkedId: {$nin: ownCardsIds},
      _id: {$nin: ownCardsIds},
    });
  },

  events() {
    return [{
      'change .js-select-boards'(evt) {
        subManager.subscribe('board', $(evt.currentTarget).val());
        this.selectedBoardId.set($(evt.currentTarget).val());
      },
      'change .js-select-swimlanes'(evt) {
        this.selectedSwimlaneId.set($(evt.currentTarget).val());
      },
      'change .js-select-lists'(evt) {
        this.selectedListId.set($(evt.currentTarget).val());
      },
      'click .js-done' (evt) {
        // LINK CARD
        evt.stopPropagation();
        evt.preventDefault();
        const linkedId = $('.js-select-cards option:selected').val();
        if (!linkedId) {
          Popup.close();
          return;
        }
        const _id = Cards.insert({
          title: $('.js-select-cards option:selected').text(), //dummy
          listId: this.listId,
          swimlaneId: this.swimlaneId,
          boardId: this.boardId,
          sort: Lists.findOne(this.listId).cards().count(),
          type: 'cardType-linkedCard',
          linkedId,
        });
        Filter.addException(_id);
        Popup.close();
      },
      'click .js-link-board' (evt) {
        //LINK BOARD
        evt.stopPropagation();
        evt.preventDefault();
        const impBoardId = $('.js-select-boards option:selected').val();
        if (!impBoardId || Cards.findOne({linkedId: impBoardId, archived: false})) {
          Popup.close();
          return;
        }
        const _id = Cards.insert({
          title: $('.js-select-boards option:selected').text(), //dummy
          listId: this.listId,
          swimlaneId: this.swimlaneId,
          boardId: this.boardId,
          sort: Lists.findOne(this.listId).cards().count(),
          type: 'cardType-linkedBoard',
          linkedId: impBoardId,
        });
        Filter.addException(_id);
        Popup.close();
      },
    }];
  },
}).register('linkCardPopup');

BlazeComponent.extendComponent({
  mixins() {
    return [Mixins.PerfectScrollbar];
  },

  onCreated() {
    // Prefetch first non-current board id
    let board = Boards.findOne({
      archived: false,
      'members.userId': Meteor.userId(),
      _id: {$ne: Session.get('currentBoard')},
    });
    if (!board) {
      Popup.close();
      return;
    }
    const boardId = board._id;
    // Subscribe to this board
    subManager.subscribe('board', boardId);
    this.selectedBoardId = new ReactiveVar(boardId);

    this.boardId = Session.get('currentBoard');
    // In order to get current board info
    subManager.subscribe('board', this.boardId);
    board = Boards.findOne(this.boardId);
    // List where to insert card
    const list = $(Popup._getTopStack().openerElement).closest('.js-list');
    this.listId = Blaze.getData(list[0])._id;
    // Swimlane where to insert card
    const swimlane = $(Popup._getTopStack().openerElement).closest('.js-swimlane');
    this.swimlaneId = '';
    if (board.view === 'board-view-swimlanes')
      this.swimlaneId = Blaze.getData(swimlane[0])._id;
    else
      this.swimlaneId = Swimlanes.findOne({boardId: this.boardId})._id;
    this.term = new ReactiveVar('');
  },

  boards() {
    const boards = Boards.find({
      archived: false,
      'members.userId': Meteor.userId(),
      _id: {$ne: Session.get('currentBoard')},
    }, {
      sort: ['title'],
    });
    return boards;
  },

  results() {
    if (!this.selectedBoardId) {
      return [];
    }
    const board = Boards.findOne(this.selectedBoardId.get());
    return board.searchCards(this.term.get(), false);
  },

  events() {
    return [{
      'change .js-select-boards'(evt) {
        subManager.subscribe('board', $(evt.currentTarget).val());
        this.selectedBoardId.set($(evt.currentTarget).val());
      },
      'submit .js-search-term-form'(evt) {
        evt.preventDefault();
        this.term.set(evt.target.searchTerm.value);
      },
      'click .js-minicard'(evt) {
        // LINK CARD
        const card = Blaze.getData(evt.currentTarget);
        const _id = Cards.insert({
          title: card.title, //dummy
          listId: this.listId,
          swimlaneId: this.swimlaneId,
          boardId: this.boardId,
          sort: Lists.findOne(this.listId).cards().count(),
          type: 'cardType-linkedCard',
          linkedId: card.linkedId || card._id,
        });
        Filter.addException(_id);
        Popup.close();
      },
    }];
  },
}).register('searchCardPopup');
