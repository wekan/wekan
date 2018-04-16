const subManager = new SubsManager();

BlazeComponent.extendComponent({
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

    const boardId = this.data().board()._id;
    let swimlaneId = '';
    const boardView = Meteor.user().profile.boardView;
    if (boardView === 'board-view-swimlanes')
      swimlaneId = this.parentComponent().parentComponent().data()._id;
    else if (boardView === 'board-view-lists')
      swimlaneId = Swimlanes.findOne({boardId})._id;

    if (title) {
      const _id = Cards.insert({
        title,
        members,
        labelIds,
        listId: this.data()._id,
        boardId: this.data().board()._id,
        sort: sortIndex,
        swimlaneId,
        type: 'cardType-card',
      });
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
  },

  reset() {
    this.labels.set([]);
    this.members.set([]);
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
      'click .js-import': Popup.open('importCard'),
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
    const board = Boards.findOne(this.boardId);
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
    const swimlanes = Swimlanes.find({boardId: this.selectedBoardId.get()});
    if (swimlanes.count())
      this.selectedSwimlaneId.set(swimlanes.fetch()[0]._id);
    return swimlanes;
  },

  lists() {
    const lists = Lists.find({boardId: this.selectedBoardId.get()});
    if (lists.count())
      this.selectedListId.set(lists.fetch()[0]._id);
    return lists;
  },

  cards() {
    return Cards.find({
      boardId: this.selectedBoardId.get(),
      swimlaneId: this.selectedSwimlaneId.get(),
      listId: this.selectedListId.get(),
      archived: false,
      importedId: null,
    });
  },

  events() {
    return [{
      'change .js-select-boards'(evt) {
        this.selectedBoardId.set($(evt.currentTarget).val());
        subManager.subscribe('board', this.selectedBoardId.get());
      },
      'change .js-select-swimlanes'(evt) {
        this.selectedSwimlaneId.set($(evt.currentTarget).val());
      },
      'change .js-select-lists'(evt) {
        this.selectedListId.set($(evt.currentTarget).val());
      },
      'click .js-done' (evt) {
        // IMPORT CARD
        evt.stopPropagation();
        evt.preventDefault();
        const _id = Cards.insert({
          title: $('.js-select-cards option:selected').text(), //dummy
          listId: this.listId,
          swimlaneId: this.swimlaneId,
          boardId: this.boardId,
          sort: Lists.findOne(this.listId).cards().count(),
          type: 'cardType-importedCard',
          importedId: $('.js-select-cards option:selected').val(),
        });
        Filter.addException(_id);
        Popup.close();
      },
      'click .js-import-board' (evt) {
        //IMPORT BOARD
        evt.stopPropagation();
        evt.preventDefault();
        const impBoardId = $('.js-select-boards option:selected').val();
        const _id = Cards.insert({
          title: $('.js-select-boards option:selected').text(), //dummy
          listId: this.listId,
          swimlaneId: this.swimlaneId,
          boardId: this.boardId,
          sort: Lists.findOne(this.listId).cards().count(),
          type: 'cardType-importedBoard',
          importedId: impBoardId,
          description: Boards.findOne({_id: impBoardId}).description,
        });
        Filter.addException(_id);
        Popup.close();
      },
    }];
  },
}).register('importCardPopup');

BlazeComponent.extendComponent({
  mixins() {
    return [Mixins.PerfectScrollbar];
  },

  onCreated() {
    // Prefetch first non-current board id
    const boardId = Boards.findOne({
      archived: false,
      'members.userId': Meteor.userId(),
      _id: {$ne: Session.get('currentBoard')},
    })._id;
    // Subscribe to this board
    subManager.subscribe('board', boardId);
    this.selectedBoardId = new ReactiveVar(boardId);

    this.boardId = Session.get('currentBoard');
    // In order to get current board info
    subManager.subscribe('board', this.boardId);
    const board = Boards.findOne(this.boardId);
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
    const board = Boards.findOne(this.selectedBoardId.get());
    return board.searchCards(this.term.get(), true);
  },

  events() {
    return [{
      'change .js-select-boards'(evt) {
        this.selectedBoardId.set($(evt.currentTarget).val());
        subManager.subscribe('board', this.selectedBoardId.get());
      },
      'submit .js-search-term-form'(evt) {
        evt.preventDefault();
        this.term.set(evt.target.searchTerm.value);
      },
      'click .js-minicard'(evt) {
        // IMPORT CARD
        const card = Blaze.getData(evt.currentTarget);
        const _id = Cards.insert({
          title: card.title, //dummy
          listId: this.listId,
          swimlaneId: this.swimlaneId,
          boardId: this.boardId,
          sort: Lists.findOne(this.listId).cards().count(),
          type: 'cardType-importedCard',
          importedId: card._id,
        });
        Filter.addException(_id);
        Popup.close();
      },
    }];
  },
}).register('searchCardPopup');
