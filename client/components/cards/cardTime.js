import { TAPi18n } from '/imports/i18n';
import Cards from '/models/cards';
import { getCurrentCardIdFromContext } from '/client/lib/currentCard';

function getCardId() {
  return getCurrentCardIdFromContext();
}

Template.editCardSpentTimePopup.onCreated(function () {
  this.error = new ReactiveVar('');
  this.card = Cards.findOne(getCardId());
});

Template.editCardSpentTimePopup.helpers({
  error() {
    return Template.instance().error;
  },
  card() {
    return Cards.findOne(getCardId());
  },
  getIsOvertime() {
    const card = Cards.findOne(getCardId());
    return card?.getIsOvertime ? card.getIsOvertime() : false;
  },
});

Template.editCardSpentTimePopup.events({
  //TODO : need checking this portion
  'submit .edit-time'(evt, tpl) {
    evt.preventDefault();
    const card = Cards.findOne(getCardId());
    if (!card) return;

    const spentTime = parseFloat(evt.target.time.value);
    let isOvertime = false;
    if ($('#overtime').attr('class').indexOf('is-checked') >= 0) {
      isOvertime = true;
    }
    if (spentTime >= 0) {
      card.setSpentTime(spentTime);
      card.setIsOvertime(isOvertime);
      Popup.back();
    } else {
      tpl.error.set('invalid-time');
      evt.target.time.focus();
    }
  },
  'click .js-delete-time'(evt) {
    evt.preventDefault();
    const card = Cards.findOne(getCardId());
    if (!card) return;
    card.setSpentTime(null);
    card.setIsOvertime(false);
    Popup.back();
  },
  'click a.js-toggle-overtime'(evt) {
    const card = Cards.findOne(getCardId());
    if (!card) return;
    card.setIsOvertime(!card.getIsOvertime());
    $('#overtime .materialCheckBox').toggleClass('is-checked');
    $('#overtime').toggleClass('is-checked');
  },
});

Template.cardSpentTime.helpers({
  showTitle() {
    const card = Cards.findOne(this._id) || this;
    if (card.getIsOvertime && card.getIsOvertime()) {
      return `${TAPi18n.__(
        'overtime',
      )} ${card.getSpentTime()} ${TAPi18n.__('hours')}`;
    } else if (card.getSpentTime) {
      return `${TAPi18n.__(
        'card-spent',
      )} ${card.getSpentTime()} ${TAPi18n.__('hours')}`;
    }
    return '';
  },
  showTime() {
    const card = Cards.findOne(this._id) || this;
    return card.getSpentTime ? card.getSpentTime() : '';
  },
  getIsOvertime() {
    const card = Cards.findOne(this._id) || this;
    return card.getIsOvertime ? card.getIsOvertime() : false;
  },
});

Template.cardSpentTime.events({
  'click .js-edit-time': Popup.open('editCardSpentTime'),
});
