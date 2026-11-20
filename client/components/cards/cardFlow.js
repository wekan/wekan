// The Kanban and Scrum flow fields of a card (models/lib/cardFlow.js,
// docs/Features/Cards/Flow-Fields.md): the opened card's rows and the
// minicard's `cardFlowOf` helper. Every change goes through setCardFlow, which
// checks the card edit right and the Expedite limit on the server.
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';

const { flowView, CLASSES_OF_SERVICE, MOSCOW, WSJF_PARTS, WSJF_SCALE, CLASS_LABEL, MOSCOW_LABEL } = require('/models/lib/cardFlow');

const WSJF_LABEL = { businessValue: 'wsjf-business-value', timeCriticality: 'wsjf-time-criticality',
  riskReduction: 'wsjf-risk-reduction', jobSize: 'wsjf-job-size' };

// A linked card shows its source's flow, as the server writes it.
function sourceOf(card) {
  if (card && typeof card.isLinkedCard === 'function' && card.isLinkedCard()) {
    return ReactiveCache.getCard(card.linkedId) || card;
  }
  return card;
}

Template.registerHelper('cardFlowOf', card => {
  const view = flowView(sourceOf(card));
  return view.blocked || view.classOfService || view.moscow || view.wsjfScore ? view : null;
});

function choices(values, labels, chosen) {
  return [{ value: '', labelKey: null, selected: !chosen },
    ...values.map(value => ({ value, labelKey: labels[value], selected: value === chosen }))];
}

function save(card, patch) {
  Meteor.callAsync('setCardFlow', card._id, patch).catch(error => {
    if (error && error.error === 'expedite-limit') window.alert(TAPi18n.__('expedite-limit'));
    else window.alert((error && (error.reason || error.error)) || String(error));
  });
}

const helpers = {
  flowOf(card) { return flowView(sourceOf(card)); },
  flowDate(date) { return date ? new Date(date).toLocaleString() : ''; },
  flowUser(userId) {
    const user = userId && ReactiveCache.getUser(userId);
    return (user && (user.profile?.fullname || user.username)) || '-';
  },
  // Each select's options, the empty one ("-") first, with which is chosen.
  classOptions() { return choices(CLASSES_OF_SERVICE, CLASS_LABEL, this.classOfService); },
  moscowOptions() { return choices(MOSCOW, MOSCOW_LABEL, this.moscow); },
  wsjfParts() {
    const wsjf = this.wsjf || {};
    return WSJF_PARTS.map(key => {
      const value = WSJF_SCALE.includes(wsjf[key]) ? wsjf[key] : null;
      return { key, labelKey: WSJF_LABEL[key], value,
        options: [{ value: '', text: '-', selected: value === null },
          ...WSJF_SCALE.map(n => ({ value: String(n), text: String(n), selected: n === value }))] };
    });
  },
};
['cardFlowBlocked', 'cardFlowClassOfService', 'cardFlowMoscow', 'cardFlowWsjf'].forEach(name => {
  Template[name].helpers(helpers);
});

Template.cardFlowBlocked.events({
  'change .js-card-flow-blocked'(event, tpl) {
    save(tpl.data.card, { blocked: event.currentTarget.checked });
  },
  'change .js-card-flow-blocked-reason'(event, tpl) {
    save(tpl.data.card, { blockedReason: event.currentTarget.value });
  },
});
Template.cardFlowClassOfService.events({
  'change .js-card-flow-class'(event, tpl) {
    save(tpl.data.card, { classOfService: event.currentTarget.value });
  },
});
Template.cardFlowMoscow.events({
  'change .js-card-flow-moscow'(event, tpl) {
    save(tpl.data.card, { moscow: event.currentTarget.value });
  },
});
Template.cardFlowWsjf.events({
  'change .js-card-flow-wsjf'(event, tpl) {
    const value = event.currentTarget.value;
    save(tpl.data.card, { wsjf: { [event.currentTarget.dataset.part]: value === '' ? null : Number(value) } });
  },
});
