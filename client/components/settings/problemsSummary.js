import { TAPi18n } from '/imports/i18n';

// Admin Panel → Problems → Summary page: a checkbox list of problem areas
// (Security / Speed / Tests) with each area's menu path and its count of NEW
// (unacknowledged) problems, plus ONE Acknowledge button that acknowledges every
// checked area. This is the ONLY place problems are acknowledged — the Security /
// Speed / Tests detail pages are read-only.
// Design: docs/Security/Remediation/WeKan.md. Data: the admin-only
// eventLogProblemAreas / acknowledgeEventLog methods (models/eventLog.js).

const STREAM_LABEL_KEY = {
  security: 'securityReportTitle',
  speed: 'speedReportTitle',
  tests: 'testsReportTitle',
};

Template.problemsSummary.onCreated(function () {
  this.areas = new ReactiveVar([]);
  this.reload = () => {
    Meteor.call('eventLogProblemAreas', (err, res) => {
      if (!err) this.areas.set(Array.isArray(res) ? res : []);
    });
  };
  this.reload();
  this.timer = Meteor.setInterval(this.reload, 30000);
});

Template.problemsSummary.onDestroyed(function () {
  if (this.timer) Meteor.clearInterval(this.timer);
});

Template.problemsSummary.helpers({
  areas() {
    return Template.instance().areas.get();
  },
  hasProblems() {
    return (Template.instance().areas.get() || []).length > 0;
  },
  areaLabel(stream) {
    return TAPi18n.__(STREAM_LABEL_KEY[stream] || stream);
  },
});

Template.problemsSummary.events({
  'click .js-ack-checked'(event, templateInstance) {
    const streams = Array.from(templateInstance.findAll('.js-problem-check:checked'))
      .map(el => el.getAttribute('data-stream'))
      .filter(Boolean);
    if (!streams.length) return;
    Meteor.call('acknowledgeEventLog', streams, () => templateInstance.reload());
  },
});
