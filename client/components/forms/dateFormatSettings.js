import { Utils } from '/client/lib/utils';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import './dateFormatSettings.jade';
import './dateFormatSettings.css';
const { availableCalendarSystems } = require('/imports/lib/calendarSystems');
const { DATE_FORMATS } = require('/models/lib/dateFormatPolicy');

Template.dateFormatEditor.onCreated(function () {
  this.boardId = Utils.getCurrentBoard()?._id;
  this.error = new ReactiveVar('');
  this.saving = new ReactiveVar(false);
  this.overrideDraft = new ReactiveVar(null);
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
  weekDays(startDay) {
    return [
      TAPi18n.__('sunday'),
      TAPi18n.__('monday'),
      TAPi18n.__('tuesday'),
      TAPi18n.__('wednesday'),
      TAPi18n.__('thursday'),
      TAPi18n.__('friday'),
      TAPi18n.__('saturday'),
    ].map(function(day, index) {
      return { name: day, value: index, isSelected: index === startDay };
    });
  },
  startDayOfWeek() {
    const currentUser = ReactiveCache.getCurrentUser();
    if (currentUser) {
      return currentUser.getStartDayOfWeek();
    } else {
      return window.localStorage.getItem('startDayOfWeek');
    }
  },
  // Supported calendar choices are independent of the interface language.
  calendarSystems() {
    const currentUser = ReactiveCache.getCurrentUser();
    const current = currentUser
      ? currentUser.getCalendarSystem()
      : window.localStorage.getItem('calendarSystem') || 'gregorian';
    return availableCalendarSystems().map(system => ({
      ...system,
      name: TAPi18n.__(system.labelKey),
      isSelected: system.value === current,
    }));
  },
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
  enabled() {
    const instance = Template.instance();
    return instance.overrideDraft.get() ?? !!preference(instance)?.dateFormatOverride;
  },
  error() { return Template.instance().error.get(); },
  saving() { return Template.instance().saving.get(); },
  formats() {
    const selected = preference(Template.instance())?.dateFormat || DATE_FORMATS[0];
    return DATE_FORMATS.map(value => ({ value, selected: value === selected, label: formatLabel(value) }));
  },
});

Template.dateFormatEditor.events({
  'change .js-date-format-override'(event, instance) {
    instance.overrideDraft.set(event.currentTarget.checked);
  },
  async 'submit .js-date-format-form'(event, instance) {
    event.preventDefault();
    if (instance.saving.get()) return;
    instance.saving.set(true);
    instance.error.set('');
    const format = instance.find('.js-date-format-select').value;
    const enabled = instance.find('.js-date-format-override').checked;
    // Capture all inputs before reactive profile updates can rerender options.
    const member = instance.data.scope === 'member';
    const startDay = member ? Number(instance.find('#start-day-of-week').value) : null;
    const calendar = member ? instance.find('#calendar-system').value : null;
    try {
      if (instance.data.scope === 'board') {
        await Meteor.callAsync('setBoardDateFormat', instance.boardId, format, enabled);
      } else {
        await Meteor.callAsync('changeDateFormat', format, enabled);
        await Meteor.callAsync('changeStartDayOfWeek', startDay);
        await Meteor.callAsync('changeCalendarSystem', calendar);
      }
      Popup.back();
    } catch (error) {
      instance.error.set(error.reason || error.message);
    } finally {
      instance.saving.set(false);
    }
  },
});

// #687: the board's CalDAV link, for board admins (server/caldavSync.js).
Template.boardDateSettingsPopup.onCreated(function () {
  this.caldav = new ReactiveVar({ url: '', username: '', enabled: false, hasPassword: false });
  this.caldavMessage = new ReactiveVar('');
  const board = Utils.getCurrentBoard();
  if (board && ReactiveCache.getCurrentUser()?.isBoardAdmin()) {
    Meteor.call('getCalDavLink', board._id, (error, link) => { if (!error && link) this.caldav.set(link); });
  }
});

Template.boardDateSettingsPopup.helpers({
  caldav() { return Template.instance().caldav.get(); },
  caldavMessage() { return Template.instance().caldavMessage.get(); },
  isShowWeekOfYear() {
    const user = ReactiveCache.getCurrentUser();
    if (!user) return window.localStorage.getItem('showWeekOfYear') === 'true';
    return user.isShowWeekOfYear();
  },
});

Template.boardDateSettingsPopup.events({
  'click .js-caldav-enabled'(event, tpl) {
    event.preventDefault();
    tpl.caldav.set({ ...tpl.caldav.get(), enabled: !tpl.caldav.get().enabled });
  },
  async 'click .js-caldav-save, submit .js-caldav-link'(event, tpl) {
    event.preventDefault();
    const board = Utils.getCurrentBoard();
    if (!board) return;
    const input = { url: String(tpl.$('.js-caldav-url').val() || ''), username: String(tpl.$('.js-caldav-username').val() || ''),
      enabled: !!tpl.caldav.get().enabled };
    const password = String(tpl.$('.js-caldav-password').val() || '');
    if (password) input.password = password;
    try {
      await Meteor.callAsync('saveCalDavLink', board._id, input);
      tpl.caldav.set(await Meteor.callAsync('getCalDavLink', board._id));
      tpl.$('.js-caldav-password').val('');
      tpl.caldavMessage.set(TAPi18n.__('feature-saved'));
    } catch (error) {
      tpl.caldavMessage.set(TAPi18n.__(error.error) || error.reason || error.message);
    }
  },
  async 'click .js-caldav-sync-now'(event, tpl) {
    event.preventDefault();
    const board = Utils.getCurrentBoard();
    if (!board) return;
    try {
      const result = await Meteor.callAsync('syncCalDavNow', board._id);
      tpl.caldavMessage.set(`${result.pushed} / ${result.total}`);
    } catch (error) {
      tpl.caldavMessage.set(TAPi18n.__(error.error) || error.reason || error.message);
    }
  },
  'click .js-show-week-of-year-toggle'() {
    const user = ReactiveCache.getCurrentUser();
    if (user) {
      user.toggleShowWeekOfYear();
    } else {
      const current = window.localStorage.getItem('showWeekOfYear') === 'true';
      window.localStorage.setItem('showWeekOfYear', String(!current));
    }
  },
});
