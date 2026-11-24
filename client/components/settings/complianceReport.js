import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { adminPath } from '/models/lib/adminUrls';

const { STATUS_KEYS } = require('/models/lib/complianceChecks');

const ICONS = { ok: 'fa-check-circle', warn: 'fa-exclamation-triangle', info: 'fa-info-circle' };

// The checks come from the server, which alone knows its environment
// (getComplianceChecks, server/methods/complianceChecks.js).
Template.complianceReport.onCreated(function () {
  this.rows = new ReactiveVar(null);
  Meteor.call('getComplianceChecks', (error, rows) => this.rows.set(error ? [] : rows));
});

Template.complianceReport.helpers({
  loading() { return Template.instance().rows.get() === null; },
  rows() {
    return (Template.instance().rows.get() || []).map(row => ({
      ...row,
      icon: ICONS[row.status] || ICONS.info,
      statusKey: STATUS_KEYS[row.status] || STATUS_KEYS.info,
      href: adminPath(row.pane.page, row.pane.slug),
    }));
  },
});
