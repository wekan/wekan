// Flowtime (#3919): "better than Pomodoro" - a work session with no fixed
// interval. Unlike the manual time-entry popup in cardTime.js, this tracks a
// live, in-progress session server-side (so a page reload does not lose it),
// tallies interruptions without stopping the clock, and on Stop adds the
// session's duration into the SAME `spentTime` field the manual popup edits,
// via the existing card.setSpentTime()-based helper - it feeds the same
// total rather than keeping a separate one.
import { TAPi18n } from '/imports/i18n';
import Cards from '/models/cards';
import { getCurrentCardIdFromContext } from '/client/lib/currentCard';

function getCardId() {
  return getCurrentCardIdFromContext();
}

// Anyone who may interact with the session: the user who started it, or
// anyone with general card-modify rights (a board admin taking over, e.g.).
// This is the simplest rule that still lets a teammate stop a session left
// running by someone who stepped away, without opening the buttons to
// read-only board members.
function canControlFlow(card) {
  if (!card) return false;
  if (!Utils.canModifyCard()) return false;
  return true;
}

Template.cardFlowtime.onCreated(function () {
  this.elapsed = new ReactiveVar(0);
  this.timer = null;

  const startTicking = startAt => {
    if (this.timer) Meteor.clearInterval(this.timer);
    const tick = () => {
      this.elapsed.set(Math.max(0, Date.now() - new Date(startAt).getTime()));
    };
    tick();
    this.timer = Meteor.setInterval(tick, 1000);
  };

  this.autorun(() => {
    const card = Cards.findOne(getCardId());
    if (card && card.isFlowActive && card.isFlowActive()) {
      startTicking(card.flowStartAt);
    } else if (this.timer) {
      Meteor.clearInterval(this.timer);
      this.timer = null;
      this.elapsed.set(0);
    }
  });
});

Template.cardFlowtime.onDestroyed(function () {
  if (this.timer) Meteor.clearInterval(this.timer);
});

Template.cardFlowtime.helpers({
  card() {
    return Cards.findOne(getCardId());
  },
  isFlowActive() {
    const card = Cards.findOne(getCardId());
    return card && card.isFlowActive && card.isFlowActive();
  },
  canControlFlow() {
    return canControlFlow(Cards.findOne(getCardId()));
  },
  flowInterruptions() {
    const card = Cards.findOne(getCardId());
    return card && card.getFlowInterruptions ? card.getFlowInterruptions() : 0;
  },
  elapsedDisplay() {
    const ms = Template.instance().elapsed.get();
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = n => `${n}`.padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  },
});

Template.cardFlowtime.events({
  'click .js-start-flow'(evt) {
    evt.preventDefault();
    const card = Cards.findOne(getCardId());
    if (!card || !Utils.canModifyCard()) return;
    card.startFlowSession(Meteor.userId());
  },
  'click .js-add-flow-interruption'(evt) {
    evt.preventDefault();
    const card = Cards.findOne(getCardId());
    if (!card || !canControlFlow(card)) return;
    card.addFlowInterruption();
  },
  'click .js-stop-flow'(evt) {
    evt.preventDefault();
    const card = Cards.findOne(getCardId());
    if (!card || !canControlFlow(card)) return;
    card.stopFlowSession();
  },
});
