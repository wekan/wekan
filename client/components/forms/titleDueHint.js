import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from '/imports/i18n';
import { boardFlagOn } from '/client/lib/boardFlagOn';
import './titleDueHint.jade';

const { parseTitleDueDate } = require('/models/lib/titleDueDate');

// docs/Features/Cards/Dates/Due-Date-From-Title.md. One place decides whether a
// title gives its card a due date, for the add-card form (the board's
// allowsDueFromTitleOnMinicard) and the opened card's title (...OnCard): the
// board flag, which Admin Panel / Settings / Visibility / Features / Card
// fields turns off everywhere through the client's board read, and the hint's
// x, remembered on the form.

const DISMISSED = 'dueFromTitleDismissed';

function language() {
  return TAPi18n.getLanguage() || 'en';
}

// What submitting `title` from `form` gives: { title, dueAt } or null.
export function dueFromTitle(form, title, field) {
  if (!boardFlagOn(field)) return null;
  if (form && form.dataset[DISMISSED] === '1') return null;
  return parseTitleDueDate(title, { locale: language() });
}

// After a card is added the same form takes the next title, with a hint of
// its own.
export function resetDueFromTitle(form) {
  if (!form) return;
  delete form.dataset[DISMISSED];
  form.dispatchEvent(new CustomEvent('title-due-refresh'));
}

function formatDue(date) {
  const options = { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
  try {
    return new Intl.DateTimeFormat(language(), options).format(date);
  } catch (e) {
    return new Intl.DateTimeFormat('en', options).format(date);
  }
}

Template.titleDueHint.onCreated(function () {
  this.due = new ReactiveVar('');
});

Template.titleDueHint.onRendered(function () {
  const tpl = this;
  const form = tpl.firstNode && (tpl.firstNode.parentElement || tpl.firstNode.parentNode)?.closest('form');
  if (!form) return;
  tpl.form = form;
  const { selector, field } = tpl.data;
  tpl.update = () => {
    const input = form.querySelector(selector);
    const text = input ? input.value : '';
    if (!text.trim()) delete form.dataset[DISMISSED];
    // One card per line is pasted as several titles; the hint is for one.
    const parsed = text.includes('\n') ? null : dueFromTitle(form, text, field);
    tpl.due.set(parsed ? formatDue(parsed.dueAt) : '');
  };
  // Not only on typing: the board's switch (Board Settings / Card, Admin
  // Panel / Visibility) and the language can change while the form is open,
  // and the hint follows them - a switch turned off takes away a hint already
  // shown, as it takes away the due date the submit would set.
  tpl.autorun(() => tpl.update());
  tpl.listener = event => {
    if (event.target && event.target.matches && event.target.matches(selector)) tpl.update();
  };
  form.addEventListener('input', tpl.listener);
  // A form that empties its field in code (the add-card form after a card is
  // added) sends this, since setting a value fires no input event.
  form.addEventListener('title-due-refresh', tpl.update);
});

Template.titleDueHint.onDestroyed(function () {
  if (this.form && this.listener) this.form.removeEventListener('input', this.listener);
  if (this.form && this.update) this.form.removeEventListener('title-due-refresh', this.update);
});

Template.titleDueHint.helpers({
  due() { return Template.instance().due.get(); },
});

Template.titleDueHint.events({
  'click .js-title-due-hint-dismiss'(event, tpl) {
    event.preventDefault();
    event.stopPropagation();
    if (tpl.form) tpl.form.dataset[DISMISSED] = '1';
    tpl.due.set('');
    const input = tpl.form && tpl.form.querySelector(tpl.data.selector);
    if (input) input.focus();
  },
});
