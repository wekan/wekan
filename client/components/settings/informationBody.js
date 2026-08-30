import { TAPi18n } from '/imports/i18n';
const { filesize } = require('filesize');

Template.statistics.onCreated(function () {
  this.info = new ReactiveVar({});
  this.versionManifest = new ReactiveVar('');
  this.versionCheckError = new ReactiveVar('');
  this.versionCheckRunning = new ReactiveVar(false);
  Meteor.call('getStatistics', (error, ret) => {
    if (!error && ret) {
      this.info.set(ret);
    }
  });
});

// No page template and no menu of its own any more: Version is the first pane of
// Admin Panel / Settings, whose menu (docs/Features/Page/Left-Menu.md) carries the
// entry that opens it. This file is just the statistics pane now.

Template.statistics.helpers({
  statistics() {
    return Template.instance().info.get();
  },

  versionCheckRunning() {
    return Template.instance().versionCheckRunning.get();
  },

  versionCheckError() {
    return Template.instance().versionCheckError.get();
  },

  versionManifestText() {
    return Template.instance().versionManifest.get();
  },

  humanReadableTime(time) {
    const days = Math.floor(time / 86400);
    const hours = Math.floor((time % 86400) / 3600);
    const minutes = Math.floor(((time % 86400) % 3600) / 60);
    const seconds = Math.floor(((time % 86400) % 3600) % 60);
    let out = '';
    if (days > 0) {
      out += `${days} ${TAPi18n.__('days')}, `;
    }
    if (hours > 0) {
      out += `${hours} ${TAPi18n.__('hours')}, `;
    }
    if (minutes > 0) {
      out += `${minutes} ${TAPi18n.__('minutes')}, `;
    }
    if (seconds > 0) {
      out += `${seconds} ${TAPi18n.__('seconds')}`;
    }
    return out;
  },

  numFormat(number) {
    return parseFloat(number).toFixed(2);
  },

  fileSize(size) {
    let ret = "";
    if (typeof size === 'number') {
      ret = filesize(size);
    }
    return ret;
  },

  formatBoolean(value) {
    return value ? TAPi18n.__('yes') : TAPi18n.__('no');
  },
});

Template.statistics.events({
  'click .js-check-newest-versions'(event, instance) {
    event.preventDefault();
    if (instance.versionCheckRunning.get()) return;
    instance.versionCheckRunning.set(true);
    instance.versionCheckError.set('');
    instance.versionManifest.set('');
    Meteor.call('checkNewestVersions', (error, result) => {
      instance.versionCheckRunning.set(false);
      if (error || !result) {
        // Never show an upstream body or exception: GitHub's reply is untrusted,
        // and offline, timeout, HTTP and invalid-version failures are equivalent
        // to the administrator using this on-demand check.
        instance.versionCheckError.set(TAPi18n.__('version-check-failed'));
        return;
      }
      instance.versionManifest.set(result.text);
    });
  },
});
