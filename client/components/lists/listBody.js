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

  addCard(evt) {
    evt.preventDefault();
    const firstCardDom = this.find('.js-minicard:first');
    const lastCardDom = this.find('.js-minicard:last');
    const textarea = $(evt.currentTarget).find('textarea');
    const position = this.currentData().position;
    let title = textarea.val().trim();
    let sortIndex;
    if (position === 'top') {
      sortIndex = Utils.calculateIndex(null, firstCardDom).base;
    } else if (position === 'bottom') {
      sortIndex = Utils.calculateIndex(lastCardDom, null).base;
    }

    // Parse for @user and #label mentions, stripping them from the title
    // and applying the appropriate users and labels to the card instead.
    const currentBoard = Boards.findOne(Session.get('currentBoard'));

    // Find all @-mentioned usernames, collect a list of their IDs and strip
    // their mention out of the title.
    let foundUserIds = []; // eslint-disable-line prefer-const
    currentBoard.members.forEach((member) => {
      const username = Users.findOne(member.userId).username;
      if (title.indexOf(`@${username}`) !== -1) {
        foundUserIds.push(member.userId);
        title = title.replace(`@${username}`, '');
      }
    });

    // Find all #-mentioned labels (based on their colour or name), collect a
    // list of their IDs, and strip their mention out of the title.
    let foundLabelIds = []; // eslint-disable-line prefer-const
    currentBoard.labels.forEach((label) => {
      const labelName = (!label.name || label.name === '')
                      ? label.color : label.name;
      if (title.indexOf(`#${labelName}`) !== -1) {
        foundLabelIds.push(label._id);
        title = title.replace(`#${labelName}`, '');
      }
    });

    if (title) {
      const _id = Cards.insert({
        title,
        listId: this.data()._id,
        boardId: this.data().board()._id,
        labelIds: foundLabelIds,
        members: foundUserIds,
        sort: sortIndex,
      });
      // In case the filter is active we need to add the newly inserted card in
      // the list of exceptions -- cards that are not filtered. Otherwise the
      // card will disappear instantly.
      // See https://github.com/wekan/wekan/issues/80
      Filter.addException(_id);

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

let dropdownMenuIsOpened = false;
BlazeComponent.extendComponent({
  template() {
    return 'addCardForm';
  },

  pressKey(evt) {
    // Don't do anything if the drop down is showing
    if (dropdownMenuIsOpened) {
      return;
    }

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

  onCreated() {
    dropdownMenuIsOpened = false;
  },

  onRendered() {
    const $textarea = this.$('textarea');
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    $textarea.textcomplete([
      // User mentions
      {
        match: /\B@(\w*)$/,
        search(term, callback) {
          callback($.map(currentBoard.members, (member) => {
            const username = Users.findOne(member.userId).username;
            return username.indexOf(term) === 0 ? username : null;
          }));
        },
        template(value) {
          return value;
        },
        replace(username) {
          return `@${username} `;
        },
        index: 1,
      },

      // Labels
      {
        match: /\B#(\w*)$/,
        search(term, callback) {
          callback($.map(currentBoard.labels, (label) => {
            const labelName = (!label.name || label.name === '')
                              ? label.color
                              : label.name;
            return labelName.indexOf(term) === 0 ? labelName : null;
          }));
        },
        template(value) {
          // XXX the following is duplicated from editor.js and should be
          // abstracted to keep things DRY
          // add a "colour badge" in front of the label name
          // but first, get the colour's name from its value
          const colorName = currentBoard.labels.find((label) => {
            return value === label.name || value === label.color;
          }).color;
          const valueSpan = (colorName === value)
                            ? `<span class="quiet">${value}</span>`
                            : value;
          return (colorName && colorName !== '')
                 ? `<div class="minicard-label card-label-${colorName}"
                    title="${value}"></div> ${valueSpan}`
                 : value;
        },
        replace(label) {
          return `#${label} `;
        },
        index: 1,
      },
    ]);

    // customize hooks for dealing with the dropdowns
    $textarea.on({
      'textComplete:show'() {
        dropdownMenuIsOpened = true;
      },
      'textComplete:hide'() {
        Tracker.afterFlush(() => {
          dropdownMenuIsOpened = false;
        });
      },
    });

    EscapeActions.register('textcomplete',
      () => {},
      () => dropdownMenuIsOpened
    );
  },
}).register('addCardForm');
