import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

// Admin Panel / Attachments / Encrypt: the counts, the switch and the two runs
// (server/lib/attachmentEncryptionRun.js); polled while a run goes on.
Template.attachmentEncryption.onCreated(function () {
  this.status = new ReactiveVar(null);
  this.reload = () => Meteor.call('attachmentEncryptionStatus', (error, status) => { if (!error) this.status.set(status); });
  this.reload();
  this.timer = Meteor.setInterval(() => {
    const s = this.status.get();
    if (s && s.progress && s.progress.running) this.reload();
  }, 2000);
});

Template.attachmentEncryption.onDestroyed(function () {
  if (this.timer) Meteor.clearInterval(this.timer);
});

Template.attachmentEncryption.helpers({
  status() { return Template.instance().status.get(); },
});

Template.attachmentEncryption.events({
  'change .js-encrypt-new'(event, tpl) {
    Meteor.call('setEncryptNewAttachments', event.currentTarget.checked, () => tpl.reload());
  },
  'click .js-encrypt-all'(event, tpl) {
    Meteor.call('encryptAllAttachments', () => Meteor.setTimeout(tpl.reload, 500));
  },
  'click .js-decrypt-all'(event, tpl) {
    Meteor.call('decryptAllAttachments', () => Meteor.setTimeout(tpl.reload, 500));
  },
});
