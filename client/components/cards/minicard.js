import { TAPi18n } from '/imports/i18n';

// Template.cards.events({
//   'click .member': Popup.open('cardMember')
// });

BlazeComponent.extendComponent({
  template() {
    return 'minicard';
  },

  formattedCurrencyCustomFieldValue(definition) {
    const customField = this.data()
      .customFieldsWD()
      .find(f => f._id === definition._id);
    const customFieldTrueValue =
      customField && customField.trueValue ? customField.trueValue : '';

    const locale = TAPi18n.getLanguage();
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: definition.settings.currencyCode,
    }).format(customFieldTrueValue);
  },

  formattedStringtemplateCustomFieldValue(definition) {
    const customField = this.data()
      .customFieldsWD()
      .find(f => f._id === definition._id);

    const customFieldTrueValue =
      customField && customField.trueValue ? customField.trueValue : [];

    return customFieldTrueValue
      .filter(value => !!value.trim())
      .map(value =>
        definition.settings.stringtemplateFormat.replace(/%\{value\}/gi, value),
      )
      .join(definition.settings.stringtemplateSeparator ?? '');
  },

  showCreator() {
    if (this.data().board()) {
      return (
        this.data().board.allowsCreator === null ||
        this.data().board().allowsCreator === undefined ||
        this.data().board().allowsCreator
      );
      // return this.data().board().allowsCreator;
    }
    return false;
  },

  showMembers() {
    if (this.data().board()) {
      return (
        this.data().board.allowsMembers === null ||
        this.data().board().allowsMembers === undefined ||
        this.data().board().allowsMembers
      );
    }
    return false;
  },

  showAssignee() {
    if (this.data().board()) {
      return (
        this.data().board.allowsAssignee === null ||
        this.data().board().allowsAssignee === undefined ||
        this.data().board().allowsAssignee
      );
    }
    return false;
  },

  /** opens the card label popup only if clicked onto a label
   * <li> this is necessary to have the data context of the minicard.
   *      if .js-card-label is used at click event, then only the data context of the label itself is available at this.currentData()
   */
  cardLabelsPopup(event) {
    if (this.find('.js-card-label:hover')) {
      Popup.open("cardLabels")(event, {dataContextIfCurrentDataIsUndefined: this.currentData()});
    }
  },

  events() {
    return [
      {
        'click .js-linked-link'() {
          if (this.data().isLinkedCard()) Utils.goCardId(this.data().linkedId);
          else if (this.data().isLinkedBoard())
            Utils.goBoardId(this.data().linkedId);
        },
        'click .js-toggle-minicard-label-text'() {
          if (window.localStorage.getItem('hiddenMinicardLabelText')) {
            window.localStorage.removeItem('hiddenMinicardLabelText'); //true
          } else {
            window.localStorage.setItem('hiddenMinicardLabelText', 'true'); //true
          }
        },
        'click span.badge-icon.fa.fa-sort, click span.badge-text.check-list-sort' : Popup.open("editCardSortOrder"),
        'click .minicard-labels' : this.cardLabelsPopup,
      }
    ];
  },
}).register('minicard');

Template.minicard.helpers({
  hiddenMinicardLabelText() {
    currentUser = Meteor.user();
    if (currentUser) {
      return (currentUser.profile || {}).hiddenMinicardLabelText;
    } else if (window.localStorage.getItem('hiddenMinicardLabelText')) {
      return true;
    } else {
      return false;
    }
  },
  // XXX resolve this nasty hack for https://github.com/veliovgroup/Meteor-Files/issues/763
  sess() {
    return Meteor.connection && Meteor.connection._lastSessionId
      ? Meteor.connection._lastSessionId
      : null;
  },
});

BlazeComponent.extendComponent({
  events() {
    return [
      {
        'keydown input.js-edit-card-sort-popup'(evt) {
          // enter = save
          if (evt.keyCode === 13) {
            this.find('button[type=submit]').click();
          }
        },
        'click button.js-submit-edit-card-sort-popup'(event) {
          // save button pressed
          event.preventDefault();
          const sort = this.$('.js-edit-card-sort-popup')[0]
            .value
            .trim();
          if (!Number.isNaN(sort)) {
            let card = this.data();
            card.move(card.boardId, card.swimlaneId, card.listId, sort);
            Popup.back();
          }
        },
      }
    ]
  }
}).register('editCardSortOrderPopup');
