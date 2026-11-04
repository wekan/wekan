import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';

// #6870: whether the administrator blocked attachment uploads for the whole site
// (models/lib/attachmentUploadPolicy.js). Asked of the server once a minute at most; until it
// answers - or if it cannot - uploads are shown as before, because the server refuses them either
// way and a wrong guess here only costs a button.
const blocked = new ReactiveVar(false);
let askedAt = 0;

export function refreshUploadPolicy() {
  if (Date.now() - askedAt < 60 * 1000) return;
  askedAt = Date.now();
  Meteor.callAsync('attachmentUploadPolicy')
    .then(policy => blocked.set(!!(policy && policy.uploadsBlocked === true)))
    .catch(() => { askedAt = 0; });
}

// reactive
export function attachmentUploadsBlocked() {
  refreshUploadPolicy();
  return blocked.get();
}
