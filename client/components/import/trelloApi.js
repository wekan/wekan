import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';

const isSandstorm = () => !!(Meteor.settings && Meteor.settings.public && Meteor.settings.public.sandstorm);
const errorText = e => String((e && (e.reason || e.message || e.error)) || e);

// The Sandstorm Powerbox step for an external API (`service`, e.g. 'trello').
// Asks the server whether this user already granted it, and grants or forgets
// it on request. sandstorm.js sandstormRequestExternalApi opens the Powerbox.
Template.sandstormExternalApiGrant.onCreated(function () {
  this.granted = new ReactiveVar(false);
  this.error = new ReactiveVar('');
  if (isSandstorm()) {
    Meteor.callAsync('sandstormApiGrantStatus', this.data.service)
      .then(status => this.granted.set(!!(status && status.granted)))
      .catch(e => this.error.set(errorText(e)));
  }
});

Template.sandstormExternalApiGrant.helpers({
  granted() { return Template.instance().granted; },
  error() { return Template.instance().error; },
});

Template.sandstormExternalApiGrant.events({
  'click .js-sandstorm-grant-api'(evt, tpl) {
    tpl.error.set('');
    window.sandstormRequestExternalApi(tpl.data.service, TAPi18n.__('sandstorm-trello-save-label'))
      .then(granted => { if (granted) tpl.granted.set(true); })
      .catch(e => tpl.error.set(errorText(e)));
  },
  'click .js-sandstorm-forget-api'(evt, tpl) {
    evt.preventDefault();
    Meteor.callAsync('sandstormForgetApiGrant', tpl.data.service)
      .then(() => tpl.granted.set(false))
      .catch(e => tpl.error.set(errorText(e)));
  },
});

const POLL_MS = 2000;

Template.exportToTrelloPopup.onCreated(function () {
  this.error = new ReactiveVar('');
  this.job = new ReactiveVar(null);
  this.jobId = null;
  this.poll = null;
});

Template.exportToTrelloPopup.onDestroyed(function () {
  if (this.poll) Meteor.clearInterval(this.poll);
});

Template.exportToTrelloPopup.helpers({
  credsSaved() {
    const user = ReactiveCache.getCurrentUser();
    return !!(user && user.profile && user.profile.trelloApiSaved);
  },
  job() { return Template.instance().job.get(); },
  error() { return Template.instance().error; },
  running() {
    const job = Template.instance().job.get();
    return !!(job && job.status === 'running');
  },
});

Template.exportToTrelloPopup.events({
  'click .js-trello-export-start'(evt, tpl) {
    tpl.error.set('');
    const key = (tpl.$('.js-trello-export-key').val() || '').trim();
    const token = (tpl.$('.js-trello-export-token').val() || '').trim();
    const includeAttachments = tpl.$('.js-trello-export-attachments').is(':checked');
    const boardId = Session.get('currentBoard');
    Meteor.callAsync('trelloExportBoard', boardId, key, token, { includeAttachments })
      .then(jobId => {
        tpl.jobId = jobId;
        tpl.job.set({ status: 'running', done: 0, total: 0, warnings: [] });
        const refresh = () => Meteor.callAsync('trelloExportStatus', jobId).then(job => {
          tpl.job.set(job);
          if (job.status !== 'running' && tpl.poll) {
            Meteor.clearInterval(tpl.poll);
            tpl.poll = null;
          }
        }).catch(e => tpl.error.set(errorText(e)));
        if (tpl.poll) Meteor.clearInterval(tpl.poll);
        tpl.poll = Meteor.setInterval(refresh, POLL_MS);
        refresh();
      })
      .catch(e => tpl.error.set(errorText(e)));
  },
});
