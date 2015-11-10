BlazeComponent.extendComponent({
  template() {
    return 'listBody';
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

  // we can also copy & paste excel data for batch task
  // header: (specify the index of fields)
  // title description dueDate member member member label label label
  // accepted header alias:
  // desc -> description
  // owner -> member
  // type, category, priority -> label
  addMultiCards(list, board, text, sortIndex) {
    const listId = list._id;
    const boardId = board._id;
    const allLabels = board.labels;

    // csv/tsv members are username instead of userid, so we need get the mapping
    const mapUsername2UserId = {};
    board.memberUsers().forEach((user) => {
      mapUsername2UserId[ user.username ] = user._id;
    });

    let rows = [];
    // if the text contains '\t', it's treated as TSV format
    if (text.indexOf('\t') > 0) {
      text.split('\n').forEach((line) => {
        if(line.length > 0)
          rows.push(line.split('\t'));
      });
    } else {
      // we use Papa.Parse to parse CSV to data rows
      if (!window.Papa) return;
      const ret = window.Papa.parse(text);
      if (ret && ret.data && ret.data.length) rows = ret.data;
    }

    // the columns can be in arbitrary order, but need header to find index
    let titleIndex = -1;
    let descIndex = -1;
    const memberIndex = [];
    const labelIndex = [];
    let manHourIndex = -1;
    let dueDateIndex = -1;
    let createAtIndex = -1;
    let updateAtIndex = -1;
    let startDateIndex = -1;
    let finishDateIndex = -1;

    const headers = rows[0];
    for (let i=0; i<headers.length; i++) {
      switch (headers[i].trim().toLowerCase()) {
      case 'title':
        titleIndex = i;
        break;
      case 'description':
      case 'desc':
        descIndex = i;
        break;
      case 'member':
      case 'owner':
        memberIndex.push(i);
        break;
      case 'label':
      case 'type':
      case 'category':
      case 'priority':
        labelIndex.push(i);
        break;
      case 'manhour':
        manHourIndex = i;
        break;
      case 'duedate':
      case 'deadline':
        dueDateIndex = i;
        break;
      case 'createat':
        createAtIndex = i;
        break;
      case 'updateat':
        updateAtIndex = i;
        break;
      case 'startdate':
        startDateIndex = i;
        break;
      case 'finishdate':
        finishDateIndex = i;
        break;
      }
    }

    let j = 0;
    if (titleIndex >= 0) {
      j++;
    } else {
      titleIndex = 0;
      descIndex = 1;
    }
    while (j < rows.length) {
      const items = rows[j++];
      const card = {
        title: '',
        listId,
        boardId,
        sort: sortIndex++,
        members: [],
        labelIds: [],
      };

      for (let i=0; i<items.length; i++) {
        const item = items[i].trim();
        if (!item) continue;
        if (i === titleIndex) card.title = item;
        else if (i === descIndex) card.description = item;
        else if (_.contains(memberIndex, i)) {
          // check the member id
          const userId = mapUsername2UserId[item];
          if (userId && (!_.contains(card.members, userId))) card.members.push(userId);
        } else if (_.contains(labelIndex, i)) {
          // convert label name to id
          const label = _.findWhere(allLabels, {name: item});
          if(label) card.labelIds.push(label._id);
        } else if (i === manHourIndex) {
          const n = parseInt(item, 10);
          if(n > 0) card.manHour = n;
        } else if (i === dueDateIndex) {
          const d = new Date(`${item} 12:00:00`);
          if(!isNaN(d.getTime())) card.dueDate = d;
        } else if (i === createAtIndex) {
          const d = new Date(`${item} 12:00:00`);
          if(!isNaN(d.getTime())) card.createAt = d;
        } else if (i === updateAtIndex) {
          const d = new Date(`${item} 12:00:00`);
          if(!isNaN(d.getTime())) card.updateAt = d;
        } else if (i === startDateIndex) {
          const d = new Date(`${item} 12:00:00`);
          if(!isNaN(d.getTime())) card.startDate = d;
        } else if (i === finishDateIndex) {
          const d = new Date(`${item} 12:00:00`);
          if(!isNaN(d.getTime())) card.finishDate = d;
        }
      }

      if (card.title) {
        const _id = Cards.insert(card);
        // In case the filter is active we need to add the newly inserted card in
        // the list of exceptions -- cards that are not filtered. Otherwise the
        // card will disappear instantly.
        // See https://github.com/wekan/wekan/issues/80
        Filter.addException(_id);
      }
    }
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

    if (title) {
      const list = this.data();
      const board = list.board();
      if(title.indexOf('\n') > 0) {
        this.addMultiCards(list, board, title, sortIndex);
      } else {
        const members = formComponent.members.get();
        const labelIds = formComponent.labels.get();
        const _id = Cards.insert({
          title,
          members,
          labelIds,
          listId: list._id,
          boardId: board._id,
          sort: sortIndex,
        });
        // In case the filter is active we need to add the newly inserted card in
        // the list of exceptions -- cards that are not filtered. Otherwise the
        // card will disappear instantly.
        // See https://github.com/wekan/wekan/issues/80
        Filter.addException(_id);
      }

      // We keep the form opened, empty it, and scroll to it.
      textarea.val('').focus();
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
  template() {
    return 'addCardForm';
  },

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
    }];
  },

  onRendered() {
    const editor = this;
    this.$('textarea').escapeableTextComplete([
      // User mentions
      {
        match: /\B@(\w*)$/,
        search(term, callback) {
          const currentBoard = Boards.findOne(Session.get('currentBoard'));
          callback($.map(currentBoard.members, (member) => {
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
          }));
        },
        template(label) {
          return Blaze.toHTMLWithData(Template.autocompleteLabelLine, {
            hasNoName: !Boolean(label.name),
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
      },
    });
  },
}).register('addCardForm');
