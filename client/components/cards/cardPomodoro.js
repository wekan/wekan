// Pomodoro (#4862): the classic FIXED-interval technique - a 25-minute work
// interval followed by a break (5 minutes, or a longer break every 4th
// completed work interval), unlike the separate, open-ended Flowtime
// feature in cardFlowtime.js. Reuses the same live-ticking-display idiom as
// cardFlowtime.js for consistency, and reuses the SAME setSpentTime()-based
// card helper for adding completed time - never a duplicate of it.
import { TAPi18n } from '/imports/i18n';
import Cards from '/models/cards';
import { getCurrentCardIdFromContext } from '/client/lib/currentCard';
import { Utils } from '/client/lib/utils';

function getCardId() {
  return getCurrentCardIdFromContext();
}

function canControlPomodoro(card) {
  if (!card) return false;
  if (!Utils.canModifyCard()) return false;
  return true;
}

Template.cardPomodoro.onCreated(function () {
  this.remainingMs = new ReactiveVar(0);
  this.workMinutesInput = new ReactiveVar(25);
  this.timer = null;

  const phaseTotalMs = card => {
    const minutes =
      card.pomodoroPhase === 'break'
        ? card.getPomodoroBreakMinutes()
        : card.getPomodoroWorkMinutes();
    return minutes * 60 * 1000;
  };

  const startTicking = card => {
    if (this.timer) Meteor.clearInterval(this.timer);
    const startAt = new Date(card.pomodoroStartAt).getTime();
    const totalMs = phaseTotalMs(card);
    const tick = () => {
      const remaining = Math.max(0, totalMs - (Date.now() - startAt));
      this.remainingMs.set(remaining);
      if (remaining <= 0) {
        // Reached zero: transition the interval. Re-fetch the card so we
        // never act on a stale phase if it changed elsewhere.
        const current = Cards.findOne(getCardId());
        if (!current || !current.isPomodoroActive()) return;
        if (current.pomodoroPhase === 'work') {
          current.completePomodoroWorkInterval();
        } else if (current.pomodoroPhase === 'break') {
          current.completePomodoroBreakInterval();
        }
      }
    };
    tick();
    this.timer = Meteor.setInterval(tick, 1000);
  };

  this.autorun(() => {
    const card = Cards.findOne(getCardId());
    if (card && card.isPomodoroActive && card.isPomodoroActive()) {
      startTicking(card);
    } else if (this.timer) {
      Meteor.clearInterval(this.timer);
      this.timer = null;
      this.remainingMs.set(0);
    }
  });
});

Template.cardPomodoro.onDestroyed(function () {
  if (this.timer) Meteor.clearInterval(this.timer);
});

Template.cardPomodoro.helpers({
  card() {
    return Cards.findOne(getCardId());
  },
  isPomodoroActive() {
    const card = Cards.findOne(getCardId());
    return card && card.isPomodoroActive && card.isPomodoroActive();
  },
  canControlPomodoro() {
    return canControlPomodoro(Cards.findOne(getCardId()));
  },
  pomodoroPhase() {
    const card = Cards.findOne(getCardId());
    return card && card.pomodoroPhase;
  },
  pomodoroPhaseLabel() {
    const card = Cards.findOne(getCardId());
    if (!card) return '';
    return card.pomodoroPhase === 'break'
      ? TAPi18n.__('pomodoro-break')
      : TAPi18n.__('pomodoro-work');
  },
  pomodoroCount() {
    const card = Cards.findOne(getCardId());
    return card && card.getPomodoroCount ? card.getPomodoroCount() : 0;
  },
  workMinutesInput() {
    return Template.instance().workMinutesInput.get();
  },
  remainingDisplay() {
    const ms = Template.instance().remainingMs.get();
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const pad = n => `${n}`.padStart(2, '0');
    return `${pad(minutes)}:${pad(seconds)}`;
  },
});

Template.cardPomodoro.events({
  'change .js-pomodoro-work-minutes'(evt, tpl) {
    const value = parseInt(evt.target.value, 10);
    if (value > 0) tpl.workMinutesInput.set(value);
  },
  'click .js-start-pomodoro'(evt, tpl) {
    evt.preventDefault();
    const card = Cards.findOne(getCardId());
    if (!card || !Utils.canModifyCard()) return;
    card.startPomodoro(Meteor.userId(), tpl.workMinutesInput.get());
  },
  'click .js-stop-pomodoro'(evt) {
    evt.preventDefault();
    const card = Cards.findOne(getCardId());
    if (!card || !canControlPomodoro(card)) return;
    card.stopPomodoro();
  },
});
