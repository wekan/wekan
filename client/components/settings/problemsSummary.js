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
  // "Broken cards N" repair button state (see the repairBrokenCards method in
  // server/methods/repairBrokenCards.js).
  this.repairRunning = new ReactiveVar(false);
  this.repairResult = new ReactiveVar('');
  // Status overview: everything in progress (migrations / repairs) + detected
  // problems (broken cards, login-page "Must be logged in" causes). Same data as
  // `snap run wekan.problems`.
  this.status = new ReactiveVar(null);
  this.reload = () => {
    Meteor.call('eventLogProblemAreas', (err, res) => {
      if (!err) this.areas.set(Array.isArray(res) ? res : []);
    });
    Meteor.call('systemStatusReport', (err, res) => {
      if (!err) this.status.set(res || null);
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
  statusOverview() {
    const s = Template.instance().status.get();
    return s && s.overview ? s.overview : null;
  },
  inProgress() {
    const s = Template.instance().status.get();
    return s && s.overview ? s.overview.inProgress : [];
  },
  statusProblems() {
    const s = Template.instance().status.get();
    return s && s.overview ? s.overview.problems : [];
  },
  // Only the broken-cards problem gets a Repair button — the other detected
  // problems (login-page causes) are configuration, not repairable data.
  isBrokenCards(problem) {
    return !!problem && problem.id === 'broken-cards';
  },
  repairRunning() {
    return Template.instance().repairRunning.get();
  },
  repairResult() {
    return Template.instance().repairResult.get();
  },
});

Template.problemsSummary.events({
  // Run the broken-card repair migration over every board. The button stays
  // disabled while it runs; when it finishes the overview is reloaded so the
  // "Broken cards N" count reflects the repair straight away.
  'click .js-repair-broken-cards'(event, templateInstance) {
    event.preventDefault();
    if (templateInstance.repairRunning.get()) return;
    templateInstance.repairRunning.set(true);
    templateInstance.repairResult.set('');
    Meteor.call('repairBrokenCards', (error, res) => {
      templateInstance.repairRunning.set(false);
      if (error) {
        templateInstance.repairResult.set(error.reason || error.message || String(error));
        return;
      }
      const fixed =
        (res.cardsAssigned || 0) +
        (res.cardsRescued || 0) +
        (res.archivedCardsFixed || 0) +
        (res.listsAssigned || 0) +
        (res.swimlanesAssigned || 0);
      // Cards with no boardId at all cannot be placed on any board, so say so
      // explicitly instead of leaving a count that never reaches zero unexplained.
      const unfixable = res.unfixable || 0;
      templateInstance.repairResult.set(
        unfixable > 0
          ? TAPi18n.__('repair-broken-cards-done-unfixable', { fixed, unfixable })
          : TAPi18n.__('repair-broken-cards-done', { fixed }),
      );
      templateInstance.reload();
    });
  },

  'click .js-ack-checked'(event, templateInstance) {
    const streams = Array.from(templateInstance.findAll('.js-problem-check:checked'))
      .map(el => el.getAttribute('data-stream'))
      .filter(Boolean);
    if (!streams.length) return;
    Meteor.call('acknowledgeEventLog', streams, () => templateInstance.reload());
  },
});
