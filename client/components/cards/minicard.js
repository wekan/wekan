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

  events() {
    return [
      {
        'click .js-linked-link'() {
          if (this.data().isLinkedCard()) Utils.goCardId(this.data().linkedId);
          else if (this.data().isLinkedBoard())
            Utils.goBoardId(this.data().linkedId);
        },
      },
      {
        'click .js-toggle-minicard-label-text'() {
          if (window.localStorage.getItem('hiddenMinicardLabelText')) {
            window.localStorage.removeItem('hiddenMinicardLabelText'); //true
          } else {
            window.localStorage.setItem('hiddenMinicardLabelText', 'true'); //true
          }
        },
      },
    ];
  },
}).register('minicard');

Template.minicard.helpers({
  showDesktopDragHandles() {
    currentUser = Meteor.user();
    if (currentUser) {
      return (currentUser.profile || {}).showDesktopDragHandles;
    } else if (window.localStorage.getItem('showDesktopDragHandles')) {
      return true;
    } else {
      return false;
    }
  },
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
});
