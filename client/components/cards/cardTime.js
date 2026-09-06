import { TAPi18n } from '/imports/i18n';
import { Meteor } from 'meteor/meteor';
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
  async 'submit .edit-time'(evt, tpl) {
    evt.preventDefault();
    const card = Cards.findOne(getCardId());
    if (!card) return;

    const spentTime = evt.target.time.value;
    let isOvertime = false;
    if ($('#overtime').attr('class').indexOf('is-checked') >= 0) {
      isOvertime = true;
    }
    if (spentTime !== '' && Number.isFinite(Number(spentTime)) && Number(spentTime) >= 0) {
      await Meteor.callAsync('updateAccessibleCardMetric', {
        cardId: card._id, boardId: card.boardId, action: 'spent-time',
        value: spentTime, isOvertime,
      });
      Popup.back();
    } else {
      tpl.error.set('invalid-time');
      evt.target.time.focus();
    }
  },
  async 'click .js-delete-time'(evt) {
    evt.preventDefault();
    const card = Cards.findOne(getCardId());
    if (!card) return;
    await Meteor.callAsync('updateAccessibleCardMetric', {
      cardId: card._id, boardId: card.boardId, action: 'spent-time',
      value: '', isOvertime: false,
    });
    Popup.back();
  },
  'click a.js-toggle-overtime'(evt) {
    evt.preventDefault();
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
