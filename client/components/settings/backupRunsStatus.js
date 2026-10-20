import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { TAPi18n } from '/imports/i18n';
import { ReactiveCache } from '/imports/reactiveCache';

// Admin Panel backup status and history (backupRunsStatus.jade): the recorded runs
// and the instance backup's health from the backupHistory method
// (server/methods/backup.js, rules in models/lib/backupRuns.js). Used in
// Admin Panel / Attachments / Backup and Admin Panel / Problems / Backup.
//
// Reloads when Session 'backupHistoryChanged' changes - the Backup pane sets
// it when a run it is watching ends - and on the refresh icon.

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i += 1; }
  return `${n.toFixed(i ? 1 : 0)} ${units[i]}`;
}

function formatDuration(ms) {
  if (!Number.isFinite(ms)) return '';
  const total = Math.round(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  if (h) return `${h}h ${m}m`;
  return m ? `${m}m ${sec}s` : `${sec}s`;
}

function load(tpl) {
  Meteor.call('backupHistory', (err, history) => {
    if (!err && history) tpl.history.set(history);
  });
}

Template.backupRunsStatus.onCreated(function () {
  this.history = new ReactiveVar(null);
  this.autorun(() => {
    Session.get('backupHistoryChanged');
    load(this);
  });
});

Template.backupRunsStatus.helpers({
  backupHealth() {
    const h = Template.instance().history.get();
    return h && h.health;
  },
  backupHealthIs(state) {
    const h = Template.instance().history.get();
    return !!(h && h.health && h.health.state === state);
  },
  backupRuns() {
    const h = Template.instance().history.get();
    return (h && h.runs) || [];
  },
  backupNextRunAt() {
    const h = Template.instance().history.get();
    return h && h.nextRunAt;
  },
  backupRunIs(status) {
    return this.status === status;
  },
  backupRunSize() {
    return formatBytes(this.size);
  },
  backupRunDuration() {
    return formatDuration(this.durationMs);
  },
  backupScopeName(orgId) {
    if (!orgId) return TAPi18n.__('backup-scope-instance');
    const org = ReactiveCache.getOrg(orgId);
    return (org && org.orgDisplayName) || orgId;
  },
  settingsLink() {
    return !!(Template.currentData() && Template.currentData().settingsLink);
  },
  backupSettingsPath() {
    return FlowRouter.path('attachments', { pane: 'backup' });
  },
});

Template.backupRunsStatus.events({
  'click .js-refresh-backup-history'(event, tpl) {
    event.preventDefault();
    load(tpl);
  },
});
