import { Template } from 'meteor/templating';
import { Random } from 'meteor/random';
import { creationTitles } from '/models/lib/multilineTitles';
import './multilineTitleChoice.jade';

export function titlesFromComposer(input) {
  if (!input) return [];
  const mode = input.closest('form')?.querySelector('.js-multiline-title-mode:checked');
  return creationTitles(input.value, mode?.value === 'separate');
}

Template.multilineTitleChoice.onCreated(function () {
  this.groupName = `title-mode-${Random.id()}`;
});
Template.multilineTitleChoice.helpers({
  groupName() { return Template.instance().groupName; },
});
