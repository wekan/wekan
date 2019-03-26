const subManager = new SubsManager();
const InfiniteScrollIter = 10;

BlazeComponent.extendComponent({
  onCreated() {
    // for infinite scrolling
    this.cardlimit = new ReactiveVar(InfiniteScrollIter);
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

    const board = this.data().board();
    let linkedId = '';
    let swimlaneId = '';
    const boardView = Meteor.user().profile.boardView;
    let cardType = 'cardType-card';
    if (title) {
      if (board.isTemplatesBoard()) {
        swimlaneId = this.parentComponent().parentComponent().data()._id; // Always swimlanes view
        const swimlane = Swimlanes.findOne(swimlaneId);
        // If this is the card templates swimlane, insert a card template
        if (swimlane.isCardTemplatesSwimlane())
          cardType = 'template-card';
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
      } else if (boardView === 'board-view-swimlanes')
        swimlaneId = this.parentComponent().parentComponent().data()._id;
      else if ((boardView === 'board-view-lists') || (boardView === 'board-view-cal'))
        swimlaneId = board.getDefaultSwimline()._id;

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
        linkedId,
      });

      // if the displayed card count is less than the total cards in the list,
      // we need to increment the displayed card count to prevent the spinner
      // to appear
      const cardCount = this.data().cards(this.idOrNull(swimlaneId)).count();
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
    if (currentUser.profile.boardView === 'board-view-swimlanes' ||
        this.data().board().isTemplatesBoard())
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

  showSpinner(swimlaneId) {
    const list = Template.currentData();
    return list.cards(swimlaneId).count() > this.cardlimit.get();
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
        position:this.data().position,
      });
    }
  },

  events() {
    return [{
      keydown: this.pressKey,
      'click .js-link': Popup.open('linkCard'),
      'click .js-search': Popup.open('searchElement'),
      'click .js-card-template': Popup.open('searchElement'),
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
    this.selectedBoardId = new ReactiveVar('');
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
      type: 'board',
    }, {
      sort: ['title'],
    });
    return boards;
  },

  swimlanes() {
    if (!this.selectedBoardId.get()) {
      return [];
    }
    const swimlanes = Swimlanes.find({boardId: this.selectedBoardId.get()});
    if (swimlanes.count())
      this.selectedSwimlaneId.set(swimlanes.fetch()[0]._id);
    return swimlanes;
  },

  lists() {
    if (!this.selectedBoardId.get()) {
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
      type: {$nin: ['template-card']},
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
    this.isCardTemplateSearch = $(Popup._getTopStack().openerElement).hasClass('js-card-template');
    this.isListTemplateSearch = $(Popup._getTopStack().openerElement).hasClass('js-list-template');
    this.isSwimlaneTemplateSearch = $(Popup._getTopStack().openerElement).hasClass('js-open-add-swimlane-menu');
    this.isBoardTemplateSearch = $(Popup._getTopStack().openerElement).hasClass('js-add-board');
    this.isTemplateSearch = this.isCardTemplateSearch ||
      this.isListTemplateSearch ||
      this.isSwimlaneTemplateSearch ||
      this.isBoardTemplateSearch;
    let board = {};
    if (this.isTemplateSearch) {
      board = Boards.findOne(Meteor.user().profile.templatesBoardId);
    } else {
      // Prefetch first non-current board id
      board = Boards.findOne({
        archived: false,
        'members.userId': Meteor.userId(),
        _id: {$nin: [Session.get('currentBoard'), Meteor.user().profile.templatesBoardId]},
      });
    }
    if (!board) {
      Popup.close();
      return;
    }
    const boardId = board._id;
    // Subscribe to this board
    subManager.subscribe('board', boardId);
    this.selectedBoardId = new ReactiveVar(boardId);

    if (!this.isBoardTemplateSearch) {
      this.boardId = Session.get('currentBoard');
      // In order to get current board info
      subManager.subscribe('board', this.boardId);
      this.swimlaneId = '';
      // Swimlane where to insert card
      const swimlane = $(Popup._getTopStack().openerElement).parents('.js-swimlane');
      if (Meteor.user().profile.boardView === 'board-view-swimlanes')
        this.swimlaneId = Blaze.getData(swimlane[0])._id;
      else
        this.swimlaneId = Swimlanes.findOne({boardId: this.boardId})._id;
      // List where to insert card
      const list = $(Popup._getTopStack().openerElement).closest('.js-list');
      this.listId = Blaze.getData(list[0])._id;
    }
    this.term = new ReactiveVar('');
  },

  boards() {
    const boards = Boards.find({
      archived: false,
      'members.userId': Meteor.userId(),
      _id: {$ne: Session.get('currentBoard')},
      type: 'board',
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
    if (!this.isTemplateSearch || this.isCardTemplateSearch) {
      return board.searchCards(this.term.get(), false);
    } else if (this.isListTemplateSearch) {
      return board.searchLists(this.term.get());
    } else if (this.isSwimlaneTemplateSearch) {
      return board.searchSwimlanes(this.term.get());
    } else if (this.isBoardTemplateSearch) {
      const boards = board.searchBoards(this.term.get());
      boards.forEach((board) => {
        subManager.subscribe('board', board.linkedId);
      });
      return boards;
    } else {
      return [];
    }
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
        // 0. Common
        const title = $('.js-element-title').val().trim();
        if (!title)
          return;
        const element = Blaze.getData(evt.currentTarget);
        element.title = title;
        let _id = '';
        if (!this.isTemplateSearch || this.isCardTemplateSearch) {
          // Card insertion
          // 1. Common
          element.sort = Lists.findOne(this.listId).cards().count();
          // 1.A From template
          if (this.isTemplateSearch) {
            element.type = 'cardType-card';
            element.linkedId = '';
            _id = element.copy(this.boardId, this.swimlaneId, this.listId);
            // 1.B Linked card
          } else {
            delete element._id;
            element.type = 'cardType-linkedCard';
            element.linkedId = element.linkedId || element._id;
            _id = Cards.insert(element);
          }
          Filter.addException(_id);
          // List insertion
        } else if (this.isListTemplateSearch) {
          element.sort = Swimlanes.findOne(this.swimlaneId).lists().count();
          element.type = 'list';
          _id = element.copy(this.boardId, this.swimlaneId);
        } else if (this.isSwimlaneTemplateSearch) {
          element.sort = Boards.findOne(this.boardId).swimlanes().count();
          element.type = 'swimlalne';
          _id = element.copy(this.boardId);
        } else if (this.isBoardTemplateSearch) {
          board = Boards.findOne(element.linkedId);
          board.sort = Boards.find({archived: false}).count();
          board.type = 'board';
          board.title = element.title;
          delete board.slug;
          _id = board.copy();
        }
        Popup.close();
      },
    }];
  },
}).register('searchElementPopup');

BlazeComponent.extendComponent({
  onCreated() {
    this.spinnerShown = false;
    this.cardlimit = this.parentComponent().cardlimit;
  },

  onRendered() {
    const spinner = this.find('.sk-spinner-list');

    if (spinner) {
      const options = {
        root: null, // we check if the spinner is on the current viewport
        rootMargin: '0px',
        threshold: 0.25,
      };

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          this.spinnerShown = entry.isIntersecting;
          this.updateList();
        });
      }, options);

      this.observer.observe(spinner);
    }
  },

  onDestroyed() {
    this.observer.disconnect();
  },

  updateList() {
    if (this.spinnerShown) {
      this.cardlimit.set(this.cardlimit.get() + InfiniteScrollIter);
      window.requestIdleCallback(() => this.updateList());
    }
  },

}).register('spinnerList');
