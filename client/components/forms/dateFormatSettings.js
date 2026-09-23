import { Utils } from '/client/lib/utils';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import './dateFormatSettings.jade';
import './dateFormatSettings.css';
const { DATE_FORMATS } = require('/models/lib/dateFormatPolicy');

Template.dateFormatEditor.onCreated(function () {
  this.boardId = Utils.getCurrentBoard()?._id;
  this.error = new ReactiveVar('');
  this.saving = new ReactiveVar(false);
});

function preference(instance) {
  return instance.data.scope === 'board'
    ? ReactiveCache.getBoard(instance.boardId)
    : ReactiveCache.getCurrentUser()?.profile;
}

function formatLabel(value) {
  const format = DATE_FORMATS.includes(value) ? value : DATE_FORMATS[0];
  return TAPi18n.__(`date-format-${format.replace('-date-only', '').toLowerCase()}`) +
    (format.endsWith('-date-only') ? '' : ` · ${TAPi18n.__('time')}`);
}

Template.dateFormatEditor.helpers({
  isMember() { return Template.instance().data.scope === 'member'; },
  globalEnabled() { return !!ReactiveCache.getCurrentSetting()?.hideDateFormat; },
  globalFormat() { return formatLabel(ReactiveCache.getCurrentSetting()?.globalDateFormat); },
  boardEnabled() {
    const id = Template.instance().boardId;
    return !!(id && ReactiveCache.getBoard(id)?.dateFormatOverride);
  },
  boardFormat() {
    const id = Template.instance().boardId;
    return formatLabel(id && ReactiveCache.getBoard(id)?.dateFormat);
  },
  enabled() { return !!preference(Template.instance())?.dateFormatOverride; },
  error() { return Template.instance().error.get(); },
  saving() { return Template.instance().saving.get(); },
  formats() {
    const selected = preference(Template.instance())?.dateFormat || DATE_FORMATS[0];
    return DATE_FORMATS.map(value => ({ value, selected: value === selected, label: formatLabel(value) }));
  },
});

Template.dateFormatEditor.events({
  async 'submit .js-date-format-form'(event, instance) {
    event.preventDefault();
    if (instance.saving.get()) return;
    instance.saving.set(true);
    instance.error.set('');
    const format = instance.find('.js-date-format-select').value;
    const enabled = instance.find('.js-date-format-override').checked;
    try {
      if (instance.data.scope === 'board') {
        await Meteor.callAsync('setBoardDateFormat', instance.boardId, format, enabled);
      } else {
        await Meteor.callAsync('changeDateFormat', format, enabled);
      }
      Popup.back();
    } catch (error) {
      instance.error.set(error.reason || error.message);
    } finally {
      instance.saving.set(false);
    }
  },
});
