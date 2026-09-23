import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { creationTitles, splitTitleLines } from '/models/lib/multilineTitles';
import './multilineTitleChoice.jade';

export function titlesFromComposer(input) {
  if (!input) return [];
  const mode = input.closest('form')?.querySelector('.js-multiline-title-mode');
  return creationTitles(input.value, mode?.value === 'separate');
}

Template.multilineTitleChoice.onCreated(function () {
  this.lineCount = new ReactiveVar(0);
});
Template.multilineTitleChoice.onRendered(function () {
  this.form = this.firstNode.closest('form');
  this.updateCount = () => {
    const input = this.form?.querySelector(this.data.selector);
    this.lineCount.set(splitTitleLines(input?.value).length);
  };
  this.form?.addEventListener('input', this.updateCount);
  this.updateCount();
});
Template.multilineTitleChoice.onDestroyed(function () {
  this.form?.removeEventListener('input', this.updateCount);
});
Template.multilineTitleChoice.helpers({
  multiple() { return Template.instance().lineCount.get() > 1; },
  lineCount() { return Template.instance().lineCount.get(); },
});
