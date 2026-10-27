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
  // The resource monitors. CPU had no entry and showed as "cpu".
  cpu: 'cpuReportTitle',
  ram: 'memory-usage',
  disk: 'sandstorm-disk-usage',
};

Template.problemsSummary.onCreated(function () {
  this.areas = new ReactiveVar([]);
  // "Broken cards N" repair button state (see the repairBrokenCards method in
  // server/methods/repairBrokenCards.js).
  this.repairRunning = new ReactiveVar(false);
  this.repairResult = new ReactiveVar('');
  // "Lists missing their swimlane N" restore button state (#6670, see the
  // restoreListSwimlanes method in server/methods/restoreListSwimlanes.js).
  this.restoreRunning = new ReactiveVar(false);
  this.restoreResult = new ReactiveVar('');
  // Status overview: everything in progress (migrations / repairs) + detected
  // problems (broken cards, login-page "Must be logged in" causes). Same data as
  // `snap run wekan.problems`.
  this.status = new ReactiveVar(null);
  // Data health: which check is being repaired, which waits for its
  // confirming second click, and what each repair said.
  this.dataHealthRepairing = new ReactiveVar(null);
  this.dataHealthConfirming = new ReactiveVar(null);
  this.dataHealthResults = new ReactiveVar({});
  this.dataHealthScanRequested = new ReactiveVar(false);
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
  // Only the two data problems get a button — the other detected problems
  // (login-page causes) are configuration, not repairable data.
  isBrokenCards(problem) {
    return !!problem && problem.id === 'broken-cards';
  },
  isUnboundLists(problem) {
    return !!problem && problem.id === 'unbound-lists';
  },
  dataHealthRepairing(checkId) {
    return Template.instance().dataHealthRepairing.get() === checkId;
  },
  dataHealthConfirming(checkId) {
    return Template.instance().dataHealthConfirming.get() === checkId;
  },
  dataHealthResult(checkId) {
    return Template.instance().dataHealthResults.get()[checkId] || '';
  },
  dataHealthScanning() {
    const tpl = Template.instance();
    const s = tpl.status.get();
    return tpl.dataHealthScanRequested.get() || !!(s && s.dataHealth && s.dataHealth.running);
  },
  dataHealthStatus() {
    const s = Template.instance().status.get();
    const d = s && s.dataHealth;
    // A key of its own: List Sync's "never synced" may be translated as
    // "never synced", which reads wrong beside "Last Run".
    if (!d || !d.at) return TAPi18n.__('data-health-never-run');
    // "<when> - <checks that found something>/<checks>"
    const at = new Date(d.at).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
    const text = `${at} - ${d.found}/${d.checks}`;
    return d.error ? `${text} - ${d.error}` : text;
  },
  repairRunning() {
    return Template.instance().repairRunning.get();
  },
  repairResult() {
    return Template.instance().repairResult.get();
  },
  restoreRunning() {
    return Template.instance().restoreRunning.get();
  },
  restoreResult() {
    return Template.instance().restoreResult.get();
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

  // #6670: put back the swimlane each list was created in, for the lists the
  // pre-#6515 automatic repair un-bound. Only lists whose original swimlane is
  // still recorded AND still exists are touched; the rest stay board-wide, so
  // the count can legitimately not reach zero. The button stays disabled while
  // it runs, and the overview is reloaded afterwards so the count updates.
  'click .js-restore-list-swimlanes'(event, templateInstance) {
    event.preventDefault();
    if (templateInstance.restoreRunning.get()) return;
    templateInstance.restoreRunning.set(true);
    templateInstance.restoreResult.set('');
    Meteor.call('restoreListSwimlanes', (error, res) => {
      templateInstance.restoreRunning.set(false);
      if (error) {
        templateInstance.restoreResult.set(error.reason || error.message || String(error));
        return;
      }
      const restored = (res && res.restored) || 0;
      const remaining = (res && res.remaining) || 0;
      // Say what is LEFT as well as what was fixed: a list whose original
      // swimlane was never recorded, or has since been deleted, cannot be
      // restored, and an unexplained count that stays put is what sent the
      // last admin looking for a bug.
      templateInstance.restoreResult.set(
        TAPi18n.__('restore-list-swimlanes-done', { restored, remaining }),
      );
      templateInstance.reload();
    });
  },

  // A repair that deletes data ('confirm') needs a second click on the same
  // button; any other click cancels the pending confirmation.
  'click .js-data-health-repair'(event, templateInstance) {
    event.preventDefault();
    const checkId = event.currentTarget.getAttribute('data-check');
    const kind = event.currentTarget.getAttribute('data-repair');
    if (!checkId || templateInstance.dataHealthRepairing.get()) return;
    if (kind === 'confirm' && templateInstance.dataHealthConfirming.get() !== checkId) {
      templateInstance.dataHealthConfirming.set(checkId);
      return;
    }
    templateInstance.dataHealthConfirming.set(null);
    templateInstance.dataHealthRepairing.set(checkId);
    // The second click of a deleting repair is the confirmation the server
    // requires (server/methods/dataHealth.js).
    Meteor.call('repairDataHealth', checkId, kind === 'confirm', (error, res) => {
      templateInstance.dataHealthRepairing.set(null);
      const results = { ...templateInstance.dataHealthResults.get() };
      results[checkId] = error
        ? (error.reason || error.message || String(error))
        : `${TAPi18n.__('attachment-repair-repaired')}: ${(res && res.fixed) || 0}`;
      templateInstance.dataHealthResults.set(results);
      templateInstance.reload();
    });
  },

  'click .js-data-health-scan'(event, templateInstance) {
    event.preventDefault();
    templateInstance.dataHealthConfirming.set(null);
    templateInstance.dataHealthScanRequested.set(true);
    Meteor.call('dataHealthScanNow', () => {
      // The scan runs in the background; the 30 s reload shows it running and,
      // when it is done, its findings.
      Meteor.setTimeout(() => {
        templateInstance.dataHealthScanRequested.set(false);
        templateInstance.reload();
      }, 3000);
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
