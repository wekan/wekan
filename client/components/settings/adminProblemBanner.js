import { TAPi18n } from '/imports/i18n';

// Admin Panel top banner: shows, per problem area (Reports → Security / Speed /
// Tests), the menu path and the count of NEW (unacknowledged) problems, each with
// an Acknowledge button that zeroes the count and removes the info from the top.
// Design: docs/Security/Remediation/WeKan.md. Data comes from the admin-only
// eventLogProblemAreas / acknowledgeEventLog methods (models/eventLog.js).

const STREAM_LABEL_KEY = {
  security: 'securityReportTitle',
  speed: 'speedReportTitle',
  tests: 'testsReportTitle',
};

Template.adminProblemBanner.onCreated(function () {
  this.areas = new ReactiveVar([]);
  this.reload = () => {
    Meteor.call('eventLogProblemAreas', (err, res) => {
      if (!err) this.areas.set(Array.isArray(res) ? res : []);
    });
  };
  this.reload();
  // Light poll so a newly-detected problem shows without a page reload.
  this.timer = Meteor.setInterval(this.reload, 30000);
});

Template.adminProblemBanner.onDestroyed(function () {
  if (this.timer) Meteor.clearInterval(this.timer);
});

Template.adminProblemBanner.helpers({
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

Template.adminProblemBanner.events({
  'click .js-ack-problems'(event, templateInstance) {
    const stream = event.currentTarget.getAttribute('data-stream');
    Meteor.call('acknowledgeEventLog', stream, () => templateInstance.reload());
  },
});
