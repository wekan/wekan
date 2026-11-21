import { TAPi18n } from '/imports/i18n';
import Cards from '/models/cards';
import { getCurrentCardIdFromContext } from '/client/lib/currentCard';
import { backIfOwnPopup } from '/client/lib/popupBack';
// #6890: the badge shows a duration, the tooltip hours to two decimals.
import { formatSpentTime, roundedSpentHours } from '/models/lib/spentTimeFormat';

function getCardId() {
  return getCurrentCardIdFromContext();
}

Template.editCardSpentTimePopup.onCreated(function () {
  this.error = new ReactiveVar('');
  this.card = Cards.findOne(getCardId());
  this.overtime = new ReactiveVar(this.card?.getIsOvertime() || false);
  this.billable = new ReactiveVar(!this.card || typeof this.card.isBillable !== 'function' || this.card.isBillable());
});

Template.editCardSpentTimePopup.helpers({
  error() {
    return Template.instance().error;
  },
  card() {
    return Cards.findOne(getCardId());
  },
  getIsOvertime() {
    return Template.instance().overtime.get();
  },
  billable() {
    return Template.instance().billable.get();
  },
});

Template.editCardSpentTimePopup.events({
  //TODO : need checking this portion
  'submit .edit-time'(evt, tpl) {
    evt.preventDefault();
    const card = Cards.findOne(getCardId());
    if (!card) return;

    const spentTime = parseFloat(evt.target.time.value);
    const isOvertime = tpl.overtime.get();
    const estimateText = evt.target.estimatedHours ? String(evt.target.estimatedHours.value).trim() : '';
    const estimatedHours = estimateText === '' ? null : parseFloat(estimateText);
    if (estimatedHours !== null && !(estimatedHours >= 0 && estimatedHours <= 10000)) {
      tpl.error.set('workload-invalid-estimate');
      evt.target.estimatedHours.focus();
      return;
    }
    if (spentTime >= 0) {
      card.setSpentTime(spentTime);
      card.setIsOvertime(isOvertime);
      const currentEstimate = typeof card.getEstimatedHours === 'function' ? card.getEstimatedHours() : null;
      if (typeof card.setBillable === 'function' && tpl.billable
        && tpl.billable.get() !== (typeof card.isBillable === 'function' ? card.isBillable() : true)) {
        card.setBillable(tpl.billable.get());
      }
      if (typeof card.setEstimatedHours === 'function'
        && estimatedHours !== (typeof currentEstimate === 'number' ? currentEstimate : null)) {
        card.setEstimatedHours(estimatedHours);
      }
      backIfOwnPopup(evt, 'editCardSpentTimePopup');
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
    backIfOwnPopup(evt, 'editCardSpentTimePopup');
  },
  'click a.js-toggle-overtime'(evt, tpl) {
    evt.preventDefault();
    tpl.overtime.set(!tpl.overtime.get());
  },
  'click a.js-toggle-billable'(evt, tpl) {
    evt.preventDefault();
    tpl.billable.set(!tpl.billable.get());
  },
});

Template.cardSpentTime.helpers({
  showTitle() {
    const card = Cards.findOne(this._id) || this;
    if (card.getIsOvertime && card.getIsOvertime()) {
      return `${TAPi18n.__(
        'overtime',
      )} ${roundedSpentHours(card.getSpentTime())} ${TAPi18n.__('hours')}`;
    } else if (card.getSpentTime) {
      return `${TAPi18n.__(
        'card-spent',
      )} ${roundedSpentHours(card.getSpentTime())} ${TAPi18n.__('hours')}`;
    }
    return '';
  },
  showTime() {
    const card = Cards.findOne(this._id) || this;
    return card.getSpentTime ? formatSpentTime(card.getSpentTime()) : '';
  },
  // Workload: the estimate beside the time spent, "1h 30m / 4h".
  showEstimate() {
    const card = Cards.findOne(this._id) || this;
    const hours = card.getEstimatedHours ? card.getEstimatedHours() : null;
    return typeof hours === 'number' && hours > 0 ? formatSpentTime(hours) : '';
  },
  getIsOvertime() {
    const card = Cards.findOne(this._id) || this;
    return card.getIsOvertime ? card.getIsOvertime() : false;
  },
});

Template.cardSpentTime.events({
  'click .js-edit-time': Popup.open('editCardSpentTime'),
});

// The card's time by day (server/timeEntries.js).
Template.cardTimeEntries.onCreated(function () {
  this.entries = new ReactiveVar([]);
  this.error = new ReactiveVar('');
  this.load = () => {
    const { cardId } = Template.currentData() || {};
    if (!cardId) return Promise.resolve();
    return Meteor.callAsync('timeEntriesOfCard', cardId)
      .then(result => { this.entries.set(result.entries); this.error.set(''); })
      .catch(error => this.error.set((error && (error.reason || error.message)) || String(error)));
  };
  this.autorun(() => {
    const card = Cards.findOne((Template.currentData() || {}).cardId);
    // Reload when the card's total changes (a timer, the field above).
    if (card) card.spentTime; // eslint-disable-line no-unused-expressions
    this.load();
  });
});

Template.cardTimeEntries.helpers({
  entries: () => Template.instance().entries.get(),
  entryError: () => Template.instance().error.get(),
  today: () => new Date().toISOString().slice(0, 10),
});

Template.cardTimeEntries.events({
  'submit .js-time-entry-add'(evt, tpl) {
    evt.preventDefault();
    const form = evt.currentTarget;
    const entry = { date: form.elements.date.value, hours: parseFloat(form.elements.hours.value) };
    if (form.elements.note.value.trim()) entry.note = form.elements.note.value.trim();
    Meteor.callAsync('timeEntryAdd', Template.currentData().cardId, entry)
      .then(() => { form.elements.hours.value = ''; form.elements.note.value = ''; return tpl.load(); })
      .catch(error => tpl.error.set((error && (error.reason || error.message)) || String(error)));
  },
  'click .js-time-entry-remove'(evt, tpl) {
    evt.preventDefault();
    Meteor.callAsync('timeEntryRemove', evt.currentTarget.getAttribute('data-id'))
      .then(() => tpl.load())
      .catch(error => tpl.error.set((error && (error.reason || error.message)) || String(error)));
  },
});
