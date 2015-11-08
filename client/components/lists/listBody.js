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

    const forms = this.childrenComponents('inlinedForm');
    let form = forms.find((component) => {
      return component.data().position === options.position;
    });
    if (!form && forms.length > 0) {
      form = forms[0];
    }
    form.open();
  },

  addSingleCard(list, board, title, sort) {
    const listId = list._id;
    const boardId = board._id;
    const _id = Cards.insert({
      title,
      listId,
      boardId,
      sort,
    });
    // In case the filter is active we need to add the newly inserted card in
    // the list of exceptions -- cards that are not filtered. Otherwise the
    // card will disappear instantly.
    // See https://github.com/wekan/wekan/issues/80
    Filter.addException(_id);
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
    const allMembers = board.members;
    const lines = text.split('\n');

    // the columns can be in any order, but need header to find index
    let titleIndex = -1;
    let descIndex = -1;
    let dueDateIndex = -1;
    const memberIndex = [];
    const labelIndex = [];
    const headers = lines[0].split('\t');
    for(let i=0; i<headers.length; i++) {
      switch(headers[i].trim().toLowerCase()) {
      case 'title':
        titleIndex = i;
        break;
      case 'description':
      case 'desc':
        descIndex = i;
        break;
      case 'duedate':
      case 'deadline':
        dueDateIndex = i;
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
      }
    }

    let j = 0;
    if(titleIndex >= 0) {
      j++;
    } else {
      titleIndex = 0;
      descIndex = 1;
    }
    while(j < lines.length) {
      const line = lines[j++];
      const items = line.split('\t');
      let title = null;
      let description = null;
      let dueDate = null;
      const members = [];
      const labelIds = [];

      for(let i=0; i<items.length; i++) {
        const item = items[i].trim();
        if(!item) continue;
        if (i === titleIndex) title = item;
        else if (i === descIndex) description = item;
        else if(_.contains(memberIndex, i)) {
          // check the member id
          const member = _.findWhere(allMembers, {userId: item});
          if (member) members.push(item);
        } else if(_.contains(labelIndex, i)) {
          // convert label name to id
          const label = _.findWhere(allLabels, {name: item});
          if(label) labelIds.push(label._id);
        } else if (i === dueDateIndex) {
          const cobTime = ' 18:00:00';
          dueDate = new Date(item + cobTime);
          if(isNaN(dueDate.getTime())) dueDate = null;
        }
      }

      if (title) {
        const _id = Cards.insert({
          title,
          listId,
          boardId,
          sort: sortIndex++,
          description,
          dueDate,
          members,
          labelIds,
        });
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
    const title = textarea.val().trim();
    const position = this.currentData().position;
    let sortIndex;
    if (position === 'top') {
      sortIndex = Utils.calculateIndex(null, firstCardDom).base;
    } else if (position === 'bottom') {
      sortIndex = Utils.calculateIndex(lastCardDom, null).base;
    }

    if (title) {
      const list = this.data();
      const board = this.data().board();
      if(title.indexOf('\n') > 0) {
        this.addMultiCards(list, board, title, sortIndex);
      } else {
        this.addSingleCard(list, board, title, sortIndex);
      }

      // We keep the form opened, empty it, and scroll to it.
      textarea.val('').focus();
      if (position === 'bottom') {
        this.scrollToBottom();
      }
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

BlazeComponent.extendComponent({
  template() {
    return 'addCardForm';
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
}).register('addCardForm');
