import { Meteor } from 'meteor/meteor';
const { userFieldsProjection } = require('/models/lib/userFieldsProjection');

// #6745: the current user with ONLY the given fields (plus _id), or null when
// nobody is logged in or the document has not arrived yet - the same two cases
// Meteor.user() returns null for. The document keeps the Users helpers, so
// `currentUserWith(['profile.showWeekOfYear']).isShowWeekOfYear()` still works.
//
// Use it in helpers that run once per minicard. The calling computation then
// re-runs only when one of these fields changes, not on every write to the user
// document - opening a card is one such write. See
// models/lib/userFieldsProjection.js.
export function currentUserWith(paths) {
  const userId = Meteor.userId();
  if (!userId) return null;
  const fields = userFieldsProjection(paths);
  return Meteor.users.findOne(userId, fields ? { fields } : {}) || null;
}
